<?php

namespace Tests\Feature;

use App\Models\AiGeneratedReport;
use App\Models\Invoice;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * AI-generated downloadable reports (App\Services\AI\Reports\*). Mirrors
 * AiDatabaseToolsTest's two-call mocking pattern (routing, then a
 * final-answer call) — a completed report intent additionally writes a
 * real file to the faked 'local' disk and creates an AiGeneratedReport row.
 */
class AiReportGenerationTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    protected function chat(\App\Models\User $user, string $message): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($user, 'web')->postJson('/api/school/ai-assistant/chat', [
            'messages' => [['role' => 'user', 'content' => $message]],
        ]);
    }

    protected function fakeRouting(string $intent, array $parameters, string $finalAnswer): void
    {
        Config::set('services.anthropic.key', 'test-key');
        Http::fake([
            'api.anthropic.com/*' => Http::sequence()
                ->push(['content' => [['type' => 'text', 'text' => json_encode(['intent' => $intent, 'parameters' => $parameters])]]])
                ->push(['content' => [['type' => 'text', 'text' => $finalAnswer]]]),
        ]);
    }

    public function test_an_accountant_can_generate_and_download_an_outstanding_fees_report(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $accountant = $this->createUser($fixture['school'], 'Accountant');

        Invoice::create([
            'school_id' => $fixture['school']->id, 'student_id' => $fixture['students'][0]->id,
            'academic_year_id' => $fixture['academicYear']->id, 'invoice_number' => 'INV-1',
            'total_amount' => 500, 'amount_paid' => 100,
        ]);

        $this->fakeRouting('reports.outstanding_fees', ['format' => 'xlsx'], 'Your outstanding fees report is ready.');
        $response = $this->chat($accountant, 'Export outstanding fees to Excel');

        $response->assertOk();
        $report = $response->json('data.report');
        $this->assertNotNull($report);
        $this->assertSame('completed', $report['status']);
        $this->assertSame('xlsx', $report['format']);

        $dbReport = AiGeneratedReport::findOrFail($report['id']);
        Storage::disk('local')->assertExists($dbReport->file_path);

        $download = $this->actingAs($accountant, 'web')->get($report['download_url']);
        $download->assertOk();
    }

    public function test_a_teacher_asking_for_a_fees_report_falls_back_to_general(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        // The fees report intent is never offered to a teacher, so even an
        // adversarial routing reply naming it must be rejected.
        $this->fakeRouting('reports.outstanding_fees', [], 'Try the Finance module instead.');
        $response = $this->chat($teacher, 'Export outstanding fees to Excel');

        $response->assertOk();
        $this->assertNull($response->json('data.report'));
        $this->assertDatabaseCount('ai_generated_reports', 0);
    }

    public function test_a_school_cannot_download_another_schools_report(): void
    {
        $this->seedPermissions();
        $fixtureA = $this->setUpSchoolWithClass(1);
        $fixtureB = $this->setUpSchoolWithClass(1);
        $accountantA = $this->createUser($fixtureA['school'], 'Accountant');
        $ownerB = $this->createUser($fixtureB['school'], 'School Owner');

        Invoice::create([
            'school_id' => $fixtureA['school']->id, 'student_id' => $fixtureA['students'][0]->id,
            'academic_year_id' => $fixtureA['academicYear']->id, 'invoice_number' => 'INV-A',
            'total_amount' => 500, 'amount_paid' => 0,
        ]);

        $this->fakeRouting('reports.outstanding_fees', [], 'Your report is ready.');
        $response = $this->chat($accountantA, 'Export outstanding fees to Excel');
        $downloadUrl = $response->json('data.report.download_url');

        // A different school's authenticated user, same signed URL.
        $crossSchool = $this->actingAs($ownerB, 'web')->get($downloadUrl);
        $crossSchool->assertNotFound();
    }

    public function test_an_expired_signature_is_rejected(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $accountant = $this->createUser($fixture['school'], 'Accountant');

        $report = AiGeneratedReport::create([
            'school_id' => $fixture['school']->id,
            'user_id' => $accountant->id,
            'report_type' => 'outstanding_fees',
            'title' => 'Outstanding Fees',
            'format' => 'xlsx',
            'file_path' => 'ai-reports/x/y.xlsx',
            'status' => 'completed',
            'expires_at' => now()->addMinutes(15),
        ]);
        Storage::disk('local')->put($report->file_path, 'fake contents');

        $expiredUrl = URL::temporarySignedRoute('ai.reports.download', now()->subMinute(), ['report' => $report->id]);

        $response = $this->actingAs($accountant, 'web')->get($expiredUrl);
        $response->assertForbidden();
    }

    public function test_a_completed_report_past_its_retention_expiry_is_rejected_even_with_a_valid_signature(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $accountant = $this->createUser($fixture['school'], 'Accountant');

        $report = AiGeneratedReport::create([
            'school_id' => $fixture['school']->id,
            'user_id' => $accountant->id,
            'report_type' => 'outstanding_fees',
            'title' => 'Outstanding Fees',
            'format' => 'xlsx',
            'file_path' => 'ai-reports/x/y.xlsx',
            'status' => 'completed',
            'expires_at' => now()->subMinute(), // retention window already passed
        ]);
        Storage::disk('local')->put($report->file_path, 'fake contents');

        // A freshly (validly) signed URL — the signature alone doesn't
        // prove the report itself hasn't expired.
        $url = URL::temporarySignedRoute('ai.reports.download', now()->addMinutes(15), ['report' => $report->id]);

        $response = $this->actingAs($accountant, 'web')->get($url);
        $response->assertStatus(410);
    }

    public function test_attendance_report_rows_match_the_records_created(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $fixture = $this->setUpSchoolWithClass(2);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $today = \Illuminate\Support\Carbon::now($fixture['school']->refresh()->timezone)->toDateString();
        \App\Models\AttendanceRecord::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $fixture['students'][0]->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'date' => $today,
            'status' => 'absent',
        ]);

        $this->fakeRouting('reports.attendance', ['format' => 'csv'], 'Your attendance report is ready.');
        $response = $this->chat($owner, 'Export today\'s absent students to CSV');

        $response->assertOk();
        $report = $response->json('data.report');
        $this->assertSame('csv', $report['format']);

        $dbReport = AiGeneratedReport::findOrFail($report['id']);
        $contents = Storage::disk('local')->get($dbReport->file_path);
        $this->assertStringContainsString($fixture['students'][0]->admission_number, $contents);
    }

    public function test_an_unauthorized_class_name_in_the_timetable_report_is_denied(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $this->fakeRouting('reports.timetable', ['class_name' => $fixture['schoolClass']->name], 'n/a');
        $response = $this->chat($teacher, 'Generate the timetable for '.$fixture['schoolClass']->name);

        $response->assertOk();
        $this->assertNull($response->json('data.report'));
        Http::assertSentCount(1); // routing only — denial short-circuits before the final-answer call
        $this->assertDatabaseCount('ai_generated_reports', 0);
    }

    public function test_ai_reportscleanup_expires_old_reports_and_deletes_their_files(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $user = $this->createUser($fixture['school'], 'School Owner');

        $report = AiGeneratedReport::create([
            'school_id' => $fixture['school']->id,
            'user_id' => $user->id,
            'report_type' => 'outstanding_fees',
            'title' => 'Old Report',
            'format' => 'xlsx',
            'file_path' => 'ai-reports/old/report.xlsx',
            'status' => 'completed',
            'expires_at' => now()->subHour(),
        ]);
        Storage::disk('local')->put($report->file_path, 'fake contents');

        $this->artisan('ai-reports:cleanup')->assertSuccessful();

        Storage::disk('local')->assertMissing($report->file_path);
        // withoutGlobalScopes(): this assertion runs outside any real
        // request/Tenant context, same reasoning as SetsUpTenant's own
        // docblock — BelongsToSchool's scope would otherwise hide the row.
        $this->assertSame('expired', AiGeneratedReport::withoutGlobalScopes()->findOrFail($report->id)->status);
    }
}
