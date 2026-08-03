<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Services\School\TeacherImportService;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;

class TeacherImportController extends Controller
{
    public function __construct(protected TeacherImportService $importer) {}

    /**
     * Same dry_run=true (preview, default) / dry_run=false (commit) shape as
     * StudentImportController::import().
     */
    public function import(Request $request)
    {
        abort_unless($request->user()->can('staff.manage'), 403);

        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $result = $this->importer->process($data['file'], ! $request->boolean('dry_run', true), School::find(Tenant::id()));

        return response()->json(['data' => $result]);
    }
}
