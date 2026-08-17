<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * A school publishes zero or more bank/mobile-money accounts (e.g. several
 * TZS accounts at different banks plus a separate USD account) that parents
 * see on their dashboard as where to send fee payments. bank_name (e.g.
 * "CRDB Bank") and account_name (e.g. "St Joseph's School Fees Account")
 * are deliberately separate fields. Reading the list is open to any
 * authenticated school user (parents included); writing it is gated
 * behind school-settings.manage.
 */
class SchoolPaymentAccountTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_school_owner_can_create_a_payment_account_with_a_non_numeric_account_number(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/payment-accounts', [
            'bank_name' => 'CRDB Bank',
            'account_name' => 'St Josephs School Fees Account',
            'account_number' => '0150 234567 00', // leading zero + spaces, not a valid int
            'currency' => 'TZS',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.bank_name', 'CRDB Bank');
        $response->assertJsonPath('data.account_number', '0150 234567 00');
        $this->assertDatabaseHas('school_payment_accounts', [
            'school_id' => $school->id,
            'bank_name' => 'CRDB Bank',
            'account_number' => '0150 234567 00',
        ]);
    }

    public function test_bank_name_is_required(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/payment-accounts', [
            'account_name' => 'St Josephs School Fees Account',
            'account_number' => '0150234567',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['bank_name']);
    }

    public function test_a_teacher_without_school_settings_manage_cannot_create_a_payment_account(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/payment-accounts', [
            'bank_name' => 'CRDB Bank',
            'account_name' => 'St Josephs School Fees Account',
            'account_number' => '0150234567',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('school_payment_accounts', 0);
    }

    public function test_a_teacher_can_still_read_the_payment_accounts_list(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $teacher = $this->createUser($school, 'Teacher');

        $this->actingAs($owner, 'web')->postJson('/api/school/payment-accounts', [
            'bank_name' => 'CRDB Bank',
            'account_name' => 'St Josephs School Fees Account',
            'account_number' => '0150234567',
            'currency' => 'TZS',
        ])->assertCreated();

        $response = $this->actingAs($teacher, 'web')->getJson('/api/school/payment-accounts');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_a_school_owner_can_update_and_delete_a_payment_account(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $created = $this->actingAs($owner, 'web')->postJson('/api/school/payment-accounts', [
            'bank_name' => 'CRDB Bank',
            'account_name' => 'St Josephs School Fees Account',
            'account_number' => '0150234567',
            'currency' => 'TZS',
        ])->json('data');

        $update = $this->actingAs($owner, 'web')->putJson("/api/school/payment-accounts/{$created['id']}", [
            'bank_name' => 'CRDB Bank (Main Branch)',
            'account_name' => 'St Josephs School Fees Account',
            'account_number' => '0150234567',
            'currency' => 'TZS',
        ]);
        $update->assertOk();
        $update->assertJsonPath('data.bank_name', 'CRDB Bank (Main Branch)');

        $delete = $this->actingAs($owner, 'web')->deleteJson("/api/school/payment-accounts/{$created['id']}");
        $delete->assertNoContent();
        $this->assertSoftDeleted('school_payment_accounts', ['id' => $created['id']]);
    }

    public function test_payment_accounts_never_leak_across_schools(): void
    {
        $this->seedPermissions();
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();
        $ownerA = $this->createUser($schoolA, 'School Owner');
        $ownerB = $this->createUser($schoolB, 'School Owner');

        $this->actingAs($ownerA, 'web')->postJson('/api/school/payment-accounts', [
            'bank_name' => 'Exim Bank',
            'account_name' => 'School A Fees Account',
            'account_number' => '111',
        ])->assertCreated();

        $response = $this->actingAs($ownerB, 'web')->getJson('/api/school/payment-accounts');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}
