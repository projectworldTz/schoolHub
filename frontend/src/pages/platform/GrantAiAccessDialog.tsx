import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useGrantSchoolAiAccess } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { School } from '@/types/school'

interface GrantAiAccessDialogProps {
  school: School
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

// Doubles as the "renew/adjust" action — re-opening on an already-active
// school pre-fills its current expiry and limit rather than starting blank.
export function GrantAiAccessDialog({ school, open, onOpenChange }: GrantAiAccessDialogProps) {
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(school.ai_expires_at))
  const [monthlyLimit, setMonthlyLimit] = useState(
    school.ai_monthly_request_limit != null ? String(school.ai_monthly_request_limit) : ''
  )
  const grant = useGrantSchoolAiAccess()

  function handleGrant() {
    grant.mutate(
      {
        id: school.id,
        payload: {
          expires_at: expiresAt || null,
          monthly_request_limit: monthlyLimit.trim() ? Number(monthlyLimit) : null,
        },
      },
      {
        onSuccess: () => {
          toast.success(`AI Assistant access granted to ${school.name}`)
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not grant AI access')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {school.ai_access_status === 'not_granted' ? 'Grant' : 'Adjust'} AI Assistant access for {school.name}
          </DialogTitle>
          <DialogDescription>
            Activates immediately. Leave a field blank for no expiry / no monthly cap.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ai-expires-at">Expires on (optional)</Label>
            <Input
              id="ai-expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-monthly-limit">Monthly request limit (optional)</Label>
            <Input
              id="ai-monthly-limit"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleGrant} disabled={grant.isPending}>
            {grant.isPending ? 'Saving…' : school.ai_access_status === 'not_granted' ? 'Grant access' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
