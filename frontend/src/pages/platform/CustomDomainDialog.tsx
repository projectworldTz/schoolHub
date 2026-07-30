import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useSetSchoolCustomDomain } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CustomDomainDialogProps {
  schoolId: string
  schoolName: string
  currentDomain: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomDomainDialog({ schoolId, schoolName, currentDomain, open, onOpenChange }: CustomDomainDialogProps) {
  const [domain, setDomain] = useState(currentDomain ?? '')
  const setCustomDomain = useSetSchoolCustomDomain()

  function handleSave() {
    setCustomDomain.mutate(
      { id: schoolId, customDomain: domain.trim() || null },
      {
        onSuccess: () => {
          toast.success(domain.trim() ? `Custom domain set for ${schoolName}` : `Custom domain cleared for ${schoolName}`)
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update custom domain')
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
          <DialogTitle>Custom domain for {schoolName}</DialogTitle>
          <DialogDescription>
            Setting this alone does nothing yet — it only takes effect once the school's DNS actually points this
            domain at our server and it has a valid SSL certificate. Leave blank to clear it.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. myschool.co.tz"
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={setCustomDomain.isPending}>
            {setCustomDomain.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
