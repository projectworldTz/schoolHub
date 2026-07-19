import { describe, expect, it } from 'vitest'
import { rankByMarks } from '@/lib/ranking'
import type { ExamResult } from '@/types/exams'

function result(studentId: string, marks: string | null): ExamResult {
  return {
    id: studentId,
    exam_subject_id: 'subject-1',
    student_id: studentId,
    marks_obtained: marks,
    grade: null,
    remarks: null,
  }
}

describe('rankByMarks', () => {
  it('ranks highest marks first', () => {
    const ranks = rankByMarks([result('a', '40'), result('b', '90'), result('c', '70')])

    expect(ranks.get('b')).toBe(1)
    expect(ranks.get('c')).toBe(2)
    expect(ranks.get('a')).toBe(3)
  })

  it('gives tied marks the same rank and skips the next position accordingly', () => {
    const ranks = rankByMarks([result('first', '90'), result('tiedA', '70'), result('tiedB', '70'), result('last', '50')])

    expect(ranks.get('first')).toBe(1)
    expect(ranks.get('tiedA')).toBe(2)
    expect(ranks.get('tiedB')).toBe(2)
    expect(ranks.get('last')).toBe(4)
  })

  it('excludes students with no marks recorded from the ranking entirely', () => {
    const ranks = rankByMarks([result('graded', '80'), result('ungraded', null)])

    expect(ranks.has('graded')).toBe(true)
    expect(ranks.has('ungraded')).toBe(false)
  })

  it('returns an empty map for an empty result set', () => {
    expect(rankByMarks([]).size).toBe(0)
  })

  it('ranks a three-way tie for first as 1, 1, 1, 4', () => {
    const ranks = rankByMarks([result('a', '80'), result('b', '80'), result('c', '80'), result('d', '60')])

    expect(ranks.get('a')).toBe(1)
    expect(ranks.get('b')).toBe(1)
    expect(ranks.get('c')).toBe(1)
    expect(ranks.get('d')).toBe(4)
  })
})
