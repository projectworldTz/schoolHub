import { useQuery } from '@tanstack/react-query'
import { fetchNoticeBoardClasses, fetchNoticeBoardExams, fetchNoticeBoardRanking } from '@/api/noticeBoard'

export function useNoticeBoardExams(slug: string) {
  return useQuery({
    queryKey: ['notice-board', slug, 'exams'],
    queryFn: () => fetchNoticeBoardExams(slug),
    enabled: Boolean(slug),
  })
}

export function useNoticeBoardClasses(slug: string, examId: string) {
  return useQuery({
    queryKey: ['notice-board', slug, 'exams', examId, 'classes'],
    queryFn: () => fetchNoticeBoardClasses(slug, examId),
    enabled: Boolean(slug && examId),
  })
}

export function useNoticeBoardRanking(slug: string, examId: string, schoolClassId: string) {
  return useQuery({
    queryKey: ['notice-board', slug, 'exams', examId, 'classes', schoolClassId, 'ranking'],
    queryFn: () => fetchNoticeBoardRanking(slug, examId, schoolClassId),
    enabled: Boolean(slug && examId && schoolClassId),
  })
}
