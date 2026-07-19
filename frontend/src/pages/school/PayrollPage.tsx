import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useCreatePayrollRun, usePayrollRuns, useStaffSalaries } from '@/hooks/usePayroll'
import { useSchoolUsers } from '@/hooks/useSchoolUsers'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import type { PayrollRunStatus } from '@/types/payroll'
import type { StaffSalary } from '@/types/payroll'

const STATUS_VARIANT: Record<PayrollRunStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  processed: 'outline',
  paid: 'default',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const salaryDefaults = { user_id: '', basic_salary: '', allowances: '', deductions: '', effective_from: '' }
const salarySchema = z.object({
  user_id: z.string().min(1, 'Required'),
  basic_salary: z.string().min(1, 'Required'),
  allowances: z.string().optional(),
  deductions: z.string().optional(),
  effective_from: z.string().min(1, 'Required'),
})

function SalariesTab() {
  const { data, isLoading } = useStaffSalaries.useList()
  const { data: users } = useSchoolUsers()
  const create = useStaffSalaries.useCreate()
  const remove = useStaffSalaries.useRemove()
  const form = useForm({ resolver: zodResolver(salarySchema), defaultValues: salaryDefaults })

  const columns: ColumnDef<StaffSalary>[] = [
    { key: 'name', label: 'Staff', render: (s) => s.user_name ?? '—' },
    { key: 'basic', label: 'Basic', render: (s) => Number(s.basic_salary).toLocaleString() },
    { key: 'allowances', label: 'Allowances', render: (s) => Number(s.allowances).toLocaleString() },
    { key: 'deductions', label: 'Deductions', render: (s) => Number(s.deductions).toLocaleString() },
    { key: 'net', label: 'Net', render: (s) => Number(s.net_salary).toLocaleString() },
  ]

  return (
    <SimpleCrudCard
      title="Staff salaries"
      description="Salary structure used when a payroll run is processed."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={salaryDefaults}
      fields={[
        {
          name: 'user_id',
          label: 'Staff member',
          type: 'select',
          options: users?.data.map((u) => ({ value: u.id, label: u.name })) ?? [],
        },
        { name: 'basic_salary', label: 'Basic salary', type: 'number' },
        { name: 'allowances', label: 'Allowances', type: 'number' },
        { name: 'deductions', label: 'Deductions', type: 'number' },
        { name: 'effective_from', label: 'Effective from', type: 'date' },
      ]}
      onCreate={(values) =>
        create.mutateAsync({
          user_id: values.user_id as string,
          basic_salary: Number(values.basic_salary),
          allowances: values.allowances ? Number(values.allowances) : undefined,
          deductions: values.deductions ? Number(values.deductions) : undefined,
          effective_from: values.effective_from as string,
        })
      }
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New salary record"
    />
  )
}

const runSchema = z.object({
  month: z.string().min(1, 'Required'),
  year: z.string().min(1, 'Required'),
})

function CreateRunDialog() {
  const [open, setOpen] = useQuickAddTrigger('payroll-run')
  const create = useCreatePayrollRun()
  const form = useForm({
    resolver: zodResolver(runSchema),
    defaultValues: { month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) },
  })

  function onSubmit(values: z.infer<typeof runSchema>) {
    create.mutate(
      { month: Number(values.month), year: Number(values.year) },
      {
        onSuccess: () => {
          toast.success('Payroll run created')
          setOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not create payroll run')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New payroll run</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create payroll run</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month (1-12)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={12} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="col-span-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function PayrollRunsTab() {
  const { data: runs, isLoading } = usePayrollRuns()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payroll runs</CardTitle>
        <CreateRunDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payslips</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && runs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No payroll runs yet.
                </TableCell>
              </TableRow>
            )}
            {runs?.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  <Link to={`/app/payroll-runs/${run.id}`} className="hover:underline">
                    {MONTHS[run.month - 1]} {run.year}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                </TableCell>
                <TableCell>{run.payslips_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Staff salaries and monthly payroll runs.</p>
      </div>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="salaries">Salaries</TabsTrigger>
        </TabsList>
        <TabsContent value="runs" className="mt-4">
          <PayrollRunsTab />
        </TabsContent>
        <TabsContent value="salaries" className="mt-4">
          <SalariesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
