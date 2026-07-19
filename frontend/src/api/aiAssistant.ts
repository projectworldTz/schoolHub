import { apiClient } from '@/api/client'
import type { ChatMessage, LessonPlan, LessonPlanParams } from '@/types/aiAssistant'

export async function fetchAiAssistantStatus(): Promise<{ configured: boolean }> {
  const { data } = await apiClient.get<{ data: { configured: boolean } }>('/school/ai-assistant/status')
  return data.data
}

export async function sendAiChat(messages: ChatMessage[]): Promise<string> {
  const { data } = await apiClient.post<{ data: { reply: string } }>('/school/ai-assistant/chat', { messages })
  return data.data.reply
}

export async function generateLessonPlan(params: LessonPlanParams): Promise<LessonPlan> {
  const { data } = await apiClient.post<{ data: LessonPlan }>('/school/ai-assistant/lesson-plan', params)
  return data.data
}
