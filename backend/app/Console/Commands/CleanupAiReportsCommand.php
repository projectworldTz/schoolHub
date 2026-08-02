<?php

namespace App\Console\Commands;

use App\Models\AiGeneratedReport;
use App\Support\Tenancy\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes expired report files and prunes abandoned generation records —
 * scheduled daily (see routes/console.php). Runs across every school
 * (Tenant::runAsPlatform()), since AiGeneratedReport's BelongsToSchool scope
 * would otherwise hide every real row outside a normal per-school request.
 */
class CleanupAiReportsCommand extends Command
{
    protected $signature = 'ai-reports:cleanup';

    protected $description = 'Delete expired AI-generated report files and prune abandoned report records';

    public function handle(): int
    {
        [$expiredCount, $abandonedCount] = Tenant::runAsPlatform(function () {
            $expired = AiGeneratedReport::where('status', 'completed')
                ->where('expires_at', '<', now())
                ->get();

            foreach ($expired as $report) {
                Storage::disk('local')->delete($report->file_path);
                $report->update(['status' => 'expired']);
            }

            // A crashed process, or a generation that already failed —
            // failed rows never got far enough to write a file (see
            // AiReportGenerator::generate()), so there's nothing on disk
            // to clean up for those, just the stale record itself.
            $abandonedCount = AiGeneratedReport::whereIn('status', ['pending', 'failed'])
                ->where('created_at', '<', now()->subDay())
                ->delete();

            return [$expired->count(), $abandonedCount];
        });

        $this->info("Expired {$expiredCount} report(s), removed {$abandonedCount} abandoned record(s).");

        return self::SUCCESS;
    }
}
