<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: A4 landscape; margin: 40px 35px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2933; font-size: 11px; line-height: 1.5; }
        .letterhead { text-align: center; border-bottom: 2px solid #4c1d95; padding-bottom: 14px; margin-bottom: 18px; }
        .letterhead .school-name { font-size: 20px; font-weight: bold; color: #4c1d95; margin: 0; }
        .letterhead .school-meta { font-size: 10px; color: #52606d; margin-top: 4px; }
        .title { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 4px; }
        .subtitle { text-align: center; font-size: 11px; color: #52606d; margin: 0 0 18px; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th, table.data td { border: 1px solid #cbd2d9; padding: 5px 7px; font-size: 10px; text-align: left; }
        table.data th { background: #f5f3ff; }
        .rank-cell, .center { text-align: center; }
        .rank-cell { font-weight: bold; color: #4c1d95; }
        .low { color: #7f1d1d; font-weight: bold; }
        .summary { margin-top: 22px; page-break-inside: avoid; }
        .summary-title { font-size: 13px; font-weight: bold; color: #4c1d95; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; }
        .summary-row { display: table; width: 100%; table-layout: fixed; margin-bottom: 12px; }
        .summary-cell { display: table-cell; border: 1px solid #cbd2d9; padding: 8px 10px; text-align: center; }
        .summary-cell .value { display: block; font-size: 16px; font-weight: bold; }
        .summary-cell .label { display: block; font-size: 9.5px; color: #52606d; margin-top: 2px; }
        .summary-cell.passed .value { color: #166534; }
        .summary-cell.failed .value { color: #7f1d1d; }
        table.grades th, table.grades td { border: 1px solid #cbd2d9; padding: 5px 7px; font-size: 10px; text-align: center; }
        table.grades th { background: #f5f3ff; }
        table.grades td.low { background: #fee2e2; }
        .footer { position: fixed; bottom: -30px; left: 0; right: 0; text-align: center; font-size: 9px; color: #9aa5b1; }
    </style>
</head>
<body>
    <div class="letterhead">
        @include('components.school-logo')
        <p class="school-name">{{ $school->name }}</p>
        <p class="school-meta">
            {{ collect([$school->address, $school->city, $school->country])->filter()->join(', ') }}
        </p>
    </div>

    <p class="title">Exam Results &mdash; {{ $schoolClass->name }}</p>
    <p class="subtitle">{{ $exam->name }} &middot; Generated {{ now()->toFormattedDateString() }}</p>

    <table class="data">
        <thead>
            <tr>
                <th class="center" style="width: 32px;">Rank</th>
                <th>Student</th>
                <th>Admission #</th>
                @foreach($examSubjects as $examSubject)
                    <th class="center">{{ $examSubject->subject->name }}</th>
                @endforeach
                <th class="center">Average</th>
                <th class="center">Grade</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ranking as $row)
                <tr>
                    <td class="rank-cell">{{ $row['position'] }}</td>
                    <td>{{ $row['name'] }}</td>
                    <td>{{ $row['admission_number'] }}</td>
                    @foreach($examSubjects as $examSubject)
                        @php($result = $scores->get($row['student_id'])?->get($examSubject->id))
                        <td class="center {{ $isLowGrade($result?->grade) ? 'low' : '' }}">
                            {{ $result?->marks_obtained ?? '—' }}
                        </td>
                    @endforeach
                    <td class="center">{{ $row['average_percentage'] }}%</td>
                    <td class="center {{ $isLowGrade($row['grade']) ? 'low' : '' }}">{{ $row['grade'] ?? '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        <p class="summary-title">Overall performance summary</p>

        <div class="summary-row">
            <div class="summary-cell">
                <span class="value">{{ $ranking->count() }}</span>
                <span class="label">Students graded</span>
            </div>
            <div class="summary-cell passed">
                <span class="value">{{ $passedCount }}</span>
                <span class="label">Passed</span>
            </div>
            <div class="summary-cell failed">
                <span class="value">{{ $failedCount }}</span>
                <span class="label">Failed</span>
            </div>
            <div class="summary-cell">
                <span class="value">{{ round($ranking->avg('average_percentage'), 1) }}%</span>
                <span class="label">Class average</span>
            </div>
        </div>

        @if(count($gradeCounts) > 0)
            <table class="grades">
                <thead>
                    <tr>
                        @foreach($gradeCounts as $label => $count)
                            <th>{{ $label }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        @foreach($gradeCounts as $label => $count)
                            <td class="{{ $isLowGrade($label) ? 'low' : '' }}">{{ $count }}</td>
                        @endforeach
                    </tr>
                </tbody>
            </table>
        @endif
    </div>

    <div class="footer">Generated by SchoolHub Africa &middot; {{ $school->name }}</div>
</body>
</html>
