<?php

namespace App\Services\School;

use App\Models\School;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class SchoolBrandingService
{
    public const DISK = 'public';

    public function url(?string $path): ?string
    {
        return $path ? Storage::disk(self::DISK)->url($path) : null;
    }

    public function replace(School $school, UploadedFile $logo): School
    {
        $oldPath = $school->logo_path;
        $newPath = $logo->store("schools/{$school->id}/branding", self::DISK);

        if (! $newPath) {
            throw new RuntimeException('The logo could not be stored. Please try again.');
        }

        try {
            $school->forceFill(['logo_path' => $newPath])->save();
        } catch (\Throwable $exception) {
            Storage::disk(self::DISK)->delete($newPath);
            throw $exception;
        }

        if ($oldPath && $oldPath !== $newPath) {
            Storage::disk(self::DISK)->delete($oldPath);
        }

        return $school->refresh();
    }

    public function remove(School $school): School
    {
        $oldPath = $school->logo_path;
        $school->forceFill(['logo_path' => null])->save();

        if ($oldPath) {
            Storage::disk(self::DISK)->delete($oldPath);
        }

        return $school->refresh();
    }

    /** A self-contained image source works in DomPDF without remote access. */
    public function pdfDataUri(School $school): ?string
    {
        if (! $school->logo_path || ! Storage::disk(self::DISK)->exists($school->logo_path)) {
            return null;
        }

        $mime = Storage::disk(self::DISK)->mimeType($school->logo_path);
        if (! $mime || ! str_starts_with($mime, 'image/')) {
            return null;
        }

        return 'data:'.$mime.';base64,'.base64_encode(Storage::disk(self::DISK)->get($school->logo_path));
    }
}
