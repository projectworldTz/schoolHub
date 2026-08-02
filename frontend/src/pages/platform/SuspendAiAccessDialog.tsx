import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useSuspendSchoolAiAccess } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SuspendAiAccessDialogProps {
  schoolId: string
  schoolName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspendAiAccessDialog({ schoolId, schoolName, open, onOpenChange }: SuspendAiAccessDialogProps) {
  const [reason, setReason] = useState('')
  const suspend = useSuspendSchoolAiAccess()

  function handleSuspend() {
    if (!reason.trim()) {
      toast.error('A reason is required to suspend AI access')
      return
    }

    suspend.mutate(
      { id: schoolId, reason },
      {
        onSuccess: () => {
          toast.success(`AI Assistant access suspended for ${schoolName}`)
          setReason('')
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not suspend AI access')
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
          <DialogTitle>Suspend AI Assistant access for {schoolName}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Reason for suspension…"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={suspend.isPending}
          >
            {suspend.isPending ? 'Suspending…' : 'Suspend AI access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
