<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Services\School\GuardianImportService;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;

class GuardianImportController extends Controller
{
    public function __construct(protected GuardianImportService $importer) {}

    /**
     * Same dry_run=true (preview, default) / dry_run=false (commit) shape as
     * StudentImportController::import(). Gated on students.manage, matching
     * StudentGuardianController::store() — attaching a guardian to a student
     * is a students.manage action regardless of whether it happens one row
     * at a time or in bulk.
     */
    public function import(Request $request)
    {
        abort_unless($request->user()->can('students.manage'), 403);

        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $result = $this->importer->process($data['file'], ! $request->boolean('dry_run', true), School::find(Tenant::id()));

        return response()->json(['data' => $result]);
    }
}
