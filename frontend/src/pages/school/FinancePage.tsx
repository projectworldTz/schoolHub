import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Checkbox } from '@/components/ui/checkbox'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useFeeCategories, useFeeStructures, useGenerateInvoices, useInvoices } from '@/hooks/useFinance'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useClasses } from '@/hooks/useAcademics'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import type { FeeCategoryPayload, FeeStructurePayload } from '@/api/finance'
import type { FeeCategory, FeeStructure, InvoiceStatus } from '@/types/finance'

const STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  unpaid: 'secondary',
  partial: 'outline',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'secondary',
}

const feeCategoryDefaults = { name: '', description: '' }
const feeCategorySchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
})

function FeeCategoriesCard() {
  const { data, isLoading } = useFeeCategories.useList()
  const create = useFeeCategories.useCreate()
  const remove = useFeeCategories.useRemove()
  const form = useForm({ resolver: zodResolver(feeCategorySchema), defaultValues: feeCategoryDefaults })

  const columns: ColumnDef<FeeCategory>[] = [
    { key: 'name', label: 'Name', render: (c) => c.name },
    { key: 'description', label: 'Description', render: (c) => c.description ?? '—' },
  ]

  return (
    <SimpleCrudCard
      title="Fee categories"
      description="Types of fees this school charges (Tuition, Transport, Boarding…)."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={feeCategoryDefaults}
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      onCreate={(values) => create.mutateAsync(values as FeeCategoryPayload)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New category"
    />
  )
}

const feeStructureDefaults = {
  academic_year_id: '',
  school_class_id: '',
  fee_category_id: '',
  amount: '',
  due_date: '',
}
const feeStructureSchema = z.object({
  academic_year_id: z.string().min(1, 'Required'),
  school_class_id: z.string().optional(),
  fee_category_id: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required'),
  due_date: z.string().optional(),
})

function FeeStructuresCard() {
  const { data, isLoading } = useFeeStructures.useList()
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const { data: categories } = useFeeCategories.useList()
  const create = useFeeStructures.useCreate()
  const remove = useFeeStructures.useRemove()
  const form = useForm({ resolver: zodResolver(feeStructureSchema), defaultValues: feeStructureDefaults })

  const columns: ColumnDef<FeeStructure>[] = [
    { key: 'category', label: 'Category', render: (s) => s.fee_category_name ?? '—' },
    { key: 'class', label: 'Class', render: (s) => s.school_class_name ?? 'All classes' },
    { key: 'year', label: 'Academic year', render: (s) => s.academic_year_name ?? '—' },
    { key: 'amount', label: 'Amount', render: (s) => Number(s.amount).toLocaleString() },
    { key: 'due', label: 'Due date', render: (s) => s.due_date ?? '—' },
  ]

  return (
    <SimpleCrudCard
      title="Fee structures"
      description="Amounts due per class/category for an academic year — used to generate invoices."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={feeStructureDefaults}
      fields={[
        {
          name: 'academic_year_id',
          label: 'Academic year',
          type: 'select',
          options: academicYears?.map((y) => ({ value: y.id, label: y.name })) ?? [],
        },
        {
          name: 'school_class_id',
          label: 'Class (leave blank for all)',
          type: 'select',
          options: classes?.map((c) => ({ value: c.id, label: c.name })) ?? [],
        },
        {
          name: 'fee_category_id',
          label: 'Category',
          type: 'select',
          options: categories?.map((c) => ({ value: c.id, label: c.name })) ?? [],
        },
        { name: 'amount', label: 'Amount', type: 'number' },
        { name: 'due_date', label: 'Due date', type: 'date' },
      ]}
      onCreate={(values) => create.mutateAsync({ ...values, amount: Number(values.amount) } as unknown as FeeStructurePayload)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New fee structure"
    />
  )
}

function FeeSetupTab() {
  return (
    <div className="space-y-6">
      <FeeCategoriesCard />
      <FeeStructuresCard />
    </div>
  )
}

const generateSchema = z.object({
  academic_year_id: z.string().min(1, 'Required'),
  school_class_id: z.string().min(1, 'Required'),
  due_date: z.string().optional(),
  fee_structure_ids: z.array(z.string()).min(1, 'Select at least one fee'),
})

function GenerateInvoicesDialog() {
  const [open, setOpen] = useQuickAddTrigger('invoice')
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const { data: structures } = useFeeStructures.useList()
  const generate = useGenerateInvoices()
  const form = useForm({
    resolver: zodResolver(generateSchema),
    defaultValues: { academic_year_id: '', school_class_id: '', due_date: '', fee_structure_ids: [] as string[] },
  })
  const selectedYear = form.watch('academic_year_id')
  const selectedClass = form.watch('school_class_id')
  const selectedIds = form.watch('fee_structure_ids')

  const applicable = structures?.filter(
    (s) =>
      s.academic_year_id === selectedYear &&
      (!s.school_class_id || s.school_class_id === selectedClass)
  )

  function onSubmit(values: z.infer<typeof generateSchema>) {
    generate.mutate(
      {
        academic_year_id: values.academic_year_id,
        school_class_id: values.school_class_id,
        due_date: values.due_date || undefined,
        fee_structure_ids: values.fee_structure_ids,
      },
      {
        onSuccess: (invoices) => {
          toast.success(`${invoices.length} invoice(s) generated`)
          form.reset()
          setOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not generate invoices')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Generate invoices</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate invoices for a class</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academic_year_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic year</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('fee_structure_ids', [])
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears?.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school_class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('fee_structure_ids', [])
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fee_structure_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Fees to include</FormLabel>
                  <div className="space-y-2 rounded-md border p-3">
                    {(!selectedYear || !selectedClass) && (
                      <p className="text-xs text-muted-foreground">Choose an academic year and class first.</p>
                    )}
                    {selectedYear && selectedClass && applicable?.length === 0 && (
                      <p className="text-xs text-muted-foreground">No fee structures match this year/class.</p>
                    )}
                    {applicable?.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedIds.includes(s.id)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...selectedIds, s.id]
                              : selectedIds.filter((id) => id !== s.id)
                            form.setValue('fee_structure_ids', next)
                          }}
                        />
                        {s.fee_category_name} — {Number(s.amount).toLocaleString()}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={generate.isPending}>
                {generate.isPending ? 'Generating…' : 'Generate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function InvoicesTab() {
  const [status, setStatus] = useState('')
  const { data, isLoading } = useInvoices({ status: status || undefined })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="mt-2 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </CardDescription>
        </div>
        <GenerateInvoicesDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No invoices yet.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  <Link to={`/app/invoices/${invoice.id}`} className="hover:underline">
                    {invoice.invoice_number}
                  </Link>
                </TableCell>
                <TableCell>{invoice.student_name}</TableCell>
                <TableCell>{Number(invoice.total_amount).toLocaleString()}</TableCell>
                <TableCell>{Number(invoice.amount_paid).toLocaleString()}</TableCell>
                <TableCell>{Number(invoice.balance).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="text-sm text-muted-foreground">Fee setup, billing, and payments.</p>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="setup">Fee Setup</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="setup" className="mt-4">
          <FeeSetupTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
