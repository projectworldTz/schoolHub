import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsStandalone } from '@/hooks/useIsStandalone'
import { cn } from '@/lib/utils'

/**
 * Installed-app users have no browser chrome, so there's no back/forward
 * button to fall back on — only shown in standalone/PWA mode, same as
 * RefreshButton. navigate(-1)/(1) drives the same session history the
 * browser's own back/forward buttons would, so it works across the whole
 * app without each page needing its own "back" handler.
 */
export function NavigationButtons({ className }: { className?: string }) {
  const isStandalone = useIsStandalone()
  const navigate = useNavigate()

  if (!isStandalone) return null

  return (
    <span className={cn('flex items-center', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Back</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(1)}>
            <ChevronRight className="size-4" />
            <span className="sr-only">Forward</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Forward</TooltipContent>
      </Tooltip>
    </span>
  )
}
