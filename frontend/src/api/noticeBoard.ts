import axios from 'axios'
import { apiOrigin } from '@/api/client'

/**
 * A separate, unauthenticated axios instance — the Notice Board is public
 * (see NoticeBoardController), so it must never send the SPA's session
 * cookie or an Authorization header the way `apiClient` does.
 */
const publicClient = axios.create({
  baseURL: `${apiOrigin}/api/public`,
  headers: { Accept: 'application/json' },
})

export interface NoticeBoardExam {
  id: string
  name: string
  exam_type: string
  academic_year_name: string | null
}

export interface NoticeBoardClass {
  id: string
  name: string
}

export interface NoticeBoardRankingRow {
  position: number
  name: string
  admission_number: string
  average_percentage: number
  grade: string | null
}

export interface NoticeBoardRanking {
  exam_name: string
  class_name: string
  ranking: NoticeBoardRankingRow[]
}

export async function fetchNoticeBoardExams(slug: string): Promise<NoticeBoardExam[]> {
  const { data } = await publicClient.get<{ data: NoticeBoardExam[] }>(`/schools/${slug}/notice-board/exams`)
  return data.data
}

export async function fetchNoticeBoardClasses(slug: string, examId: string): Promise<NoticeBoardClass[]> {
  const { data } = await publicClient.get<{ data: NoticeBoardClass[] }>(
    `/schools/${slug}/notice-board/exams/${examId}/classes`
  )
  return data.data
}

export async function fetchNoticeBoardRanking(
  slug: string,
  examId: string,
  schoolClassId: string
): Promise<NoticeBoardRanking> {
  const { data } = await publicClient.get<{ data: NoticeBoardRanking }>(
    `/schools/${slug}/notice-board/exams/${examId}/classes/${schoolClassId}/ranking`
  )
  return data.data
}
