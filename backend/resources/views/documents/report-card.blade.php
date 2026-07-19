<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 55px 50px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2933; font-size: 12px; line-height: 1.5; }
        .report-card { page-break-inside: avoid; }
        .report-card + .report-card { page-break-before: always; }
        .letterhead { text-align: center; border-bottom: 2px solid #4c1d95; padding-bottom: 14px; margin-bottom: 18px; }
        .letterhead .school-name { font-size: 20px; font-weight: bold; color: #4c1d95; margin: 0; }
        .letterhead .school-meta { font-size: 10px; color: #52606d; margin-top: 4px; }
        .title { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0; }
        .meta-table { width: 100%; margin-bottom: 16px; }
        .meta-table td { padding: 2px 0; font-size: 11px; }
        .meta-table td.label { color: #52606d; width: 140px; }
        table.data { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.data th, table.data td { border: 1px solid #cbd2d9; padding: 5px 8px; font-size: 11px; text-align: left; }
        table.data th { background: #f5f3ff; }
        .rank-cell { text-align: center; font-weight: bold; color: #4c1d95; }
        .summary { width: 100%; border-collapse: collapse; }
        .summary td { padding: 8px 10px; font-size: 11px; border: 1px solid #cbd2d9; }
        .summary td.label { color: #52606d; }
        .summary td.value { font-weight: bold; font-size: 13px; }
        .summary .headline td { background: #f5f3ff; }
        .remark-box { margin-top: 14px; border: 1px solid #cbd2d9; border-radius: 4px; padding: 10px 12px; font-size: 11px; }
        .remark-box .remark-title { font-weight: bold; color: #4c1d95; margin: 0 0 4px; }
        .remark-box p { margin: 0; }
        .footer { position: fixed; bottom: -38px; left: 0; right: 0; text-align: center; font-size: 9px; color: #9aa5b1; }
    </style>
</head>
<body>
    @foreach($reportCards as $card)
        <div class="report-card">
            <div class="letterhead">
                <p class="school-name">{{ $school->name }}</p>
                <p class="school-meta">
                    {{ collect([$school->address, $school->city, $school->country])->filter()->join(', ') }}
                </p>
            </div>

            <p class="title">Report Card &mdash; {{ $card['exam_name'] }}</p>

            <table class="meta-table">
                <tr>
                    <td class="label">Student name</td>
                    <td>{{ $card['student_name'] }}</td>
                    <td class="label">Admission number</td>
                    <td>{{ $card['admission_number'] }}</td>
                </tr>
                <tr>
                    <td class="label">Date issued</td>
                    <td>{{ now()->toFormattedDateString() }}</td>
                    <td class="label">Class position</td>
                    <td>
                        @if($card['summary']['class_position'])
                            {{ $card['summary']['class_position'] }} of {{ $card['summary']['class_size'] }}
                        @else
                            &mdash;
                        @endif
                    </td>
                </tr>
            </table>

            <table class="data">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Marks obtained</th>
                        <th>Max marks</th>
                        <th>Grade</th>
                        <th>Subject position</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($card['subjects'] as $subject)
                        <tr>
                            <td>{{ $subject['subject_name'] }}</td>
                            <td>{{ $subject['marks_obtained'] ?? '—' }}</td>
                            <td>{{ $subject['max_marks'] }}</td>
                            <td>{{ $subject['grade'] ?? '—' }}</td>
                            <td class="rank-cell">
                                @if($subject['subject_position'])
                                    {{ $subject['subject_position'] }} / {{ $subject['subject_size'] }}
                                @else
                                    &mdash;
                                @endif
                            </td>
                            <td>{{ $subject['remarks'] ?? '—' }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="6">No subjects recorded for this exam.</td></tr>
                    @endforelse
                </tbody>
            </table>

            <table class="summary">
                <tr class="headline">
                    <td class="label">Total marks</td>
                    <td class="value">{{ $card['summary']['total_obtained'] }} / {{ $card['summary']['total_max'] }}</td>
                    <td class="label">Average</td>
                    <td class="value">{{ $card['summary']['average_percentage'] !== null ? $card['summary']['average_percentage'] . '%' : '—' }}</td>
                    <td class="label">Overall grade</td>
                    <td class="value">{{ $card['summary']['overall_grade'] ?? '—' }}</td>
                    <td class="label">Class position</td>
                    <td class="value">
                        @if($card['summary']['class_position'])
                            {{ $card['summary']['class_position'] }} of {{ $card['summary']['class_size'] }}
                        @else
                            &mdash;
                        @endif
                    </td>
                </tr>
            </table>

            @if($card['summary']['performance_message'] ?? null)
                <div class="remark-box">
                    <p class="remark-title">{{ $card['summary']['performance_message']['emoji'] }} {{ $card['summary']['performance_message']['title'] }}</p>
                    <p>{{ $card['summary']['performance_message']['message'] }}</p>
                </div>
            @endif

            @if($card['summary']['class_teacher_remark'] ?? null)
                <div class="remark-box">
                    <p class="remark-title">Class Teacher's Remark</p>
                    <p>{{ $card['summary']['class_teacher_remark'] }}</p>
                </div>
            @endif

            <div class="footer">Generated by SchoolHub Africa &middot; {{ $school->name }}</div>
        </div>
    @endforeach
</body>
</html>
