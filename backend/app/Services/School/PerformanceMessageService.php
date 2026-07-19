<?php

namespace App\Services\School;

/**
 * Turns a raw average percentage (plus whatever remark the academic
 * teacher configured on the matching grade band, e.g. "Excellent") into a
 * warm, parent-facing message — reused on report cards, the Parent Portal,
 * and the Parent Dashboard so the tone is consistent everywhere a
 * guardian sees it. The grade band's own remark (school-configured, see
 * GradingSystemRequest) takes priority over the percentage thresholds
 * below when it can be matched to a known tier, since that's the school's
 * own stated policy; the thresholds are only a fallback for schools that
 * leave the remark blank.
 */
class PerformanceMessageService
{
    protected const TIER_KEYWORDS = [
        'excellent' => ['excellent', 'outstanding', 'distinction'],
        'good' => ['good', 'credit', 'merit'],
        'average' => ['average', 'satisfactory', 'fair'],
        'needs_improvement' => ['weak', 'below average', 'improvement'],
        'fail' => ['fail', 'poor'],
    ];

    public function forStudent(string $name, ?float $averagePercentage, ?string $gradeRemark, ?int $position, ?int $classSize): array
    {
        $tier = $this->resolveTier($averagePercentage, $gradeRemark);

        return $this->buildMessage($tier, $name, $averagePercentage, $position, $classSize);
    }

    protected function resolveTier(?float $percentage, ?string $gradeRemark): string
    {
        if ($gradeRemark) {
            $normalized = strtolower($gradeRemark);
            foreach (self::TIER_KEYWORDS as $tier => $keywords) {
                foreach ($keywords as $keyword) {
                    if (str_contains($normalized, $keyword)) {
                        return $tier;
                    }
                }
            }
        }

        if ($percentage === null) {
            return 'unknown';
        }

        return match (true) {
            $percentage >= 80 => 'excellent',
            $percentage >= 65 => 'good',
            $percentage >= 50 => 'average',
            $percentage >= 40 => 'needs_improvement',
            default => 'fail',
        };
    }

    protected function buildMessage(string $tier, string $name, ?float $percentage, ?int $position, ?int $classSize): array
    {
        $pct = $percentage !== null ? round($percentage, 1).'%' : 'no marks yet';
        $rank = ($position && $classSize) ? " (ranked {$position} of {$classSize} in class)" : '';

        return match ($tier) {
            'excellent' => [
                'tier' => 'excellent',
                'emoji' => '🏆',
                'title' => 'Outstanding performance!',
                'message' => "Congratulations! {$name} scored {$pct}{$rank} — truly excellent work. This calls for a little celebration at home! 🎉",
            ],
            'good' => [
                'tier' => 'good',
                'emoji' => '🎉',
                'title' => 'Well done!',
                'message' => "{$name} did well, scoring {$pct}{$rank}. A little more consistency and they'll be right at the top — keep encouraging them!",
            ],
            'average' => [
                'tier' => 'average',
                'emoji' => '📘',
                'title' => 'Steady, with room to grow',
                'message' => "{$name} scored {$pct}{$rank}. They're getting by, but a bit of extra practice at home would help them move up.",
            ],
            'needs_improvement' => [
                'tier' => 'needs_improvement',
                'emoji' => '📣',
                'title' => 'Time to pull up the socks',
                'message' => "{$name} scored {$pct}{$rank}, below where they're capable of. Let's team up — a short chat with the class teacher could help {$name} get back on track.",
            ],
            'fail' => [
                'tier' => 'fail',
                'emoji' => '🤝',
                'title' => "Let's support {$name}",
                'message' => "{$name} found this exam very difficult, scoring {$pct}{$rank}. This isn't cause for worry, but it does need attention — please reach out to the class teacher so we can help {$name} catch up together.",
            ],
            default => [
                'tier' => 'unknown',
                'emoji' => 'ℹ️',
                'title' => 'No results yet',
                'message' => "No marks have been recorded for {$name} in this exam yet.",
            ],
        };
    }
}
