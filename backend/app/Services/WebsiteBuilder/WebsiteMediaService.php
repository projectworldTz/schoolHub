<?php

namespace App\Services\WebsiteBuilder;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Website Builder media (gallery/banner/testimonial photos, downloads,
 * hero image) must be reachable as plain public URLs with no auth, unlike
 * the rest of the app's uploads (App\Services\School\DocumentService),
 * which deliberately stay on the private 'local' disk. This is the one
 * place the module uses the 'public' disk (configured in
 * config/filesystems.php, otherwise unused elsewhere in the app).
 */
class WebsiteMediaService
{
    public function store(UploadedFile $file, string $folder): string
    {
        return $file->store("website/{$folder}", 'public');
    }

    public function url(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
