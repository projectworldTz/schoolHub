import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  requireRole?: string
}

export function ProtectedRoute({ requireRole }: ProtectedRouteProps) {
  const { data: user, isLoading, isError } = useCurrentUser()

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

  if (requireRole && !user.roles?.includes(requireRole)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
