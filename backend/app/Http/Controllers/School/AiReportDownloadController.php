<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AiGeneratedReport;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Re-verifies everything at download time rather than trusting the signed
 * URL alone — a signature only proves this exact link was legitimately
 * minted at some point, not that the current session still has access.
 * School isolation is enforced twice: implicit route-model binding on
 * AiGeneratedReport (BelongsToSchool) already 404s a cross-school report
 * before this method body runs at all, and the explicit check below is
 * belt-and-braces on top of that for this specifically sensitive endpoint.
 */
class AiReportDownloadController extends Controller
{
    public function download(Request $request, AiGeneratedReport $report)
    {
        abort_unless($report->school_id === Tenant::id(), 404);
        // Phase 1 has no report-sharing/history feature — only the person
        // who asked the assistant to generate it can download it.
        abort_unless($report->user_id === $request->user()->id, 403);

        if ($report->status !== 'completed') {
            abort(404, 'This report is not ready or failed to generate.');
        }

        if ($report->isExpired()) {
            abort(410, 'This report has expired. Ask the assistant to generate a new one.');
        }

        if (! Storage::disk('local')->exists($report->file_path)) {
            abort(404, 'This report file is no longer available.');
        }

        return Storage::disk('local')->download(
            $report->file_path,
            Str::slug($report->title).'.'.$report->format
        );
    }
}
