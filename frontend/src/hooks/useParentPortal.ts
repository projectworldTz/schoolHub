import { useQuery } from '@tanstack/react-query'
import {
  fetchChildAttendance,
  fetchChildFees,
  fetchChildHomework,
  fetchChildResults,
  fetchMyChildren,
  fetchParentAnnouncements,
} from '@/api/parent'

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
