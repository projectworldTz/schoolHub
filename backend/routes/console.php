<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily encrypted DB backup to GCS, then prune old ones per config/backup.php's
// retention strategy. On Truehost (no per-minute `schedule:run` cron today),
// these are triggered directly — see the deploy notes for the cPanel cron
// entries. This registration is what makes `schedule:run`/`schedule:work`
// do the same thing if that cron is ever added instead.
Schedule::command('backup:run --only-db')->dailyAt('02:00');
Schedule::command('backup:clean')->dailyAt('02:30');

Schedule::command('ai-reports:cleanup')->dailyAt('03:00');
