<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI-generated report limits
    |--------------------------------------------------------------------------
    |
    | A cheap, direct safety net against a runaway export: no single report
    | this pipeline generates includes more than this many data rows,
    | regardless of how the request was phrased.
    |
    */
    'max_rows' => (int) env('AI_REPORT_MAX_ROWS', 5000),

    /*
    |--------------------------------------------------------------------------
    | Download link lifetime
    |--------------------------------------------------------------------------
    |
    | How long the signed download URL handed back in the chat reply stays
    | valid. Re-asking the assistant generates a fresh report + fresh link.
    |
    */
    'download_expiry_minutes' => (int) env('AI_REPORT_DOWNLOAD_EXPIRY_MINUTES', 15),

    /*
    |--------------------------------------------------------------------------
    | File retention
    |--------------------------------------------------------------------------
    |
    | How long a generated file is kept on disk before
    | ai-reports:cleanup deletes it and marks the record expired — separate
    | from download_expiry_minutes, which only governs the signed URL.
    |
    */
    'retention_hours' => (int) env('AI_REPORT_RETENTION_HOURS', 24),

];
