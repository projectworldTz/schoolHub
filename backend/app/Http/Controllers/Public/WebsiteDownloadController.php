<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\WebsiteDownload;
use App\Services\WebsiteBuilder\WebsitePremiumAccessService;
use App\Support\Tenancy\Tenant;
use Illuminate\Support\Facades\Storage;

class WebsiteDownloadController extends Controller
{
    public function __construct(protected WebsitePremiumAccessService $premiumAccess) {}

    public function show(string $slug, string $downloadId)
    {
        $school = Tenant::runAsPlatform(
            fn () => School::where('slug', $slug)->where('status', 'approved')->firstOrFail()
        );

        abort_unless($this->premiumAccess->evaluate($school)['code'] === null, 404);

        Tenant::set($school->id);

        $download = WebsiteDownload::findOrFail($downloadId);
        $download->increment('download_count');

        // $download->title is free-text (e.g. "Fee Structure"), so without
        // reattaching the original extension the saved file would have
        // none at all, regardless of what was actually uploaded.
        $extension = pathinfo($download->file_path, PATHINFO_EXTENSION);
        $filename = $extension ? "{$download->title}.{$extension}" : $download->title;

        return Storage::disk('public')->download($download->file_path, $filename);
    }
}
