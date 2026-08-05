import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  requireRole?: string
}

export function ProtectedRoute({ requireRole }: ProtectedRouteProps) {
  // isPending (not isLoading): isLoading is isPending && isFetching, so it's
  // FALSE during the brief window where PersistQueryClientProvider is still
  // restoring the persisted cache (query has no data yet, but isn't
  // actively fetching either). On a hard reload of any nested route, that
  // window used to read as "definitely signed out" and bounce straight to
  // /login before the restored session ever got a chance to render —
  // isPending covers both "fetching" and "not started yet" so it doesn't.
  const { data: user, isPending, isError } = useCurrentUser()
  const location = useLocation()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (isError || !user) {
    // Preserve where they were headed (e.g. a scanned QR link,
    // /scan/:qrCode) so LoginPage can send them back there instead of
    // always landing on the role's default home.
    return <Navigate to="/login" replace state={{ from: location }} />
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
