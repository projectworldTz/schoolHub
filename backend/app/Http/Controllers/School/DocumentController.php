<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\School\DocumentService;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function __construct(protected DocumentService $documents) {}

    public function destroy(Request $request, Document $document)
    {
        // Any of the manage permissions covers deleting an attachment —
        // the document itself doesn't know which module it belongs to.
        abort_unless(
            $request->user()->can('students.manage')
                || $request->user()->can('staff.manage')
                || $request->user()->can('admissions.manage'),
            403
        );

        $this->documents->delete($document);

        return response()->noContent();
    }
}
