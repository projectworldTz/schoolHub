import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  requireRole?: string
}

export function ProtectedRoute({ requireRole }: ProtectedRouteProps) {
  const { data: user, isLoading, isError } = useCurrentUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />
  }

  // A temporary password (SchoolService::create()) must be replaced before
  // anything else is reachable — the backend enforces this too
  // (EnsurePasswordHasBeenChanged), this is just so the UI doesn't dead-end
  // on a 423 from the first API call the destination page makes.
  if (user.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (requireRole && !user.roles?.includes(requireRole)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
