import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateAccount as activateAccountRequest,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from '@/api/auth'
import type { ActivateAccountPayload, LoginPayload } from '@/api/auth'

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

export function useActivateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ActivateAccountPayload) => activateAccountRequest(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutRequest,
    // onSettled, not onSuccess: a logout button must clear local state and
    // let the caller navigate away even if the server call itself fails
    // (expired session, CSRF mismatch, network blip) — the alternative is
    // a user stuck on an authenticated-looking screen with no way out
    // short of a manual refresh.
    onSettled: () => {
      // Full clear (not just the auth query) — the persisted cache in
      // localStorage (see main.tsx) holds real school data (students,
      // grades, fees) for offline viewing, and must not survive a logout
      // on a shared device for the next person to open.
      queryClient.clear()
      window.localStorage.removeItem('schoolhub-query-cache')
    },
  })
}
