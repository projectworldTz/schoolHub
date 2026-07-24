import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useRenewSchoolLicense } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LicenseDurationMonths } from '@/types/school'

const LICENSE_DURATIONS: { value: LicenseDurationMonths; label: string }[] = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
]

interface RenewLicenseDialogProps {
  schoolId: string
  schoolName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenewLicenseDialog({ schoolId, schoolName, open, onOpenChange }: RenewLicenseDialogProps) {
  const [months, setMonths] = useState<LicenseDurationMonths>(1)
  const renew = useRenewSchoolLicense()

  function handleRenew() {
    renew.mutate(
      { id: schoolId, months },
      {
        onSuccess: () => {
          toast.success(`${schoolName}'s license renewed for ${months} month${months === 1 ? '' : 's'}`)
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not renew license')
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
          <DialogTitle>Renew {schoolName}'s license</DialogTitle>
          <DialogDescription>Extends from today, regardless of the current expiry date.</DialogDescription>
        </DialogHeader>
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v) as LicenseDurationMonths)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LICENSE_DURATIONS.map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleRenew} disabled={renew.isPending}>
            {renew.isPending ? 'Renewing…' : 'Renew license'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
