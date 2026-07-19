import { apiClient } from '@/api/client'
import type { PaginatedResponse } from '@/types/school'
import type { Conversation, Message } from '@/types/messages'

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<{ data: Conversation[] }>('/school/conversations')
  return data.data
}

export async function startConversation(recipientId: string): Promise<Conversation> {
  const { data } = await apiClient.post<{ data: Conversation }>('/school/conversations', { recipient_id: recipientId })
  return data.data
}

export async function listMessages(conversationId: string): Promise<PaginatedResponse<Message>> {
  const { data } = await apiClient.get<PaginatedResponse<Message>>(`/school/conversations/${conversationId}/messages`)
  return data
}

export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  const { data } = await apiClient.post<{ data: Message }>(`/school/conversations/${conversationId}/messages`, { body })
  return data.data
}
