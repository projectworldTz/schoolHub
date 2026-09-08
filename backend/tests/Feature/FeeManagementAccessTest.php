<?php

namespace Tests\Feature;

use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\AI\Tools\OutstandingFeesTool;
use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class FeeManagementAccessTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_toggle_preserves_financial_records_and_isolates_schools(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $school = $fixture['school'];
        $other = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $otherOwner = $this->createUser($other, 'School Owner');
        $super = $this->createUser($other, 'Super Admin');
        $category = FeeCategory::create(['school_id' => $school->id, 'name' => 'Tuition']);
        $structure = FeeStructure::create([
            'school_id' => $school->id, 'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id, 'fee_category_id' => $category->id, 'amount' => 1000,
        ]);
        $this->actingAs($owner)->postJson('/api/school/invoices/generate', [
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [$structure->id],
        ])->assertOk();
        $invoice = Invoice::firstOrFail();
        $this->postJson("/api/school/invoices/{$invoice->id}/payments", [
            'amount' => 250, 'method' => 'cash', 'paid_at' => now()->toDateString(),
        ])->assertSuccessful();
        $payment = Payment::firstOrFail();
        $tables = ['fee_categories', 'fee_structures', 'invoices', 'invoice_items', 'payments', 'student_fee_exclusions'];
        $snapshot = fn () => collect($tables)->mapWithKeys(fn ($table) => [$table => DB::table($table)->orderBy('id')->get()->toJson()])->all();
        $before = $snapshot();
        $this->assertTrue($school->fresh()->fee_management_enabled);
        $this->getJson("/api/school/invoices/{$invoice->id}")->assertOk();

        $this->actingAs($super)->putJson("/api/platform/schools/{$school->id}/fee-management", ['fee_management_enabled' => false])
            ->assertOk()->assertJsonPath('data.fee_management_enabled', false);
        $this->assertTrue($other->fresh()->fee_management_enabled);
        $this->actingAs($owner)->getJson('/api/school/invoices?school_id='.$other->id)->assertForbidden();
        foreach (['fee-categories', 'fee-structures', 'invoices/pdf', 'analytics/finance', 'payment-accounts', 'reports/fee-collection'] as $path) {
            $this->getJson('/api/school/'.$path)->assertForbidden();
        }
        $this->postJson('/api/school/invoices/generate', [])->assertForbidden();
        $this->postJson('/api/school/invoices/import', [])->assertForbidden();
        $this->postJson("/api/school/invoices/{$invoice->id}/payments", [])->assertForbidden();
        $this->postJson("/api/school/payments/{$payment->id}/reverse", [])->assertForbidden();
        $this->deleteJson("/api/school/invoices/{$invoice->id}")->assertForbidden();
        $this->getJson('/api/auth/me')->assertJsonPath('data.fee_management_enabled', false);
        $this->assertSame($before, $snapshot());

        $this->actingAs($otherOwner)->getJson('/api/school/invoices')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/school/invoices/{$invoice->id}")->assertNotFound();
        $this->actingAs($super)->putJson("/api/platform/schools/{$school->id}/fee-management", ['fee_management_enabled' => true])->assertOk();
        $this->actingAs($owner)->getJson("/api/school/invoices/{$invoice->id}")->assertOk();
        $this->assertSame($before, $snapshot());
    }

    public function test_only_super_admin_can_change_access_and_input_is_validated(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->actingAs($owner)->putJson("/api/platform/schools/{$school->id}/fee-management", ['fee_management_enabled' => false])->assertForbidden();
        $this->putJson('/api/school/profile', ['fee_management_enabled' => false])->assertSuccessful();
        $this->assertTrue($school->fresh()->fee_management_enabled);
        $super = $this->createUser($school, 'Super Admin');
        $this->actingAs($super)->putJson("/api/platform/schools/{$school->id}/fee-management", ['fee_management_enabled' => 'invalid'])->assertUnprocessable();
    }

    public function test_disabled_dashboard_skips_fee_queries_and_other_modules_remain_available(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['fee_management_enabled' => false]);
        $owner = $this->createUser($school, 'School Owner');
        DB::enableQueryLog();
        $response = $this->actingAs($owner)->getJson('/api/school/analytics/overview')->assertOk();
        $queries = collect(DB::getQueryLog())->pluck('query')->implode("\n");
        DB::disableQueryLog();
        $this->assertStringNotContainsString('from "invoices"', $queries);
        $this->assertStringNotContainsString('from "payments"', $queries);
        $this->assertNotContains('revenue', array_column($response->json('data.kpis'), 'key'));
        $this->assertNotContains('fee_collection', array_column($response->json('data.kpis'), 'key'));
        foreach (['students', 'payroll-runs', 'expenses', 'analytics/budget'] as $path) {
            $this->getJson('/api/school/'.$path)->assertOk();
        }
        $catalog = $this->getJson('/api/school/reports')->assertOk();
        $this->assertNotContains('fee-collection', array_column($catalog->json('data'), 'key'));
        Tenant::set($school->id);
        $this->assertIsString(app(OutstandingFeesTool::class)->authorize($owner));
    }

    public function test_parent_and_token_fee_access_are_blocked(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $school = $fixture['school'];
        $school->update(['fee_management_enabled' => false]);
        $parent = $this->createUser($school, 'Parent');
        $student = $fixture['students']->first();
        $this->actingAs($parent)->getJson("/api/parent/children/{$student->id}/fees")->assertForbidden();
        $owner = $this->createUser($school, 'School Owner');
        $token = $owner->createToken('fee-access-test')->plainTextToken;
        auth('web')->forgetUser();
        $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/v1/school/invoices')->assertForbidden();
    }

    public function test_migration_enables_existing_schools_without_changing_school_data(): void
    {
        $school = $this->createSchool();
        $migration = require database_path('migrations/2026_09_08_120000_add_fee_management_enabled_to_schools_table.php');
        $migration->down();
        $before = (array) DB::table('schools')->where('id', $school->id)->first();
        $migration->up();
        $after = (array) DB::table('schools')->where('id', $school->id)->first();
        $this->assertEquals(1, $after['fee_management_enabled']);
        unset($after['fee_management_enabled']);
        $this->assertSame($before, $after);
    }

    public function test_token_login_returns_the_verified_schools_feature_state(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', ['password' => bcrypt('test-password')]);
        $payload = ['email' => $owner->email, 'password' => 'test-password', 'device_name' => 'test'];
        $this->postJson('/api/v1/auth/login', $payload)->assertOk()->assertJsonPath('data.user.fee_management_enabled', true);
        $school->update(['fee_management_enabled' => false]);
        $this->postJson('/api/v1/auth/login', $payload)->assertOk()->assertJsonPath('data.user.fee_management_enabled', false);
    }
}
