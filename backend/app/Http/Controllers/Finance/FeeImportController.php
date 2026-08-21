<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Services\Finance\FeeImportService;
use Illuminate\Http\Request;

class FeeImportController extends Controller
{
    public function __construct(protected FeeImportService $importer) {}

    /**
     * dry_run=true (the default) validates and reports every row without
     * writing anything — the frontend's "Preview" step. dry_run=false
     * commits valid rows (grouping same-student/year/term charges into one
     * invoice each) and skips invalid/excluded/already-invoiced rows; a bad
     * row never blocks the rest of the file.
     */
    public function import(Request $request)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $result = $this->importer->process(
            $data['file'],
            ! $request->boolean('dry_run', true),
            $request->user()->id
        );

        return response()->json(['data' => $result]);
    }
}
