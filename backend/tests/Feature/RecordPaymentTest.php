<?php

namespace Tests\Feature;

use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Guardian;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * A payment can now be attributed to a specific fee category (e.g. a parent
 * paying only the Transport fee) rather than just being a lump sum against
 * the invoice total. The outstanding-balance cap on a payment's `amount`
 * must respect that category's own remaining balance, not the invoice's —
 * otherwise a parent could "pay" more against Transport than Transport
 * actually costs, silently over-crediting it while under-crediting Tuition.
 */
class RecordPaymentTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    /**
     * @return array{invoice: Invoice, tuition_category: FeeCategory, transport_category: FeeCategory}
     */
    protected function invoiceWithTwoCategories(\App\Models\School $school, \App\Models\AcademicYear $academicYear, \App\Models\SchoolClass $schoolClass, \App\Models\Student $student): array
    {
        $tuitionCategory = FeeCategory::create(['school_id' => $school->id, 'name' => 'Tuition']);
        $transportCategory = FeeCategory::create(['school_id' => $school->id, 'name' => 'Transport', 'is_optional' => true]);

        $tuition = FeeStructure::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'school_class_id' => $schoolClass->id,
            'fee_category_id' => $tuitionCategory->id,
            'amount' => 2000000,
        ]);

        $transport = FeeStructure::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'school_class_id' => $schoolClass->id,
            'fee_category_id' => $transportCategory->id,
            'amount' => 300000,
        ]);

        $invoice = Invoice::create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'academic_year_id' => $academicYear->id,
            'invoice_number' => 'INV-TEST-'.$student->id,
            'total_amount' => 2300000,
        ]);

        $invoice->items()->create(['fee_structure_id' => $tuition->id, 'description' => 'Tuition', 'amount' => 2000000]);
        $invoice->items()->create(['fee_structure_id' => $transport->id, 'description' => 'Transport', 'amount' => 300000]);

        return ['invoice' => $invoice, 'tuition_category' => $tuitionCategory, 'transport_category' => $transportCategory];
    }

    public function test_a_payment_against_one_category_does_not_touch_another_categorys_balance(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();
        $fixture2 = $this->invoiceWithTwoCategories($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $student);
        $invoice = $fixture2['invoice'];
        $transportCategory = $fixture2['transport_category'];
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson("/api/school/invoices/{$invoice->id}/payments", [
            'amount' => 300000,
            'fee_category_id' => $transportCategory->id,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ]);

        $response->assertOk();

        $payment = collect($response->json('data.payments'))->first();
        $this->assertSame($transportCategory->id, $payment['fee_category_id']);
        $this->assertSame('Transport', $payment['fee_category_name']);

        // Invoice-wide totals reflect the payment...
        $this->assertEquals(300000, $response->json('data.amount_paid'));
        $this->assertEquals(2000000, $response->json('data.balance'));

        // ...but Tuition itself is still fully outstanding — the next
        // request tries to overpay Transport's now-zero balance and must be
        // rejected even though the invoice as a whole still has room.
        $overpay = $this->actingAs($owner, 'web')->postJson("/api/school/invoices/{$invoice->id}/payments", [
            'amount' => 1,
            'fee_category_id' => $transportCategory->id,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ]);

        $overpay->assertStatus(422);
    }

    public function test_a_payment_without_a_category_is_still_capped_by_the_invoice_balance(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();
        $invoice = $this->invoiceWithTwoCategories($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $student)['invoice'];
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson("/api/school/invoices/{$invoice->id}/payments", [
            'amount' => 2300000,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ]);

        $response->assertOk();
        $this->assertEquals(0, $response->json('data.balance'));

        $overpay = $this->actingAs($owner, 'web')->postJson("/api/school/invoices/{$invoice->id}/payments", [
            'amount' => 1,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ]);

        $overpay->assertStatus(422);
    }

    public function test_invoice_items_expose_their_fee_category_for_a_breakdown_view(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();
        $invoice = $this->invoiceWithTwoCategories($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $student)['invoice'];
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson("/api/school/invoices/{$invoice->id}");

        $response->assertOk();
        $names = collect($response->json('data.items'))->pluck('fee_category_name')->sort()->values()->all();
        $this->assertSame(['Transport', 'Tuition'], $names);
    }

    public function test_a_parent_sees_the_category_breakdown_on_their_childs_invoice(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();
        $fixture2 = $this->invoiceWithTwoCategories($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $student);
        $invoice = $fixture2['invoice'];
        $transportCategory = $fixture2['transport_category'];
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $this->actingAs($owner, 'web')->postJson("/api/school/invoices/{$invoice->id}/payments", [
            'amount' => 300000,
            'fee_category_id' => $transportCategory->id,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ])->assertOk();

        $guardian = Guardian::create(['school_id' => $fixture['school']->id, 'name' => 'Test Guardian']);
        $guardian->students()->attach($student->id, ['relationship' => 'mother', 'is_primary' => true]);
        $parentUser = $this->createUser($fixture['school'], 'Parent');
        $guardian->update(['user_id' => $parentUser->id]);

        $response = $this->actingAs($parentUser, 'web')->getJson("/api/parent/children/{$student->id}/invoices/{$invoice->id}");

        $response->assertOk();
        $payment = collect($response->json('data.payments'))->first();
        $this->assertSame('Transport', $payment['fee_category_name']);
        $itemNames = collect($response->json('data.items'))->pluck('fee_category_name')->sort()->values()->all();
        $this->assertSame(['Transport', 'Tuition'], $itemNames);
    }
}
