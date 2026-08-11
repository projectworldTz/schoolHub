import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsStandalone } from '@/hooks/useIsStandalone'
import { cn } from '@/lib/utils'

/**
 * Installed-app users have no browser chrome, so there's no pull-to-refresh
 * or reload button to fall back on — only shown in standalone/PWA mode.
 * A plain location.reload() isn't enough here: the service worker's
 * precached assets would just serve the same stale JS/CSS back. Forcing an
 * update check and clearing Cache Storage first guarantees the reload
 * actually fetches the latest build.
 */
async function refreshApp() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.update()))
  }
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
  window.location.reload()
}

export function RefreshButton({ className }: { className?: string }) {
  const isStandalone = useIsStandalone()
  const [refreshing, setRefreshing] = useState(false)

  if (!isStandalone) return null

  function handleClick() {
    setRefreshing(true)
    refreshApp()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('rounded-full', className)}
          onClick={handleClick}
          disabled={refreshing}
        >
          <RotateCw className={cn('size-4', refreshing && 'animate-spin')} />
          <span className="sr-only">Refresh</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Refresh app</TooltipContent>
    </Tooltip>
  )
}
