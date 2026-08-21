<?php

namespace App\Services\Finance;

use App\Models\AcademicYear;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentFeeExclusion;
use App\Models\Term;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Bulk-charges students from a CSV export of a school's existing fee ledger
 * (a spreadsheet, another system's export) — the same "preview, then
 * confirm" shape as StudentImportService: process() always validates and
 * reports every row, $commit just controls whether valid rows are actually
 * persisted, so preview and commit can never disagree.
 *
 * Unlike a plain "create a row per line" import, each row is one *charge*
 * (student + fee category + amount) for a period, not one invoice — rows
 * for the same student/academic year/term are grouped into a single
 * Invoice with one InvoiceItem per charge, mirroring how
 * InvoiceService::generateForClass() bills a class. This is what makes the
 * result match what the student/parent already sees elsewhere in the app
 * instead of producing one invoice per fee category.
 *
 * Every row is cross-checked against the student's actual fee setup before
 * it's allowed to charge them:
 *   - the fee category must already exist (never silently auto-created —
 *     a typo'd category name is rejected, not billed under a new category)
 *   - a student excluded from that category for that year (see
 *     StudentFeeExclusion) is skipped, never charged
 *   - a pay-once fee structure already billed to the student on any prior
 *     invoice is skipped again, same rule generateForClass() enforces
 *   - when a matching FeeStructure exists for the category/year/term/class,
 *     the row's amount is compared to it and a mismatch is only a warning
 *     (a per-student override — e.g. a scholarship — is legitimate), never
 *     a hard error
 *   - a student already invoiced for that exact category/year/term (from an
 *     earlier import or manual entry) is skipped, so re-uploading the same
 *     file never double-charges
 */
class FeeImportService
{
    protected const REQUIRED_HEADERS = ['admission_number', 'academic_year', 'fee_category', 'amount'];

    protected const PAYMENT_METHODS = ['cash', 'bank_transfer', 'mobile_money', 'card', 'cheque', 'other'];

    public function __construct(protected InvoiceService $invoiceService) {}

    public function process(UploadedFile $file, bool $commit, ?string $actorId): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = $this->normalizeHeader(fgetcsv($handle) ?: []);

        $missingHeaders = array_values(array_diff(self::REQUIRED_HEADERS, $header));
        if (! empty($missingHeaders)) {
            fclose($handle);

            return [
                'total_rows' => 0,
                'invoice_count' => 0,
                'created_count' => 0,
                'skipped_count' => 0,
                'error_count' => 0,
                'committed' => false,
                'missing_headers' => $missingHeaders,
                'rows' => [],
            ];
        }

        $rows = [];
        $rowNumber = 1;
        while (($line = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if (count(array_filter($line, fn ($v) => $v !== null && $v !== '')) === 0) {
                continue; // skip blank lines
            }

            $data = array_combine($header, array_pad($line, count($header), null));
            $data = array_map(fn ($v) => is_string($v) ? trim($v) : $v, $data);

            $rows[] = ['row' => $rowNumber, 'data' => $data];
        }
        fclose($handle);

        // Pass 1: resolve and validate every row independently — student,
        // academic year, term, fee category, amounts. Nothing is written
        // here; a row that fails is final (status 'error') and never
        // reaches grouping.
        $seenKeys = [];
        $existingInvoiceItemsCache = [];
        $parsed = [];
        foreach ($rows as $entry) {
            $parsed[] = $this->parseRow($entry['data'], $entry['row'], $seenKeys, $existingInvoiceItemsCache);
        }

        // Pass 2: group every still-pending row by (student, academic year,
        // term) — this is what turns several fee-category charges for the
        // same student/period into one invoice with several line items,
        // instead of one invoice per row.
        $groups = [];
        foreach ($parsed as $index => $row) {
            if ($row['status'] !== 'pending') {
                continue;
            }
            $key = $row['_group_key'];
            $groups[$key]['indices'][] = $index;
            $groups[$key]['student'] = $row['_student'];
            $groups[$key]['academic_year'] = $row['_academic_year'];
            $groups[$key]['term'] = $row['_term'];
        }

        $createdCount = 0;
        $skippedCount = 0;
        $invoiceCount = 0;

        foreach ($groups as $group) {
            $invoiceCreated = $this->processGroup($group, $parsed, $commit, $actorId);
            if ($invoiceCreated) {
                $invoiceCount++;
            }
        }

        foreach ($parsed as &$row) {
            if ($row['status'] === 'pending') {
                // Only reachable if processGroup() didn't touch this row for
                // some reason — treat as an error rather than silently
                // reporting nothing.
                $row['status'] = 'error';
                $row['errors'][] = 'Could not be processed.';
            }
            if ($row['status'] === 'created' || $row['status'] === 'would_create') {
                $createdCount++;
            } elseif ($row['status'] === 'skipped') {
                $skippedCount++;
            }
        }
        unset($row);

        $errorCount = count(array_filter($parsed, fn ($r) => $r['status'] === 'error'));

        return [
            'total_rows' => count($parsed),
            'invoice_count' => $invoiceCount,
            'created_count' => $createdCount,
            'skipped_count' => $skippedCount,
            'error_count' => $errorCount,
            'committed' => $commit,
            'missing_headers' => [],
            'rows' => array_map(fn ($r) => $this->publicRow($r), $parsed),
        ];
    }

    /**
     * @param  array<string, bool>  $seenKeys
     * @param  array<string, Collection>  $existingInvoiceItemsCache
     */
    protected function parseRow(array $data, int $rowNumber, array &$seenKeys, array &$existingInvoiceItemsCache): array
    {
        $admissionNumber = $data['admission_number'] ?? '';
        $academicYearName = $data['academic_year'] ?? '';
        $termName = $data['term'] ?? '';
        $categoryName = $data['fee_category'] ?? '';
        $amountRaw = $data['amount'] ?? '';
        $dueDate = $data['due_date'] ?? '';
        $amountPaidRaw = $data['amount_paid'] ?? '';
        $paymentMethod = strtolower((string) ($data['payment_method'] ?? ''));
        $paymentReference = $data['payment_reference'] ?? '';
        $paymentDate = $data['payment_date'] ?? '';

        $errors = [];
        $warnings = [];

        $result = [
            'row' => $rowNumber,
            'admission_number' => $admissionNumber,
            'student_name' => null,
            'academic_year' => $academicYearName,
            'term' => $termName ?: null,
            'fee_category' => $categoryName,
            'amount' => $amountRaw,
            'amount_paid' => $amountPaidRaw ?: null,
            'invoice_number' => null,
            'status' => 'error',
            'errors' => &$errors,
            'warnings' => &$warnings,
        ];

        if ($admissionNumber === '') {
            $errors[] = 'Admission number is required.';
        }
        if ($academicYearName === '') {
            $errors[] = 'Academic year is required.';
        }
        if ($categoryName === '') {
            $errors[] = 'Fee category is required.';
        }
        if ($amountRaw === '' || ! is_numeric($amountRaw)) {
            $errors[] = 'Amount must be a positive number.';
        } elseif ((float) $amountRaw <= 0) {
            $errors[] = 'Amount must be greater than zero.';
        }

        if (! empty($errors)) {
            return $result;
        }

        $student = Student::where('admission_number', $admissionNumber)->first();
        if (! $student) {
            $errors[] = "Student with admission number '{$admissionNumber}' not found.";

            return $result;
        }
        $result['student_name'] = $student->full_name;

        $academicYear = AcademicYear::whereRaw('LOWER(name) = ?', [strtolower($academicYearName)])->first();
        if (! $academicYear) {
            $errors[] = "Academic year '{$academicYearName}' not found.";

            return $result;
        }

        $term = null;
        if ($termName !== '') {
            $term = Term::where('academic_year_id', $academicYear->id)
                ->whereRaw('LOWER(name) = ?', [strtolower($termName)])
                ->first();
            if (! $term) {
                $errors[] = "Term '{$termName}' not found for academic year '{$academicYearName}'.";

                return $result;
            }
        }

        $feeCategory = FeeCategory::whereRaw('LOWER(name) = ?', [strtolower($categoryName)])->first();
        if (! $feeCategory) {
            $errors[] = "Fee category '{$categoryName}' does not exist — create it under Finance > Fee Setup first, or fix this row's spelling.";

            return $result;
        }

        $amount = round((float) $amountRaw, 2);

        // Duplicate charge earlier in this same file (same student/category/
        // period) — always an error, since there's no way to know which of
        // the two rows should win.
        $dupeKey = "{$student->id}|{$feeCategory->id}|{$academicYear->id}|".($term?->id ?? 'none');
        if (isset($seenKeys[$dupeKey])) {
            $errors[] = "Duplicate charge for {$student->full_name} / {$feeCategory->name} earlier in this file.";

            return $result;
        }
        $seenKeys[$dupeKey] = true;

        // amount_paid / payment fields, only if a paid amount was given.
        $amountPaid = null;
        $paidAt = null;
        if ($amountPaidRaw !== '' && $amountPaidRaw !== null) {
            if (! is_numeric($amountPaidRaw) || (float) $amountPaidRaw < 0) {
                $errors[] = 'Amount paid must be zero or a positive number.';
            } elseif ((float) $amountPaidRaw > $amount) {
                $errors[] = 'Amount paid cannot exceed the charge amount for this row.';
            } else {
                $amountPaid = round((float) $amountPaidRaw, 2);
            }

            if ($amountPaid !== null && $amountPaid > 0) {
                if ($paymentMethod === '') {
                    $errors[] = 'payment_method is required when amount_paid is set.';
                } elseif (! in_array($paymentMethod, self::PAYMENT_METHODS, true)) {
                    $errors[] = 'payment_method must be one of: '.implode(', ', self::PAYMENT_METHODS).'.';
                }

                $paidAt = $paymentDate !== '' ? $paymentDate : now()->toDateString();
            }
        }

        if (! empty($errors)) {
            return $result;
        }

        // Student excluded from this optional category for this year — a
        // deliberate business rule (see StudentFeeExclusion), not a data
        // mistake, so this is a skip rather than an error.
        $excluded = StudentFeeExclusion::where('student_id', $student->id)
            ->where('fee_category_id', $feeCategory->id)
            ->where('academic_year_id', $academicYear->id)
            ->exists();
        if ($excluded) {
            $result['status'] = 'skipped';
            $warnings[] = "{$student->full_name} is excluded from {$feeCategory->name} for {$academicYearName} — skipped.";

            return $result;
        }

        // Already invoiced for this exact category/year/term — from an
        // earlier run of this same import, or manual entry. Cached per
        // (student, year, term) since several rows in the file commonly
        // share that key.
        $cacheKey = "{$student->id}|{$academicYear->id}|".($term?->id ?? 'none');
        if (! array_key_exists($cacheKey, $existingInvoiceItemsCache)) {
            $existingInvoiceItemsCache[$cacheKey] = Invoice::where('student_id', $student->id)
                ->where('academic_year_id', $academicYear->id)
                ->where('term_id', $term?->id)
                ->where('status', '!=', 'cancelled')
                ->with(['items' => fn ($q) => $q->with(['feeStructure' => fn ($q) => $q->withTrashed()])])
                ->get()
                ->flatMap(fn (Invoice $invoice) => $invoice->items);
        }
        $alreadyInvoiced = $existingInvoiceItemsCache[$cacheKey]->contains(
            fn ($item) => $item->feeStructure?->fee_category_id === $feeCategory->id
                || (! $item->fee_structure_id && strcasecmp($item->description, $feeCategory->name) === 0)
        );
        if ($alreadyInvoiced) {
            $result['status'] = 'skipped';
            $warnings[] = "{$student->full_name} already has an invoice covering {$feeCategory->name} for this period — skipped to avoid double-charging.";

            return $result;
        }

        // Match against a defined Fee Structure for this category/year/term
        // and the student's current class, so the invoice item stays linked
        // to it (consistent with generated invoices) and pay-once billing
        // is respected. No match just means an ad-hoc charge — the schema
        // explicitly allows an invoice item with no fee_structure_id.
        $enrollment = StudentEnrollment::where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->where('status', 'active')
            ->first();

        $feeStructure = FeeStructure::where('fee_category_id', $feeCategory->id)
            ->where('academic_year_id', $academicYear->id)
            ->where(fn ($q) => $q->whereNull('term_id')->orWhere('term_id', $term?->id))
            ->where(fn ($q) => $q->whereNull('school_class_id')->orWhere('school_class_id', $enrollment?->school_class_id))
            ->orderByRaw('term_id IS NULL, school_class_id IS NULL') // prefer the most specific match
            ->first();

        if ($feeStructure) {
            if (bccomp((string) $feeStructure->amount, (string) $amount, 2) !== 0) {
                $warnings[] = 'Amount '.number_format($amount, 2).' differs from the defined fee structure amount ('.number_format((float) $feeStructure->amount, 2).') for '.$feeCategory->name.' — charged as entered.';
            }

            if ($feeStructure->pay_once) {
                $alreadyBilled = InvoiceItem::where('fee_structure_id', $feeStructure->id)
                    ->whereHas('invoice', fn ($q) => $q->where('student_id', $student->id)->where('status', '!=', 'cancelled'))
                    ->exists();
                if ($alreadyBilled) {
                    $result['status'] = 'skipped';
                    $warnings[] = "{$feeCategory->name} is a pay-once fee already billed to {$student->full_name} previously — skipped.";

                    return $result;
                }
            }
        } else {
            $warnings[] = "No fee structure found for {$feeCategory->name} in this period — will be added as a custom charge.";
        }

        $result['status'] = 'pending';
        $result['_group_key'] = "{$student->id}|{$academicYear->id}|".($term?->id ?? 'none');
        $result['_student'] = $student;
        $result['_academic_year'] = $academicYear;
        $result['_term'] = $term;
        $result['_fee_category'] = $feeCategory;
        $result['_fee_structure'] = $feeStructure;
        $result['_amount'] = $amount;
        $result['_due_date'] = $dueDate !== '' ? $dueDate : null;
        $result['_amount_paid'] = $amountPaid;
        $result['_payment_method'] = $paymentMethod ?: null;
        $result['_payment_reference'] = $paymentReference !== '' ? $paymentReference : null;
        $result['_paid_at'] = $paidAt;

        return $result;
    }

    /**
     * Creates (or, in preview mode, describes) one invoice for a
     * student/academic-year/term group, with one line item per row in the
     * group, and records a payment per row that carried an amount_paid.
     *
     * @param  array{indices: array<int>, student: Student, academic_year: AcademicYear, term: ?Term}  $group
     * @param  array<int, array>  $parsed  passed by reference — rows are updated in place
     */
    protected function processGroup(array $group, array &$parsed, bool $commit, ?string $actorId): bool
    {
        $indices = $group['indices'];
        if (empty($indices)) {
            return false;
        }

        $totalAmount = array_sum(array_map(fn ($i) => $parsed[$i]['_amount'], $indices));
        $dueDate = null;
        foreach ($indices as $i) {
            if ($parsed[$i]['_due_date']) {
                $dueDate = $parsed[$i]['_due_date'];
                break;
            }
        }

        if (! $commit) {
            foreach ($indices as $i) {
                $parsed[$i]['status'] = 'would_create';
                if (count($indices) > 1) {
                    $parsed[$i]['warnings'][] = 'Will be grouped with '.(count($indices) - 1).' other charge(s) into one invoice totalling '.number_format($totalAmount, 2).'.';
                }
            }

            return true;
        }

        DB::transaction(function () use ($group, $indices, &$parsed, $totalAmount, $dueDate, $actorId) {
            $invoice = Invoice::create([
                'student_id' => $group['student']->id,
                'academic_year_id' => $group['academic_year']->id,
                'term_id' => $group['term']?->id,
                'invoice_number' => $this->invoiceService->generateInvoiceNumber(),
                'total_amount' => $totalAmount,
                'due_date' => $dueDate,
            ]);

            foreach ($indices as $i) {
                $row = $parsed[$i];

                $invoice->items()->create([
                    'fee_structure_id' => $row['_fee_structure']?->id,
                    'description' => $row['_fee_category']->name,
                    'amount' => $row['_amount'],
                ]);

                if ($row['_amount_paid'] !== null && $row['_amount_paid'] > 0) {
                    $this->invoiceService->recordPayment($invoice, [
                        'fee_category_id' => $row['_fee_category']->id,
                        'amount' => $row['_amount_paid'],
                        'method' => $row['_payment_method'],
                        'reference' => $row['_payment_reference'],
                        'paid_at' => $row['_paid_at'],
                    ], $actorId);
                }

                $parsed[$i]['status'] = 'created';
                $parsed[$i]['invoice_number'] = $invoice->invoice_number;
            }
        });

        return true;
    }

    protected function publicRow(array $row): array
    {
        return [
            'row' => $row['row'],
            'admission_number' => $row['admission_number'],
            'student_name' => $row['student_name'],
            'academic_year' => $row['academic_year'],
            'term' => $row['term'],
            'fee_category' => $row['fee_category'],
            'amount' => $row['amount'],
            'amount_paid' => $row['amount_paid'],
            'invoice_number' => $row['invoice_number'],
            'status' => $row['status'],
            'errors' => $row['errors'],
            'warnings' => $row['warnings'],
        ];
    }

    protected function normalizeHeader(array $header): array
    {
        return array_map(fn ($h) => strtolower(trim((string) $h)), $header);
    }
}
