import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Rendered once at the app root (see App.tsx) so it covers every layout —
 * staff, parent, and the login screen alike. Silent request failures are
 * confusing ("why won't this save?"); this makes the actual cause explicit
 * and tells the user what to expect (saved data still visible, new saves
 * won't go through) rather than leaving them to guess.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
      <WifiOff className="size-4 shrink-0" />
      You're offline — showing saved data. Changes won't be saved until you're back online.
    </div>
  )
}
