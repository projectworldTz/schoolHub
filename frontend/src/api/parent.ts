import { apiClient } from '@/api/client'
import type { Student } from '@/types/students'
import type { Invoice } from '@/types/finance'
import type { AttendanceTrendPoint } from '@/types/attendance'
import type { PaginatedResponse } from '@/types/school'
import type { Conversation, Message } from '@/types/messages'
import type { ParentAnnouncement, ParentAnnouncementsResponse, ParentAttendanceHistory, ParentAttendanceRecord, ParentHomeworkItem, ParentResultGroup } from '@/types/parent'

export async function fetchMyChildren(): Promise<Student[]> {
  const { data } = await apiClient.get<{ data: Student[] }>('/parent/children')
  return data.data
}

export async function fetchScannedStudent(qrCode: string): Promise<Student> {
  const { data } = await apiClient.get<{ data: Student }>(`/parent/scan/${qrCode}`)
  return data.data
}

export async function fetchChildAttendance(studentId: string): Promise<ParentAttendanceHistory> {
  const { data } = await apiClient.get<{ data: ParentAttendanceRecord[]; meta: { trend: AttendanceTrendPoint[] } }>(
    `/parent/children/${studentId}/attendance`
  )
  return { records: data.data, trend: data.meta.trend }
}

export async function fetchChildHomework(studentId: string): Promise<ParentHomeworkItem[]> {
  const { data } = await apiClient.get<{ data: ParentHomeworkItem[] }>(`/parent/children/${studentId}/homework`)
  return data.data
}

export async function fetchChildResults(studentId: string): Promise<ParentResultGroup[]> {
  const { data } = await apiClient.get<{ data: ParentResultGroup[] }>(`/parent/children/${studentId}/results`)
  return data.data
}

export async function fetchChildFees(studentId: string): Promise<Invoice[]> {
  const { data } = await apiClient.get<{ data: Invoice[] }>(`/parent/children/${studentId}/fees`)
  return data.data
}

export async function fetchParentAnnouncements(): Promise<ParentAnnouncementsResponse> {
  const { data } = await apiClient.get<{ data: ParentAnnouncement[]; meta: { unread_count: number } }>('/parent/announcements')
  return { records: data.data, unread_count: data.meta.unread_count }
}

export async function fetchParentConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<{ data: Conversation[] }>('/parent/conversations')
  return data.data
}

export async function fetchParentConversationMessages(conversationId: string): Promise<PaginatedResponse<Message>> {
  const { data } = await apiClient.get<PaginatedResponse<Message>>(`/parent/conversations/${conversationId}/messages`)
  return data
}

export async function sendParentMessage(conversationId: string, body: string): Promise<Message> {
  const { data } = await apiClient.post<{ data: Message }>(`/parent/conversations/${conversationId}/messages`, { body })
  return data.data
}
