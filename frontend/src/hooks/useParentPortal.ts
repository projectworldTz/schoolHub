import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchChildAttendance,
  fetchChildFees,
  fetchChildHomework,
  fetchChildResults,
  fetchMyChildren,
  fetchParentAnnouncements,
  fetchParentConversationMessages,
  fetchParentConversations,
  sendParentMessage,
} from '@/api/parent'

const PARENT_CONVERSATIONS_KEY = ['parent', 'conversations'] as const

export function useMyChildren() {
  return useQuery({ queryKey: ['parent', 'children'], queryFn: fetchMyChildren })
}

export function useChildAttendance(studentId: string) {
  return useQuery({
    queryKey: ['parent', 'children', studentId, 'attendance'],
    queryFn: () => fetchChildAttendance(studentId),
    enabled: Boolean(studentId),
  })
}

export function useChildHomework(studentId: string) {
  return useQuery({
    queryKey: ['parent', 'children', studentId, 'homework'],
    queryFn: () => fetchChildHomework(studentId),
    enabled: Boolean(studentId),
  })
}

export function useChildResults(studentId: string) {
  return useQuery({
    queryKey: ['parent', 'children', studentId, 'results'],
    queryFn: () => fetchChildResults(studentId),
    enabled: Boolean(studentId),
  })
}

export function useChildFees(studentId: string) {
  return useQuery({
    queryKey: ['parent', 'children', studentId, 'fees'],
    queryFn: () => fetchChildFees(studentId),
    enabled: Boolean(studentId),
  })
}

export function useParentAnnouncements() {
  return useQuery({ queryKey: ['parent', 'announcements'], queryFn: fetchParentAnnouncements })
}

export function useParentConversations() {
  return useQuery({ queryKey: PARENT_CONVERSATIONS_KEY, queryFn: fetchParentConversations, refetchInterval: 20000 })
}

export function useParentConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: [...PARENT_CONVERSATIONS_KEY, conversationId, 'messages'],
    queryFn: () => fetchParentConversationMessages(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 8000,
  })
}

export function useSendParentMessage(conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => sendParentMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PARENT_CONVERSATIONS_KEY, conversationId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: PARENT_CONVERSATIONS_KEY })
    },
  })
}
