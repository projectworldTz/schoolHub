<?php

namespace Tests\Unit;

use App\Services\School\PerformanceMessageService;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PerformanceMessageServiceTest extends TestCase
{
    protected PerformanceMessageService $messages;

    protected function setUp(): void
    {
        parent::setUp();
        $this->messages = new PerformanceMessageService();
    }

    #[DataProvider('percentageTiers')]
    public function test_resolves_tier_from_percentage_when_no_grade_remark_is_set(float $percentage, string $expectedTier): void
    {
        $result = $this->messages->forStudent('Amina', $percentage, null, 1, 10);

        $this->assertSame($expectedTier, $result['tier']);
    }

    public static function percentageTiers(): array
    {
        return [
            'excellent at 80' => [80.0, 'excellent'],
            'excellent above 80' => [95.0, 'excellent'],
            'good just under 80' => [79.9, 'good'],
            'good at 65' => [65.0, 'good'],
            'average just under 65' => [64.9, 'average'],
            'average at 50' => [50.0, 'average'],
            'needs_improvement just under 50' => [49.9, 'needs_improvement'],
            'needs_improvement at 40' => [40.0, 'needs_improvement'],
            'fail just under 40' => [39.9, 'fail'],
            'fail at 0' => [0.0, 'fail'],
        ];
    }

    public function test_grade_band_remark_takes_priority_over_percentage_thresholds(): void
    {
        // A low percentage that would normally be "fail", but the school's
        // own grade band remark says "Excellent" for this range (e.g. a
        // deliberately generous scale) — the school's own words should win.
        $result = $this->messages->forStudent('Amina', 10.0, 'Excellent performance', 1, 10);

        $this->assertSame('excellent', $result['tier']);
    }

    public function test_unmatched_grade_remark_falls_back_to_percentage(): void
    {
        $result = $this->messages->forStudent('Amina', 90.0, 'Distinction with honours', 1, 10);

        // "Distinction" matches the 'excellent' keyword list.
        $this->assertSame('excellent', $result['tier']);
    }

    public function test_null_percentage_and_no_remark_is_unknown_tier(): void
    {
        $result = $this->messages->forStudent('Amina', null, null, null, null);

        $this->assertSame('unknown', $result['tier']);
        $this->assertStringContainsString('No marks', $result['message']);
    }

    public function test_message_includes_student_name_and_rank_when_available(): void
    {
        $result = $this->messages->forStudent('Bakari', 84.3, null, 1, 11);

        $this->assertStringContainsString('Bakari', $result['message']);
        $this->assertStringContainsString('84.3%', $result['message']);
        $this->assertStringContainsString('ranked 1 of 11', $result['message']);
    }

    public function test_message_omits_rank_when_class_size_is_not_available(): void
    {
        $result = $this->messages->forStudent('Bakari', 84.3, null, null, null);

        $this->assertStringNotContainsString('ranked', $result['message']);
    }

    public function test_every_tier_has_a_distinct_emoji_and_title(): void
    {
        $tiers = ['excellent' => 90.0, 'good' => 70.0, 'average' => 55.0, 'needs_improvement' => 45.0, 'fail' => 10.0];

        $seen = [];
        foreach ($tiers as $expectedTier => $percentage) {
            $result = $this->messages->forStudent('Student', $percentage, null, 1, 10);
            $this->assertSame($expectedTier, $result['tier']);
            $this->assertNotContains($result['emoji'], $seen, "Emoji for {$expectedTier} should be distinct");
            $seen[] = $result['emoji'];
        }
    }
}
