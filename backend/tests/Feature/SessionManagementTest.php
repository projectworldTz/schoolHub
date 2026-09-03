<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class SessionManagementTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_user_can_list_and_revoke_only_their_own_sessions(): void
    {
        config(['session.driver' => 'database']);
        $this->seedPermissions();
        $school = $this->createSchool();
        $user = $this->createUser($school, 'School Owner');
        $other = $this->createUser($school, 'Teacher');

        $this->insertSession('own-session', $user->id, '10.0.0.1');
        $this->insertSession('other-session', $other->id, '10.0.0.2');

        $this->actingAs($user, 'web')->withHeader('Referer', 'http://localhost:5173')->getJson('/api/auth/sessions')
            ->assertOk()
            ->assertJsonFragment(['id' => 'own-session'])
            ->assertJsonMissing(['id' => 'other-session']);

        $this->actingAs($user, 'web')->withHeader('Referer', 'http://localhost:5173')->deleteJson('/api/auth/sessions/other-session')->assertNotFound();
        $this->assertDatabaseHas('sessions', ['id' => 'other-session']);

        $this->actingAs($user, 'web')->withHeader('Referer', 'http://localhost:5173')->deleteJson('/api/auth/sessions/own-session')->assertNoContent();
        $this->assertDatabaseMissing('sessions', ['id' => 'own-session']);
    }

    private function insertSession(string $id, string $userId, string $ip): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $userId,
            'ip_address' => $ip,
            'user_agent' => 'Test Browser',
            'payload' => '',
            'last_activity' => now()->timestamp,
        ]);
    }
}
