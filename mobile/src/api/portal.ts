import { apiClient } from './client'
import type { Announcement, AttendanceRecord, Child, ExamResultGroup, HomeworkSubmission } from '../types/portal'

export async function fetchAnnouncements(role: string[]): Promise<Announcement[]> {
  const endpoint = role.includes('Parent') ? '/parent/announcements' : '/school/announcements'
  const { data } = await apiClient.get<{ data: Announcement[] }>(endpoint)
  return data.data
}

export async function fetchChildren(): Promise<Child[]> {
  const { data } = await apiClient.get<{ data: Child[] }>('/parent/children')
  return data.data
}

export async function fetchChildAttendance(studentId: string): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<{ data: AttendanceRecord[] }>(`/parent/children/${studentId}/attendance`)
  return data.data
}

export async function fetchChildHomework(studentId: string): Promise<HomeworkSubmission[]> {
  const { data } = await apiClient.get<{ data: HomeworkSubmission[] }>(`/parent/children/${studentId}/homework`)
  return data.data
}

export async function fetchChildResults(studentId: string): Promise<ExamResultGroup[]> {
  const { data } = await apiClient.get<{ data: ExamResultGroup[] }>(`/parent/children/${studentId}/results`)
  return data.data
}
