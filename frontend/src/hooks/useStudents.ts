import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  attachGuardian,
  createStudent,
  deleteDocument,
  detachGuardian,
  enrollStudent,
  fetchStudent,
  grantGuardianPortalAccess,
  importStudents,
  listEnrollments,
  listStudentDocuments,
  listStudents,
  updateStudent,
  uploadStudentDocument,
  type AttachGuardianPayload,
  type EnrollPayload,
  type StudentPayload,
} from '@/api/students'

const STUDENTS_KEY = ['school', 'students'] as const

export function useStudents(search = '', branchId?: string) {
  return useQuery({ queryKey: [...STUDENTS_KEY, search, branchId], queryFn: () => listStudents(search, branchId) })
}

export function useStudent(id: string) {
  return useQuery({ queryKey: [...STUDENTS_KEY, id], queryFn: () => fetchStudent(id), enabled: Boolean(id) })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StudentPayload) => createStudent(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDENTS_KEY }),
  })
}

export function useImportStudents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) => importStudents(file, dryRun),
    onSuccess: (result) => {
      if (result.committed) {
        queryClient.invalidateQueries({ queryKey: STUDENTS_KEY })
      }
    },
  })
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<StudentPayload>) => updateStudent(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDENTS_KEY }),
  })
}

export function useAttachGuardian(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AttachGuardianPayload) => attachGuardian(studentId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, studentId] }),
  })
}

export function useDetachGuardian(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guardianId: string) => detachGuardian(studentId, guardianId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, studentId] }),
  })
}

export function useEnrollments(studentId: string) {
  return useQuery({
    queryKey: [...STUDENTS_KEY, studentId, 'enrollments'],
    queryFn: () => listEnrollments(studentId),
    enabled: Boolean(studentId),
  })
}

export function useEnrollStudent(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EnrollPayload) => enrollStudent(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, studentId] })
      queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, studentId, 'enrollments'] })
    },
  })
}

export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: [...STUDENTS_KEY, studentId, 'documents'],
    queryFn: () => listStudentDocuments(studentId),
    enabled: Boolean(studentId),
  })
}

export function useUploadStudentDocument(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadStudentDocument(studentId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, studentId, 'documents'] }),
  })
}

export function useDeleteDocument(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, studentId, 'documents'] }),
  })
}

export function useGrantGuardianPortalAccess(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guardianId, email }: { guardianId: string; email: string }) =>
      grantGuardianPortalAccess(guardianId, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, studentId] }),
  })
}
