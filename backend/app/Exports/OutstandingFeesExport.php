<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * Same underlying rows App\Services\AI\Reports\Types\OutstandingFeesReport
 * gathers — this class only knows how to lay them out as a spreadsheet.
 * Serves both xlsx and csv (Maatwebsite\Excel\Facades\Excel::store()
 * picks the writer from the format argument, not this class).
 */
class OutstandingFeesExport implements FromCollection, WithHeadings
{
    /** @param  array<int, array<string, mixed>>  $rows */
    public function __construct(protected array $rows) {}

    public function collection(): \Illuminate\Support\Collection
    {
        return collect($this->rows)->map(fn (array $row) => [
            $row['admission_number'],
            $row['student_name'],
            $row['class_name'] ?? '',
            $row['total_billed'],
            $row['total_paid'],
            $row['outstanding_balance'],
            $row['status'],
        ]);
    }

    public function headings(): array
    {
        return ['Admission No.', 'Student', 'Class', 'Billed', 'Paid', 'Outstanding', 'Status'];
    }
}
