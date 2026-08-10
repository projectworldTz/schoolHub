<?php

namespace Tests\Feature;

use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Services\Finance\InvoiceService;
use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards against generating "empty" invoices: a zero-total, zero-item
 * Invoice row per student when the fee_structure_ids given don't actually
 * resolve to anything (e.g. soft-deleted since the form loaded — the
 * `exists:fee_structures,id` validation rule checks the raw table and
 * doesn't know about Eloquent's SoftDeletes scope, so a stale id can still
 * pass validation), or when the target class has no actively enrolled
 * students to invoice at all.
 */
class InvoiceGenerationTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function createFeeStructure(\App\Models\School $school, \App\Models\AcademicYear $academicYear, \App\Models\SchoolClass $schoolClass, float $amount = 1000): FeeStructure
    {
        $category = FeeCategory::create(['school_id' => $school->id, 'name' => 'Tuition']);

        return FeeStructure::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'school_class_id' => $schoolClass->id,
            'fee_category_id' => $category->id,
            'amount' => $amount,
        ]);
    }

    public function test_generating_invoices_for_a_class_creates_one_invoice_per_active_student(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        $feeStructure = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass']);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/invoices/generate', [
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [$feeStructure->id],
        ]);

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(1000, $response->json('data.0.total_amount'));
    }

    public function test_it_rejects_fee_structure_ids_that_resolve_to_nothing(): void
    {
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        Tenant::set($fixture['school']->id);

        $this->expectException(ValidationException::class);

        app(InvoiceService::class)->generateForClass([
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [(string) Str::uuid()],
        ]);
    }

    public function test_it_rejects_a_soft_deleted_fee_structure_even_though_it_still_passes_exists_validation(): void
    {
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $feeStructure = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass']);
        $feeStructure->delete();

        // The raw row is still physically present with deleted_at set, so
        // `exists:fee_structures,id` (a plain DB query) would pass this —
        // the real guard has to live in the service, not just validation.
        $this->assertDatabaseHas('fee_structures', ['id' => $feeStructure->id]);

        Tenant::set($fixture['school']->id);
        $this->expectException(ValidationException::class);

        app(InvoiceService::class)->generateForClass([
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [$feeStructure->id],
        ]);
    }

    public function test_it_rejects_a_class_with_no_actively_enrolled_students(): void
    {
        // A second, empty class in the same school — setUpSchoolWithClass()
        // always creates at least one student for its own class, so an
        // "empty" class is built separately here rather than via studentCount.
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $emptyClass = \App\Models\SchoolClass::create([
            'school_id' => $fixture['school']->id,
            'name' => 'Form 2',
            'level' => 2,
        ]);
        $feeStructure = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $emptyClass);

        Tenant::set($fixture['school']->id);
        $this->expectException(ValidationException::class);

        app(InvoiceService::class)->generateForClass([
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $emptyClass->id,
            'fee_structure_ids' => [$feeStructure->id],
        ]);
    }

    public function test_the_generate_endpoint_returns_a_422_instead_of_an_empty_invoice(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $feeStructure = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass']);
        $feeStructure->delete();
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/invoices/generate', [
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [$feeStructure->id],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('invoices', 0);
    }
}
