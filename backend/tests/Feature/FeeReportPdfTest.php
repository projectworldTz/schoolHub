<?php

namespace Tests\Feature;

use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class FeeReportPdfTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_an_accountant_can_download_the_fee_report_pdf(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        [$paidStudent, $partialStudent] = $fixture['students'];

        Invoice::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $paidStudent->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'invoice_number' => 'INV-001',
            'total_amount' => 1000,
            'amount_paid' => 1000,
            'status' => 'paid',
        ]);
        Invoice::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $partialStudent->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'invoice_number' => 'INV-002',
            'total_amount' => 1000,
            'amount_paid' => 400,
            'status' => 'partial',
        ]);

        $accountant = $this->createUser($fixture['school'], 'Accountant');

        $response = $this->actingAs($accountant, 'web')->get('/api/school/invoices/pdf');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_the_fee_report_pdf_respects_the_status_filter(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        [$paidStudent, $partialStudent] = $fixture['students'];

        Invoice::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $paidStudent->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'invoice_number' => 'INV-001',
            'total_amount' => 1000,
            'amount_paid' => 1000,
            'status' => 'paid',
        ]);
        Invoice::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $partialStudent->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'invoice_number' => 'INV-002',
            'total_amount' => 1000,
            'amount_paid' => 400,
            'status' => 'partial',
        ]);

        $accountant = $this->createUser($fixture['school'], 'Accountant');

        $response = $this->actingAs($accountant, 'web')->get('/api/school/invoices/pdf?status=partial');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_a_user_without_finance_manage_cannot_download_the_fee_report(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $response = $this->actingAs($teacher, 'web')->get('/api/school/invoices/pdf');

        $response->assertForbidden();
    }
}
