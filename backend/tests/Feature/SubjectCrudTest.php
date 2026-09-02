<?php

namespace Tests\Feature;

use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class SubjectCrudTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_subject_can_be_edited(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $subject = Subject::create(['school_id' => $school->id, 'name' => 'Science', 'code' => 'SCI']);

        $this->actingAs($owner, 'web')->putJson("/api/school/subjects/{$subject->id}", [
            'name' => 'General Science',
            'code' => 'GSC',
        ])->assertOk()
            ->assertJsonPath('data.name', 'General Science')
            ->assertJsonPath('data.code', 'GSC');
    }

    public function test_a_deleted_subject_name_can_be_used_again_without_restoring_the_old_record(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $oldSubject = Subject::create(['school_id' => $school->id, 'name' => 'Science', 'code' => 'OLD']);
        $oldSubject->delete();

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/subjects', [
            'name' => 'Science',
            'code' => 'SCI',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Science');

        $this->assertNotSame($oldSubject->id, $response->json('data.id'));
        $this->assertSoftDeleted('subjects', ['id' => $oldSubject->id]);
    }

    public function test_an_active_duplicate_subject_name_is_still_rejected(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        Subject::create(['school_id' => $school->id, 'name' => 'Science']);

        $this->actingAs($owner, 'web')->postJson('/api/school/subjects', ['name' => 'Science'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }
}
