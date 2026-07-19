import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listConversations, listMessages, sendMessage, startConversation } from '@/api/messages'

const CONVERSATIONS_KEY = ['school', 'conversations'] as const

export function useConversations() {
  return useQuery({ queryKey: CONVERSATIONS_KEY, queryFn: listConversations, refetchInterval: 20000 })
}

export function useStartConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recipientId: string) => startConversation(recipientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  })
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, conversationId, 'messages'],
    queryFn: () => listMessages(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 8000,
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, conversationId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
  })
}
