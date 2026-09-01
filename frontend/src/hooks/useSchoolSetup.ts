import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  academicYearsApi,
  branchesApi,
  createTerm,
  deleteTerm,
  departmentsApi,
  fetchSchoolProfile,
  holidaysApi,
  listTerms,
  schoolPaymentAccountsApi,
  updateSchoolProfile,
  uploadSchoolLogo,
  removeSchoolLogo,
  updateTerm,
  type SchoolPaymentAccountPayload,
} from '@/api/school-setup'
import type { AcademicYear, Branch, Department, Holiday, SchoolPaymentAccount, Term } from '@/types/school-setup'

export const useBranches = createCrudHooks<Branch>('branches', branchesApi)
export const useDepartments = createCrudHooks<Department>('departments', departmentsApi)
export const useAcademicYears = createCrudHooks<AcademicYear>('academic-years', academicYearsApi)
export const useHolidays = createCrudHooks<Holiday>('holidays', holidaysApi)
export const useSchoolPaymentAccounts = createCrudHooks<SchoolPaymentAccount, SchoolPaymentAccountPayload>(
  'payment-accounts',
  schoolPaymentAccountsApi
)

export function useSchoolProfile() {
  return useQuery({ queryKey: ['school', 'profile'], queryFn: fetchSchoolProfile })
}

export function useUpdateSchoolProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSchoolProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'profile'] }),
  })
}

export function useUploadSchoolLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadSchoolLogo,
    onSuccess: (school) => queryClient.setQueryData(['school', 'profile'], school),
  })
}

export function useRemoveSchoolLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeSchoolLogo,
    onSuccess: (school) => queryClient.setQueryData(['school', 'profile'], school),
  })
}

export function useTerms(academicYearId: string | null) {
  return useQuery({
    queryKey: ['school', 'academic-years', academicYearId, 'terms'],
    queryFn: () => listTerms(academicYearId as string),
    enabled: Boolean(academicYearId),
  })
}

export function useCreateTerm(academicYearId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Term>) => createTerm(academicYearId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['school', 'academic-years', academicYearId, 'terms'] }),
  })
}

export function useUpdateTerm(academicYearId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Term> }) => updateTerm(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['school', 'academic-years', academicYearId, 'terms'] }),
  })
}

export function useDeleteTerm(academicYearId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTerm,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['school', 'academic-years', academicYearId, 'terms'] }),
  })
}
