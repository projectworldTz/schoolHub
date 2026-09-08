<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class SchoolFeatureAccessTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_facilities_can_be_disabled_and_reenabled_only_by_super_admin(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $other = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $super = $this->createUser($other, 'Super Admin');
        $routes = ['library' => 'books', 'hostel' => 'hostel-rooms', 'transport' => 'transport-routes',
            'cafeteria' => 'cafeteria-menus', 'clinic' => 'clinic-visits', 'inventory' => 'inventory-items'];
        foreach ($routes as $feature => $route) {
            $endpoint = "/api/platform/schools/{$school->id}/features/{$feature}";
            $this->assertTrue($school->fresh()->getAttribute($feature.'_enabled'));
            $this->actingAs($owner)->putJson($endpoint, ['enabled' => false])->assertForbidden();
            $this->actingAs($super)->putJson($endpoint, ['enabled' => 'invalid'])->assertUnprocessable();
            $this->putJson($endpoint, ['enabled' => false])->assertOk()->assertJsonPath('data.'.$feature.'_enabled', false);
            $this->assertTrue($other->fresh()->getAttribute($feature.'_enabled'));
            $this->actingAs($owner)->getJson('/api/school/'.$route)->assertForbidden();
            $this->postJson('/api/school/'.$route, [])->assertForbidden();
            $this->getJson('/api/auth/me')->assertJsonPath('data.'.$feature.'_enabled', false);
            $this->actingAs($super)->putJson($endpoint, ['enabled' => true])->assertOk();
            $this->actingAs($owner)->getJson('/api/school/'.$route)->assertOk();
        }
    }

    public function test_setup_persists_selected_features(): void
    {
        $this->seedPermissions();
        $super = $this->createUser($this->createSchool(), 'Super Admin');
        $settings = ['fee_management_enabled' => false, 'library_enabled' => false, 'hostel_enabled' => true,
            'transport_enabled' => false, 'cafeteria_enabled' => true, 'clinic_enabled' => false, 'inventory_enabled' => false];
        $response = $this->actingAs($super)->postJson('/api/platform/schools', array_merge([
            'name' => 'Feature School', 'slug' => 'feature-school', 'type' => 'secondary',
            'license_duration_months' => 12, 'owner_name' => 'Owner', 'owner_email' => 'features@example.test',
        ], $settings))->assertCreated();
        foreach ($settings as $field => $enabled) {
            $response->assertJsonPath('data.'.$field, $enabled);
        }
        $this->assertDatabaseHas('schools', array_merge(['id' => $response->json('data.id')], $settings));
    }

    public function test_bulk_save_validates_all_settings_before_applying_changes(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $super = $this->createUser($school, 'Super Admin');
        $settings = \App\Services\School\SchoolFeatureAccess::states($school);
        $settings['library_enabled'] = false;
        $settings['clinic_enabled'] = false;
        $endpoint = "/api/platform/schools/{$school->id}/features";
        $this->actingAs($owner)->putJson($endpoint, $settings)->assertForbidden();
        $this->actingAs($super)->putJson($endpoint, array_merge($settings, ['inventory_enabled' => 'invalid']))->assertUnprocessable();
        $this->assertTrue($school->fresh()->library_enabled);
        $this->putJson($endpoint, ['library_enabled' => false])->assertUnprocessable();
        $response = $this->putJson($endpoint, $settings)->assertOk();
        foreach ($settings as $field => $enabled) {
            $response->assertJsonPath('data.'.$field, $enabled);
            $this->assertSame($enabled, $school->fresh()->getAttribute($field));
        }
        $settings['library_enabled'] = true;
        $settings['clinic_enabled'] = true;
        $this->putJson($endpoint, $settings)->assertOk();
        $this->assertTrue($school->fresh()->library_enabled);
        $this->assertTrue($school->fresh()->clinic_enabled);
    }

    public function test_disabled_library_preserves_books_and_blocks_reports_and_token_routes(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $super = $this->createUser($school, 'Super Admin');
        $book = \App\Models\Book::create(['school_id' => $school->id, 'title' => 'Retained Book']);
        $before = $book->fresh()->getAttributes();
        $endpoint = "/api/platform/schools/{$school->id}/features/library";
        $this->actingAs($super)->putJson($endpoint, ['enabled' => false])->assertOk();
        $this->actingAs($owner)->deleteJson('/api/school/books/'.$book->id)->assertForbidden();
        $this->getJson('/api/school/reports/library-loans')->assertForbidden();
        $catalog = $this->getJson('/api/school/reports')->assertOk();
        $this->assertNotContains('library-loans', array_column($catalog->json('data'), 'key'));
        \Laravel\Sanctum\Sanctum::actingAs($owner, ['*']);
        $this->getJson('/api/v1/school/books')->assertForbidden();
        $this->assertSame($before, $book->fresh()->getAttributes());
        $this->actingAs($super, 'web')->putJson($endpoint, ['enabled' => true])->assertOk();
        $this->assertSame($before, $book->fresh()->getAttributes());
    }
}
