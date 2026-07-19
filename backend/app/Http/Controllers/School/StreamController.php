<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\StreamRequest;
use App\Http\Resources\School\StreamResource;
use App\Models\Stream;
use Illuminate\Http\Request;

class StreamController extends Controller
{
    public function index(Request $request)
    {
        return StreamResource::collection(
            Stream::query()
                ->with(['classTeacher', 'room'])
                ->when($request->string('academic_year_id')->isNotEmpty(), fn ($q) => $q->where('academic_year_id', $request->string('academic_year_id')))
                ->when($request->string('school_class_id')->isNotEmpty(), fn ($q) => $q->where('school_class_id', $request->string('school_class_id')))
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StreamRequest $request)
    {
        return new StreamResource(Stream::create($request->validated()));
    }

    public function show(Stream $stream)
    {
        return new StreamResource($stream->load(['classTeacher', 'room']));
    }

    public function update(StreamRequest $request, Stream $stream)
    {
        $stream->update($request->validated());

        return new StreamResource($stream);
    }

    public function destroy(Request $request, Stream $stream)
    {
        abort_unless($request->user()->can('classes.manage'), 403);

        $stream->delete();

        return response()->noContent();
    }
}
