<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 60px 55px; }
        body { font-family: "Times New Roman", DejaVu Serif, serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; }
        .letterhead { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
        .letterhead .school-name { font-size: 19px; font-weight: bold; letter-spacing: 0.5px; margin: 0; text-transform: uppercase; }
        .letterhead .school-meta { font-size: 10.5px; color: #444; margin-top: 4px; }
        .exam-title { text-align: center; font-size: 17px; font-weight: bold; margin: 16px 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .exam-subtitle { text-align: center; font-size: 12px; font-style: italic; color: #444; margin-bottom: 4px; }
        .exam-subject { text-align: center; font-size: 13px; margin-bottom: 14px; }
        table.meta { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        table.meta td { border: 1px solid #333; padding: 6px 10px; font-size: 11.5px; }
        table.meta td.label { font-weight: bold; width: 110px; background: #f3f3f3; }
        .section { margin-bottom: 20px; page-break-inside: avoid; }
        .section-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #1a1a1a; padding-bottom: 3px; margin-bottom: 8px; }
        .question { margin-bottom: 8px; }
        .q-marks { float: right; font-weight: normal; font-style: italic; font-size: 10.5px; color: #444; }
        .q-text { font-weight: bold; }
        .answer { margin: 3px 0 0 14px; }
        .answer .answer-label { font-weight: bold; color: #1a1a1a; }
        table.matching { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.matching th, table.matching td { border: 1px solid #333; padding: 6px 8px; font-size: 11.5px; text-align: left; vertical-align: top; }
        table.matching th { background: #f3f3f3; }
        table.summary { width: 100%; border-collapse: collapse; margin-top: 22px; }
        table.summary th, table.summary td { border: 1px solid #333; padding: 6px 10px; font-size: 11.5px; }
        table.summary th { background: #f3f3f3; text-align: left; }
        table.summary td.marks { text-align: right; width: 100px; }
        table.summary tr.total td { font-weight: bold; background: #f3f3f3; }
        .footer { position: fixed; bottom: -42px; left: 0; right: 0; text-align: center; font-size: 9px; color: #888; }
    </style>
</head>
<body>
    <div class="letterhead">
        <p class="school-name">{{ $school->name }}</p>
        <p class="school-meta">
            {{ collect([$school->address, $school->city, $school->country])->filter()->join(', ') }}
        </p>
    </div>

    <p class="exam-title">{{ $examPaper->title }}</p>
    <p class="exam-subtitle">Marking Scheme &mdash; For examiner use only</p>
    <p class="exam-subject">{{ $examPaper->subject->name }} &middot; {{ $examPaper->schoolClass->name }}</p>

    <table class="meta">
        <tr>
            <td class="label">Date</td>
            <td>{{ $examPaper->exam_date?->toFormattedDateString() ?? 'To be announced' }}</td>
            <td class="label">Duration</td>
            <td>{{ $examPaper->duration_minutes }} minutes</td>
        </tr>
        <tr>
            <td class="label">Total marks</td>
            <td colspan="3">{{ $examPaper->total_marks }}</td>
        </tr>
    </table>

    @foreach($examPaper->sections as $section)
        <div class="section">
            <p class="section-title">{{ $section['title'] ?? '' }}</p>

            @if($section['type'] === 'multiple_choice')
                @foreach($section['questions'] ?? [] as $question)
                    <div class="question">
                        <span class="q-marks">[{{ $question['marks'] ?? 0 }} mark{{ ($question['marks'] ?? 0) == 1 ? '' : 's' }}]</span>
                        <span class="q-text">{{ $question['number'] ?? '' }}. {{ $question['question'] ?? '' }}</span>
                        <p class="answer"><span class="answer-label">Correct answer:</span> {{ $question['correct_option'] ?? '—' }}</p>
                    </div>
                @endforeach
            @elseif($section['type'] === 'matching')
                <table class="matching">
                    <thead>
                        <tr><th>Column A</th><th>Correct match (Column B)</th></tr>
                    </thead>
                    <tbody>
                        @php
                            $rightByKey = collect($section['right_items'] ?? [])->keyBy('key');
                        @endphp
                        @foreach($section['left_items'] ?? [] as $left)
                            @php
                                $matchKey = $section['correct_matches'][$left['key'] ?? ''] ?? null;
                                $match = $matchKey !== null ? $rightByKey->get($matchKey) : null;
                            @endphp
                            <tr>
                                <td>{{ $left['key'] ?? '' }}. {{ $left['text'] ?? '' }}</td>
                                <td>{{ $match['key'] ?? ($matchKey ?? '—') }}@if($match). {{ $match['text'] }}@endif</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
                <p class="answer"><span class="answer-label">Marks per pair:</span> {{ $section['marks_per_pair'] ?? 0 }}</p>
            @elseif($section['type'] === 'short_answer')
                @foreach($section['questions'] ?? [] as $question)
                    <div class="question">
                        <span class="q-marks">[{{ $question['marks'] ?? 0 }} mark{{ ($question['marks'] ?? 0) == 1 ? '' : 's' }}]</span>
                        <span class="q-text">{{ $question['number'] ?? '' }}. {{ $question['question'] ?? '' }}</span>
                        <p class="answer"><span class="answer-label">Model answer:</span> {{ $question['model_answer'] ?? '—' }}</p>
                    </div>
                @endforeach
            @endif
        </div>
    @endforeach

    <table class="summary">
        <thead>
            <tr><th>Section</th><th style="text-align:right;">Marks</th></tr>
        </thead>
        <tbody>
            @foreach($examPaper->sections as $section)
                <tr>
                    <td>{{ $section['title'] ?? '' }}</td>
                    <td class="marks">
                        @if($section['type'] === 'matching')
                            {{ count($section['correct_matches'] ?? []) * ($section['marks_per_pair'] ?? 0) }}
                        @else
                            {{ collect($section['questions'] ?? [])->sum('marks') }}
                        @endif
                    </td>
                </tr>
            @endforeach
            <tr class="total">
                <td>Total</td>
                <td class="marks">{{ $examPaper->total_marks }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">Generated by SchoolHub Africa &middot; {{ $school->name }}</div>
</body>
</html>
