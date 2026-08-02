import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AiAccessStatus } from '@/types/school'

interface AiAccessIndicatorProps {
  status: AiAccessStatus
  expiresAt: string | null
  suspensionReason: string | null
}

const COPY: Record<AiAccessStatus, { title: string; message: string }> = {
  not_granted: {
    title: 'AI Assistant is a premium feature',
    message: 'AI Assistant access has not yet been granted to your school.',
  },
  active: {
    title: 'AI Assistant',
    message: 'AI Assistant is active for your school.',
  },
  suspended: {
    title: 'AI Assistant access suspended',
    message: 'AI Assistant access has been temporarily suspended. Please contact the Platform Administrator.',
  },
  expired: {
    title: 'AI Assistant access expired',
    message: "Your school's AI Assistant access has expired. Please contact the Platform Administrator for renewal.",
  },
}

// A visible-but-locked indicator, not a hidden one — the point is to make
// clear this is a premium feature gated by the Platform Administrator, not
// to make it look like it doesn't exist. Mirrors the license banner's
// convention of one small, calm signal rather than an intrusive alert.
export function AiAccessIndicator({ status, expiresAt, suspensionReason }: AiAccessIndicatorProps) {
  const [infoOpen, setInfoOpen] = useState(false)
  const navigate = useNavigate()
  const copy = COPY[status]

  function handleClick() {
    if (status === 'active') {
      navigate('/app/ai-assistant')
      return
    }
    setInfoOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={
          status === 'active'
            ? 'AI Assistant is active for your school'
            : 'Premium feature — Platform Administrator approval required'
        }
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors',
          status === 'active'
            ? 'border-amber-300/40 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25'
            : status === 'not_granted'
              ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/15'
              : 'border-destructive/40 bg-destructive/15 text-white hover:bg-destructive/25'
        )}
      >
        {status === 'suspended' || status === 'expired' ? (
          <AlertTriangle className="size-3.5" />
        ) : (
          <Sparkles className={cn('size-3.5 text-amber-300', status === 'not_granted' && 'animate-ai-glow')} />
        )}
        {status === 'not_granted' && <Lock className="size-3 opacity-70" />}
        AI Assistant
        <Badge
          variant="outline"
          className="border-white/25 bg-transparent px-1.5 py-0 text-[10px] text-inherit uppercase"
        >
          {status === 'active' ? 'Active' : status === 'not_granted' ? 'Premium' : status}
        </Badge>
      </button>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.message}</DialogDescription>
          </DialogHeader>
          {status === 'suspended' && suspensionReason && (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Reason: {suspensionReason}</p>
          )}
          {status === 'expired' && expiresAt && (
            <p className="text-sm text-muted-foreground">Access expired on {new Date(expiresAt).toLocaleDateString()}.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
