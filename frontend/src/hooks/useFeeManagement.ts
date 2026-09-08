import { useCurrentUser } from '@/hooks/useAuth'

export function useFeeManagementEnabled() {
  const { data: user } = useCurrentUser()
  return user?.fee_management_enabled === true
}
