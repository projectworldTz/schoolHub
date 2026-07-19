<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Resources\School\DocumentResource;
use App\Models\Student;
use App\Services\School\DocumentService;
use Illuminate\Http\Request;

class StudentDocumentController extends Controller
{
    public function __construct(protected DocumentService $documents) {}

    public function index(Student $student)
    {
        return DocumentResource::collection($student->documents()->with('uploader')->latest()->get());
    }

    public function store(Request $request, Student $student)
    {
        abort_unless($request->user()->can('students.manage'), 403);

        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $document = $this->documents->upload($student, $request->file('file'), $request->user()->id);

        return new DocumentResource($document);
    }
}
