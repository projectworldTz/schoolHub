<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class GenerateTemporaryPasswordCommandTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_it_sets_a_new_password_and_forces_a_change(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', [
            'email' => 'amina@riverside.test',
            'must_change_password' => false,
        ]);
        $originalHash = $owner->password;

        $this->artisan('password:generate-temporary', ['email' => 'amina@riverside.test'])
            ->assertSuccessful();

        $owner->refresh();
        $this->assertTrue($owner->must_change_password);
        $this->assertNotSame($originalHash, $owner->password);
    }

    public function test_the_printed_password_actually_logs_the_owner_in(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);

        Artisan::call('password:generate-temporary', ['email' => 'amina@riverside.test']);
        $output = Artisan::output();

        $this->assertMatchesRegularExpression('/^\s{4}(\S+)\s*$/m', $output);
        preg_match('/^\s{4}(\S+)\s*$/m', $output, $matches);
        $temporaryPassword = $matches[1];

        $login = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/login', [
                'email' => 'amina@riverside.test',
                'password' => $temporaryPassword,
            ]);

        $login->assertOk();
        $login->assertJsonPath('data.must_change_password', true);
    }

    public function test_an_unknown_email_fails_clearly(): void
    {
        $this->seedPermissions();

        $this->artisan('password:generate-temporary', ['email' => 'nobody@riverside.test'])
            ->assertFailed();
    }
}
