<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Resources\School\DocumentResource;
use App\Models\AdmissionApplication;
use App\Services\School\DocumentService;
use Illuminate\Http\Request;

class AdmissionDocumentController extends Controller
{
    public function __construct(protected DocumentService $documents) {}

    public function index(AdmissionApplication $admission)
    {
        return DocumentResource::collection($admission->documents()->with('uploader')->latest()->get());
    }

    public function store(Request $request, AdmissionApplication $admission)
    {
        abort_unless($request->user()->can('admissions.manage'), 403);

        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $document = $this->documents->upload($admission, $request->file('file'), $request->user()->id);

        return new DocumentResource($document);
    }
}
