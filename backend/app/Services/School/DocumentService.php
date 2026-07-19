<?php

namespace App\Services\School;

use App\Models\Document;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Shared upload/delete logic for the polymorphic Document model, used by
 * every documentable type (students, staff, admission applications) so
 * file-handling isn't duplicated per controller.
 */
class DocumentService
{
    public function upload(Model $documentable, UploadedFile $file, ?string $uploaderId): Document
    {
        $path = $file->store('documents', 'local');

        return $documentable->documents()->create([
            'school_id' => $documentable->school_id,
            'uploaded_by' => $uploaderId,
            'name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ]);
    }

    public function delete(Document $document): void
    {
        Storage::disk('local')->delete($document->file_path);
        $document->delete();
    }
}
