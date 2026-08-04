import { useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { QrCode, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useChildFees, useChildResults, useScannedStudent } from '@/hooks/useParentPortal'
import { ParentRewardCard } from '@/components/parent/ParentRewardCard'
import { FeesTable } from '@/components/parent/FeesTable'
import { ExamResultsList } from '@/components/parent/ExamResultsList'

/**
 * Landing page for a scanned student QR code (see Student::$qr_code and
 * ParentPortalController::scan()). Reachable only by a signed-in parent
 * whose own guardian record is linked to this exact student — anyone else
 * (wrong parent, no account, another role) gets a friendly "not available"
 * message here rather than a raw error, since a stranger who finds a
 * printed ID card is expected to land on this page.
 */
export function ScanStudentPage() {
  const { qrCode = '' } = useParams<{ qrCode: string }>()
  const { data: student, isLoading, isError, error } = useScannedStudent(qrCode)
  const { data: results, isLoading: resultsLoading } = useChildResults(student?.id ?? '')
  const { data: invoices, isLoading: invoicesLoading } = useChildFees(student?.id ?? '')

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <QrCode className="mr-2 size-5 animate-pulse" />
        Looking up this student…
      </div>
    )
  }

  if (isError) {
    const status = isAxiosError(error) ? error.response?.status : null
    const message =
      status === 404
        ? "We couldn't find a student for this QR code."
        : "This QR code isn't linked to your parent account.";

    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </span>
            <p className="font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              If you believe this is your child, contact the school office to confirm your guardian link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{student.full_name}</CardTitle>
          <CardDescription>
            Admission #{student.admission_number}
            {student.current_enrollment && ` · ${student.current_enrollment.school_class_name}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {!invoicesLoading && invoices && <ParentRewardCard studentName={student.first_name} invoices={invoices} />}

      <FeesTable invoices={invoices} loading={invoicesLoading} />
      <ExamResultsList results={results} loading={resultsLoading} />
    </div>
  )
}
