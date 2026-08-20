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
        .exam-subject { text-align: center; font-size: 13px; margin-bottom: 14px; }
        table.meta { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        table.meta td { border: 1px solid #333; padding: 6px 10px; font-size: 11.5px; }
        table.meta td.label { font-weight: bold; width: 110px; background: #f3f3f3; }
        .instructions-box { border: 1px solid #333; padding: 10px 12px; margin-bottom: 18px; font-size: 11.5px; }
        .instructions-box .instructions-title { font-weight: bold; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.5px; margin: 0 0 5px; }
        .instructions-box p { margin: 0; white-space: pre-wrap; }
        .section { margin-bottom: 22px; page-break-inside: avoid; }
        .section-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #1a1a1a; padding-bottom: 3px; margin-bottom: 4px; }
        .section-instructions { font-size: 11px; font-style: italic; color: #333; margin-bottom: 10px; }
        .question { margin-bottom: 10px; page-break-inside: avoid; }
        .question .q-text { font-weight: bold; }
        .q-marks { float: right; font-weight: normal; font-style: italic; font-size: 10.5px; color: #444; }
        ul.options { list-style: none; margin: 5px 0 0; padding: 0; }
        ul.options li { margin-bottom: 3px; padding-left: 4px; }
        .answer-lines .line { border-bottom: 1px solid #999; height: 20px; margin-top: 4px; }
        table.matching { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.matching th, table.matching td { border: 1px solid #333; padding: 6px 8px; font-size: 11.5px; text-align: left; vertical-align: top; }
        table.matching th { background: #f3f3f3; }
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
            <td>{{ $examPaper->total_marks }}</td>
            <td class="label">Name / Admission No.</td>
            <td>&nbsp;</td>
        </tr>
    </table>

    @if($examPaper->instructions)
        <div class="instructions-box">
            <p class="instructions-title">Instructions to candidates</p>
            <p>{{ $examPaper->instructions }}</p>
        </div>
    @endif

    @foreach($examPaper->sections as $section)
        <div class="section">
            <p class="section-title">{{ $section['title'] ?? '' }}</p>
            @if($section['instructions'] ?? null)
                <p class="section-instructions">{{ $section['instructions'] }}</p>
            @endif

            @if($section['type'] === 'multiple_choice')
                @foreach($section['questions'] ?? [] as $question)
                    <div class="question">
                        <span class="q-marks">[{{ $question['marks'] ?? 0 }} mark{{ ($question['marks'] ?? 0) == 1 ? '' : 's' }}]</span>
                        <span class="q-text">{{ $question['number'] ?? '' }}. {{ $question['question'] ?? '' }}</span>
                        <ul class="options">
                            @foreach($question['options'] ?? [] as $option)
                                <li>{{ $option['label'] ?? '' }}. {{ $option['text'] ?? '' }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endforeach
            @elseif($section['type'] === 'matching')
                <table class="matching">
                    <thead>
                        <tr><th style="width:50%">Column A</th><th style="width:50%">Column B</th></tr>
                    </thead>
                    <tbody>
                        @foreach($section['left_items'] ?? [] as $index => $left)
                            <tr>
                                <td>{{ $left['key'] ?? '' }}. {{ $left['text'] ?? '' }}</td>
                                <td>{{ ($section['right_items'][$index]['key'] ?? '') }}. {{ ($section['right_items'][$index]['text'] ?? '') }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @elseif($section['type'] === 'short_answer')
                @foreach($section['questions'] ?? [] as $question)
                    <div class="question">
                        <span class="q-marks">[{{ $question['marks'] ?? 0 }} mark{{ ($question['marks'] ?? 0) == 1 ? '' : 's' }}]</span>
                        <span class="q-text">{{ $question['number'] ?? '' }}. {{ $question['question'] ?? '' }}</span>
                        <div class="answer-lines">
                            @for($i = 0; $i < max(2, min(6, (int) ceil(($question['marks'] ?? 5) / 2))); $i++)
                                <div class="line"></div>
                            @endfor
                        </div>
                    </div>
                @endforeach
            @endif
        </div>
    @endforeach

    <div class="footer">Generated by SchoolHub Africa &middot; {{ $school->name }}</div>
</body>
</html>
