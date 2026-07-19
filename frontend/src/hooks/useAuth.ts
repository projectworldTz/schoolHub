import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '@/api/auth'
import type { LoginPayload } from '@/api/auth'

export const AUTH_QUERY_KEY = ['auth', 'me'] as const

export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      // Full clear (not just the auth query) — the persisted cache in
      // localStorage (see main.tsx) holds real school data (students,
      // grades, fees) for offline viewing, and must not survive a logout
      // on a shared device for the next person to open.
      queryClient.clear()
      window.localStorage.removeItem('schoolhub-query-cache')
    },
  })
}
