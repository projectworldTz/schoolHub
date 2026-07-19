import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useMarkPayslipPaid, usePayrollRun, useProcessPayrollRun } from '@/hooks/usePayroll'
import type { PayrollRunStatus, PayslipStatus } from '@/types/payroll'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const RUN_STATUS_VARIANT: Record<PayrollRunStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  processed: 'outline',
  paid: 'default',
}

const PAYSLIP_STATUS_VARIANT: Record<PayslipStatus, 'default' | 'secondary'> = {
  pending: 'secondary',
  paid: 'default',
}

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const runId = id ?? ''
  const { data: run, isLoading } = usePayrollRun(runId)
  const process = useProcessPayrollRun(runId)
  const markPaid = useMarkPayslipPaid(runId)

  if (isLoading || !run) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  function handleProcess() {
    process.mutate(undefined, {
      onSuccess: () => toast.success('Payroll processed — payslips generated'),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not process payroll')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  function handleMarkPaid(payslipId: string) {
    markPaid.mutate(payslipId, {
      onSuccess: () => toast.success('Payslip marked as paid'),
    })
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={`${MONTHS[run.month - 1]} ${run.year}`} />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {MONTHS[run.month - 1]} {run.year}
        </h1>
        <Badge variant={RUN_STATUS_VARIANT[run.status]}>{run.status}</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payslips</CardTitle>
            <CardDescription>
              {run.status === 'draft'
                ? 'Process this run to generate a payslip for every staff member with a salary on record.'
                : `${run.payslips?.length ?? 0} payslip(s)`}
            </CardDescription>
          </div>
          {run.status === 'draft' && (
            <Button size="sm" onClick={handleProcess} disabled={process.isPending}>
              {process.isPending ? 'Processing…' : 'Process payroll'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.payslips?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No payslips yet.
                  </TableCell>
                </TableRow>
              )}
              {run.payslips?.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell className="font-medium">{slip.user_name}</TableCell>
                  <TableCell>{Number(slip.basic_salary).toLocaleString()}</TableCell>
                  <TableCell>{Number(slip.allowances).toLocaleString()}</TableCell>
                  <TableCell>{Number(slip.deductions).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{Number(slip.net_salary).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={PAYSLIP_STATUS_VARIANT[slip.status]}>{slip.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {slip.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => handleMarkPaid(slip.id)}>
                        Mark paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
