import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useSuspendSchool } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SuspendSchoolDialogProps {
  schoolId: string
  schoolName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspendSchoolDialog({
  schoolId,
  schoolName,
  open,
  onOpenChange,
}: SuspendSchoolDialogProps) {
  const [reason, setReason] = useState('')
  const suspendSchool = useSuspendSchool()

  function handleSuspend() {
    if (!reason.trim()) {
      toast.error('A reason is required to suspend a school')
      return
    }

    suspendSchool.mutate(
      { id: schoolId, reason },
      {
        onSuccess: () => {
          toast.success(`${schoolName} suspended`)
          setReason('')
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not suspend school')
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
          <DialogTitle>Suspend {schoolName}</DialogTitle>
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
            disabled={suspendSchool.isPending}
          >
            {suspendSchool.isPending ? 'Suspending…' : 'Suspend school'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
