import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useGrantSchoolWebsiteAccess } from '@/hooks/useSchools'
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

interface GrantWebsiteAccessDialogProps {
  school: School
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

// Doubles as the "renew/adjust" action, same as GrantAiAccessDialog.
export function GrantWebsiteAccessDialog({ school, open, onOpenChange }: GrantWebsiteAccessDialogProps) {
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(school.website_expires_at))
  const grant = useGrantSchoolWebsiteAccess()

  function handleGrant() {
    grant.mutate(
      { id: school.id, payload: { expires_at: expiresAt || null } },
      {
        onSuccess: () => {
          toast.success(`Website Builder access granted to ${school.name}`)
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not grant Website Builder access')
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
            {school.website_access_status === 'not_granted' ? 'Grant' : 'Adjust'} Website Builder access for {school.name}
          </DialogTitle>
          <DialogDescription>Activates immediately. Leave blank for no expiry.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="website-expires-at">Expires on (optional)</Label>
          <Input
            id="website-expires-at"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleGrant} disabled={grant.isPending}>
            {grant.isPending ? 'Saving…' : school.website_access_status === 'not_granted' ? 'Grant access' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
