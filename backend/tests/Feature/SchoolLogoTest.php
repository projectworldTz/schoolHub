<?php

namespace Tests\Feature;

use App\Services\School\SchoolBrandingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class SchoolLogoTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->seedPermissions();
    }

    public function test_school_profile_works_without_a_logo(): void
    {
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $this->actingAs($owner, 'web')->getJson('/api/school/profile')
            ->assertOk()
            ->assertJsonPath('data.logo_path', null)
            ->assertJsonPath('data.logo_url', null);
    }

    public function test_school_can_upload_replace_and_remove_its_logo(): void
    {
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $first = $this->actingAs($owner, 'web')->post('/api/school/profile/logo', [
            'logo' => UploadedFile::fake()->image('first.png', 80, 80),
        ])->assertOk();

        $firstPath = $first->json('data.logo_path');
        $this->assertStringStartsWith("schools/{$school->id}/branding/", $firstPath);
        Storage::disk('public')->assertExists($firstPath);

        $second = $this->actingAs($owner, 'web')->post('/api/school/profile/logo', [
            'logo' => UploadedFile::fake()->image('second.webp', 100, 100),
        ])->assertOk();

        $secondPath = $second->json('data.logo_path');
        $this->assertNotSame($firstPath, $secondPath);
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($secondPath);

        $this->actingAs($owner, 'web')->deleteJson('/api/school/profile/logo')
            ->assertOk()
            ->assertJsonPath('data.logo_path', null)
            ->assertJsonPath('data.logo_url', null);
        Storage::disk('public')->assertMissing($secondPath);
    }

    public function test_invalid_and_oversized_logos_are_rejected(): void
    {
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $this->actingAs($owner, 'web')->postJson('/api/school/profile/logo', [
            'logo' => UploadedFile::fake()->create('logo.txt', 10, 'text/plain'),
        ])->assertUnprocessable()->assertJsonValidationErrors('logo');

        $this->actingAs($owner, 'web')->post('/api/school/profile/logo', [
            'logo' => UploadedFile::fake()->image('large.png')->size(5121),
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('logo');

        $this->assertNull($school->fresh()->logo_path);
    }

    public function test_logo_mutations_are_bound_to_the_authenticated_tenant(): void
    {
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();
        $ownerA = $this->createUser($schoolA, 'School Owner');

        $bPath = "schools/{$schoolB->id}/branding/b.png";
        Storage::disk('public')->put($bPath, 'school-b-logo');
        $schoolB->update(['logo_path' => $bPath]);

        $response = $this->actingAs($ownerA, 'web')->post('/api/school/profile/logo', [
            'school_id' => $schoolB->id,
            'logo' => UploadedFile::fake()->image('a.png'),
        ])->assertOk();

        $this->assertStringStartsWith("schools/{$schoolA->id}/branding/", $response->json('data.logo_path'));
        $this->assertSame($bPath, $schoolB->fresh()->logo_path);
        Storage::disk('public')->assertExists($bPath);

        $this->actingAs($ownerA, 'web')->deleteJson('/api/school/profile/logo', ['school_id' => $schoolB->id])
            ->assertOk();
        $this->assertSame($bPath, $schoolB->fresh()->logo_path);
        Storage::disk('public')->assertExists($bPath);
    }

    public function test_pdf_logo_sources_are_school_specific_and_missing_logos_are_safe(): void
    {
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();
        $pathA = "schools/{$schoolA->id}/branding/a.png";
        $pathB = "schools/{$schoolB->id}/branding/b.png";
        $pngA = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
        $pngB = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJxkAAAAASUVORK5CYII=');
        Storage::disk('public')->put($pathA, $pngA);
        Storage::disk('public')->put($pathB, $pngB);
        $schoolA->update(['logo_path' => $pathA]);
        $schoolB->update(['logo_path' => $pathB]);

        $branding = app(SchoolBrandingService::class);
        $this->assertNotSame($branding->pdfDataUri($schoolA), $branding->pdfDataUri($schoolB));
        $logoHtml = view('components.school-logo', ['school' => $schoolA])->render();
        $this->assertStringContainsString($branding->pdfDataUri($schoolA), $logoHtml);
        $this->assertStringStartsWith('%PDF-', Pdf::loadHTML("<html><body>{$logoHtml}</body></html>")->output());

        $schoolA->update(['logo_path' => null]);
        $this->assertSame('', trim(view('components.school-logo', ['school' => $schoolA])->render()));
        $this->assertNotNull($branding->pdfDataUri($schoolB->fresh()));
    }
}
