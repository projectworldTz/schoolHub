import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchAiAssistantStatus, generateLessonPlan, sendAiChat } from '@/api/aiAssistant'

export function useAiAssistantStatus() {
  return useQuery({
    queryKey: ['school', 'ai-assistant', 'status'],
    queryFn: fetchAiAssistantStatus,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAiChat() {
  return useMutation({ mutationFn: sendAiChat })
}

export function useGenerateLessonPlan() {
  return useMutation({ mutationFn: generateLessonPlan })
}
