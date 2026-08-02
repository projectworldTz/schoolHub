<?php

namespace App\Services\AI\Reports;

use App\Exports\AttendanceExport;
use App\Exports\OutstandingFeesExport;
use App\Models\AiGeneratedReport;
use App\Models\School;
use App\Models\User;
use App\Services\AI\Reports\Types\AttendanceReport;
use App\Services\AI\Reports\Types\OutstandingFeesReport;
use App\Services\AI\Reports\Types\TimetableReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use RuntimeException;

/**
 * Turns an already-authorized report request into a stored file + an
 * AiGeneratedReport row. Authorization itself is delegated to each
 * Types\* class (same authorize()-returns-true-or-a-denial-string shape as
 * App\Services\AI\Tools\*), checked here before anything is rendered or
 * written to disk — a denied request never reaches the filesystem.
 */
class AiReportGenerator
{
    /** @var array<string, array<int, string>> */
    protected const SUPPORTED_FORMATS = [
        'outstanding_fees' => ['xlsx', 'csv', 'pdf'],
        'attendance' => ['xlsx', 'csv', 'pdf'],
        'timetable' => ['pdf'],
    ];

    /**
     * Used when the user didn't specify a format (or asked for one this
     * report type doesn't support) — PDF for formal/summary reports, Excel
     * for detailed tabular data, matching the spec's own default rule.
     *
     * @var array<string, string>
     */
    protected const DEFAULT_FORMATS = [
        'outstanding_fees' => 'xlsx',
        'attendance' => 'xlsx',
        'timetable' => 'pdf',
    ];

    public function __construct(
        protected OutstandingFeesReport $feesReport,
        protected AttendanceReport $attendanceReport,
        protected TimetableReport $timetableReport,
    ) {}

    public static function supportedReportTypes(): array
    {
        return array_keys(self::SUPPORTED_FORMATS);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{report: ?AiGeneratedReport, denied: ?string}
     */
    public function generate(string $reportType, array $params, User $user, School $school): array
    {
        $format = $this->resolveFormat($reportType, $params['format'] ?? null);

        [$authorized, $gather] = $this->resolve($reportType, $params, $user, $school);

        if ($authorized !== true) {
            return ['report' => null, 'denied' => $authorized];
        }

        $result = $gather();

        $report = AiGeneratedReport::create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'report_type' => $reportType,
            'title' => $result['title'],
            'format' => $format,
            'file_path' => '',
            'filters' => $params,
            'status' => 'pending',
        ]);

        try {
            $path = $this->render($reportType, $format, $result, $school, $user);

            $report->update([
                'file_path' => $path,
                'file_size' => Storage::disk('local')->size($path),
                'status' => 'completed',
                'expires_at' => now()->addHours(config('ai-reports.retention_hours')),
            ]);
        } catch (\Throwable $e) {
            $report->update(['status' => 'failed', 'failure_reason' => $e->getMessage()]);

            throw new RuntimeException('The report could not be generated. Please try again shortly.', previous: $e);
        }

        return ['report' => $report->fresh(), 'denied' => null];
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{0: bool|string, 1: \Closure(): array{title: string, rows: array<int, array<string, mixed>>, truncated: bool}}
     */
    protected function resolve(string $reportType, array $params, User $user, School $school): array
    {
        return match ($reportType) {
            'outstanding_fees' => [
                $this->feesReport->authorize($user),
                fn () => $this->feesReport->data($params, $school),
            ],
            'attendance' => [
                $this->attendanceReport->authorize($user),
                fn () => $this->attendanceReport->data($user, $params, $school, $school->timezone ?? config('app.timezone')),
            ],
            'timetable' => [
                $this->timetableReport->authorize($user, $params),
                fn () => $this->timetableReport->data($user, $params),
            ],
            default => [false, fn () => ['title' => '', 'rows' => [], 'truncated' => false]],
        };
    }

    /** @param  array{title: string, rows: array<int, array<string, mixed>>, truncated: bool}  $result */
    protected function render(string $reportType, string $format, array $result, School $school, User $user): string
    {
        $directory = "ai-reports/{$school->id}";
        $filename = \Illuminate\Support\Str::slug($result['title']).'-'.now()->format('YmdHis');

        if ($format === 'pdf') {
            $pdf = Pdf::loadView("reports.{$this->viewName($reportType)}", [
                'school' => $school,
                'title' => $result['title'],
                'rows' => $result['rows'],
                'truncated' => $result['truncated'],
                'generatedBy' => $user->name,
            ]);

            $path = "{$directory}/{$filename}.pdf";
            Storage::disk('local')->put($path, $pdf->output());

            return $path;
        }

        $export = match ($reportType) {
            'outstanding_fees' => new OutstandingFeesExport($result['rows']),
            'attendance' => new AttendanceExport($result['rows']),
            default => throw new RuntimeException("No spreadsheet export is defined for \"{$reportType}\"."),
        };

        $extension = $format === 'csv' ? 'csv' : 'xlsx';
        $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;
        $path = "{$directory}/{$filename}.{$extension}";

        Excel::store($export, $path, 'local', $writerType);

        return $path;
    }

    protected function viewName(string $reportType): string
    {
        return match ($reportType) {
            'outstanding_fees' => 'outstanding-fees',
            default => $reportType,
        };
    }

    protected function resolveFormat(string $reportType, ?string $requested): string
    {
        $normalized = match (strtolower((string) $requested)) {
            'excel', 'spreadsheet', 'xls', 'dataset' => 'xlsx',
            'csv', 'csv file' => 'csv',
            'pdf', 'pdf document' => 'pdf',
            default => strtolower((string) $requested),
        };

        $supported = self::SUPPORTED_FORMATS[$reportType] ?? ['pdf'];

        if (in_array($normalized, $supported, true)) {
            return $normalized;
        }

        return self::DEFAULT_FORMATS[$reportType] ?? ($supported[0] ?? 'pdf');
    }
}
