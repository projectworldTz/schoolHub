import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useAuth'

/** Sends a freshly-authenticated user to the right area for their role. */
export function HomeRedirect() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (user?.roles?.includes('Super Admin')) {
    return <Navigate to="/platform/schools" replace />
  }

  if (user?.roles?.includes('Parent')) {
    return <Navigate to="/parent/dashboard" replace />
  }

  return <Navigate to="/app/dashboard" replace />
}
