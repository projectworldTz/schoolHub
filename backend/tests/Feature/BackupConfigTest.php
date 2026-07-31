<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class BackupConfigTest extends TestCase
{
    public function test_gcs_disk_is_registered_and_private_by_default(): void
    {
        $this->assertSame('gcs', config('filesystems.disks.gcs.driver'));
        $this->assertSame('private', config('filesystems.disks.gcs.visibility'));
    }

    public function test_backups_default_to_the_gcs_disk(): void
    {
        $this->assertSame(['gcs'], config('backup.backup.destination.disks'));
    }

    public function test_backup_archive_is_configured_for_aes_256_encryption(): void
    {
        $this->assertSame('default', config('backup.backup.encryption'));
    }

    public function test_backup_and_cleanup_are_scheduled_daily(): void
    {
        Artisan::call('schedule:list');
        $output = Artisan::output();

        $this->assertStringContainsString('backup:run --only-db', $output);
        $this->assertStringContainsString('backup:clean', $output);
    }
}
