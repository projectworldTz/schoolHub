import type { ExamResult } from '@/types/exams'

/**
 * Standard "competition ranking" (1, 2, 2, 4 — not 1, 2, 2, 3), computed
 * client-side since the gradebook already has every result loaded — no
 * need for a round-trip just to rank the same rows being displayed.
 * Mirrors ExamService::assignCompetitionRank() on the backend; keep the
 * two in sync if the tie-breaking rule ever changes.
 */
export function rankByMarks(results: ExamResult[]): Map<string, number> {
  const graded = results
    .filter((r) => r.marks_obtained !== null)
    .sort((a, b) => Number(b.marks_obtained) - Number(a.marks_obtained))

  const ranks = new Map<string, number>()
  let rank = 0
  let previous: number | null = null
  graded.forEach((r, index) => {
    const marks = Number(r.marks_obtained)
    if (marks !== previous) {
      rank = index + 1
      previous = marks
    }
    ranks.set(r.student_id, rank)
  })
  return ranks
}
