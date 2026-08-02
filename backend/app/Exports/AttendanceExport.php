<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * Same underlying rows App\Services\AI\Reports\Types\AttendanceReport
 * gathers — this class only knows how to lay them out as a spreadsheet.
 */
class AttendanceExport implements FromCollection, WithHeadings
{
    /** @param  array<int, array<string, mixed>>  $rows */
    public function __construct(protected array $rows) {}

    public function collection(): \Illuminate\Support\Collection
    {
        return collect($this->rows)->map(fn (array $row) => [
            $row['admission_number'],
            $row['student_name'],
            $row['class_name'] ?? '',
            $row['date'],
            $row['status'],
            $row['remarks'] ?? '',
        ]);
    }

    public function headings(): array
    {
        return ['Admission No.', 'Student', 'Class', 'Date', 'Status', 'Remarks'];
    }
}
