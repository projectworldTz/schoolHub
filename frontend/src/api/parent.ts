import { apiClient } from '@/api/client'
import type { Student } from '@/types/students'
import type { Invoice } from '@/types/finance'
import type { ParentAnnouncement, ParentAttendanceRecord, ParentHomeworkItem, ParentResultGroup } from '@/types/parent'

export async function fetchMyChildren(): Promise<Student[]> {
  const { data } = await apiClient.get<{ data: Student[] }>('/parent/children')
  return data.data
}

export async function fetchChildAttendance(studentId: string): Promise<ParentAttendanceRecord[]> {
  const { data } = await apiClient.get<{ data: ParentAttendanceRecord[] }>(`/parent/children/${studentId}/attendance`)
  return data.data
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

export async function fetchParentAnnouncements(): Promise<ParentAnnouncement[]> {
  const { data } = await apiClient.get<{ data: ParentAnnouncement[] }>('/parent/announcements')
  return data.data
}
