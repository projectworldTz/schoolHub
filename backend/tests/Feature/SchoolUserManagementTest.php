<?php

namespace Tests\Feature;

use App\Mail\AccountActivationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class SchoolUserManagementTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_creating_a_user_needs_no_password_and_sends_an_activation_email(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'Nia Staff',
            'email' => 'nia@example.com',
            'phone' => '+255700000002',
            'roles' => ['Librarian'],
        ]);

        $response->assertCreated();

        $created = User::withoutGlobalScopes()->where('email', 'nia@example.com')->firstOrFail();
        $this->assertTrue($created->hasRole('Librarian'));
        $this->assertSame('+255700000002', $created->phone);

        Mail::assertSent(AccountActivationMail::class, fn ($mail) => $mail->hasTo($created->email));
    }

    public function test_a_school_owner_cannot_remove_their_own_account(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->deleteJson("/api/school/users/{$owner->id}");

        $response->assertStatus(422);
        $this->assertNotSoftDeleted($owner);
    }

    public function test_a_school_owner_can_remove_another_users_account(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($owner, 'web')->deleteJson("/api/school/users/{$teacher->id}");

        $response->assertNoContent();
        $this->assertSoftDeleted($teacher);
    }

    public function test_a_school_with_more_than_the_default_page_size_still_exposes_every_user(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        foreach (range(1, 25) as $i) {
            $this->createUser($school, 'Teacher', ['name' => 'Teacher '.str_pad((string) $i, 2, '0', STR_PAD_LEFT)]);
        }

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/users');

        $response->assertOk();
        $this->assertSame(26, $response->json('meta.total'));
        $this->assertCount(26, $response->json('data'));
    }

    public function test_users_can_be_filtered_by_role(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->createUser($school, 'Teacher', ['name' => 'Amina Teacher']);
        $this->createUser($school, 'Parent', ['name' => 'Bakari Parent']);

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/users?role=Parent');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(['Bakari Parent'], $names);
    }

    public function test_used_roles_includes_parent_and_teacher_but_is_gated_by_users_manage(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->createUser($school, 'Teacher');
        $this->createUser($school, 'Parent');
        $plainTeacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/users/roles');
        $response->assertOk();
        $roles = $response->json('data');
        $this->assertContains('Teacher', $roles);
        $this->assertContains('Parent', $roles);
        $this->assertContains('School Owner', $roles);

        $forbidden = $this->actingAs($plainTeacher, 'web')->getJson('/api/school/users/roles');
        $forbidden->assertForbidden();
    }

    public function test_creating_a_user_without_an_email_gets_a_placeholder_and_a_shown_once_password(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'No Email Teacher',
            'roles' => ['Class Teacher'],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.has_placeholder_email', true);
        $this->assertNotEmpty($response->json('data.temporary_password'));

        $created = User::withoutGlobalScopes()->where('name', 'No Email Teacher')->firstOrFail();
        $this->assertTrue($created->hasRole('Class Teacher'));
        $this->assertTrue($created->has_placeholder_email);
        $this->assertTrue($created->must_change_password);
        $this->assertStringEndsWith('@noemail.schoolhub.internal', $created->email);

        Mail::assertNotSent(AccountActivationMail::class);
    }

    public function test_a_temporary_password_is_not_shown_again_on_a_later_fetch(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'No Email Teacher',
            'roles' => ['Class Teacher'],
        ])->assertCreated();

        $created = User::withoutGlobalScopes()->where('name', 'No Email Teacher')->firstOrFail();
        $response = $this->actingAs($owner, 'web')->getJson("/api/school/users/{$created->id}");

        $response->assertOk();
        $this->assertNull($response->json('data.temporary_password'));
    }

    public function test_adding_an_email_to_a_placeholder_account_sends_the_activation_email(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'No Email Teacher',
            'roles' => ['Class Teacher'],
        ])->assertCreated();

        $created = User::withoutGlobalScopes()->where('name', 'No Email Teacher')->firstOrFail();

        $response = $this->actingAs($owner, 'web')->putJson("/api/school/users/{$created->id}/email", [
            'email' => 'noemail.teacher@example.com',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.email', 'noemail.teacher@example.com');
        $response->assertJsonPath('data.has_placeholder_email', false);

        Mail::assertSent(AccountActivationMail::class, fn ($mail) => $mail->hasTo('noemail.teacher@example.com'));
    }

    public function test_adding_an_email_rejects_one_already_used_by_another_user(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->createUser($school, 'Teacher', ['email' => 'taken@example.com']);

        $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'No Email Teacher',
            'roles' => ['Class Teacher'],
        ])->assertCreated();
        $created = User::withoutGlobalScopes()->where('name', 'No Email Teacher')->firstOrFail();

        $response = $this->actingAs($owner, 'web')->putJson("/api/school/users/{$created->id}/email", [
            'email' => 'taken@example.com',
        ]);

        $response->assertStatus(422);
    }

    public function test_editing_details_without_touching_email_does_not_clear_the_placeholder_flag(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'No Email Teacher',
            'roles' => ['Class Teacher'],
        ])->assertCreated();
        $created = User::withoutGlobalScopes()->where('name', 'No Email Teacher')->firstOrFail();

        // Same pattern EditDetailsDialog submits: every field present,
        // including the unchanged (placeholder) email.
        $response = $this->actingAs($owner, 'web')->putJson("/api/school/users/{$created->id}", [
            'name' => 'No Email Teacher',
            'email' => $created->email,
            'phone' => '+255700000099',
        ]);

        $response->assertOk();
        $this->assertTrue($created->refresh()->has_placeholder_email);
    }
}
