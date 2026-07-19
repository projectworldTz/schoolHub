<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Services\School\StudentImportService;
use Illuminate\Http\Request;

class StudentImportController extends Controller
{
    public function __construct(protected StudentImportService $importer) {}

    /**
     * dry_run=true (the default) validates and reports every row without
     * writing anything — the frontend's "Preview" step. dry_run=false
     * commits valid rows and skips invalid ones; a bad row never blocks
     * the rest of the file, so the response always reports every row's
     * outcome either way, letting the same preview screen just re-render
     * with real student_ids once confirmed.
     */
    public function import(Request $request)
    {
        abort_unless($request->user()->can('students.manage'), 403);

        // Not validated as 'boolean': that rule only accepts true/false/0/1,
        // not the string "true"/"false" a multipart form field actually
        // sends — $request->boolean() below already coerces either safely.
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $result = $this->importer->process($data['file'], ! $request->boolean('dry_run', true));

        return response()->json(['data' => $result]);
    }
}
