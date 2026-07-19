import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { useStudents } from '@/hooks/useStudents'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import {
  useAssignTransport,
  useTransportAssignments,
  useTransportRoutes,
  useUnassignTransport,
} from '@/hooks/useTransport'
import type { TransportRoutePayload } from '@/api/transport'
import type { TransportRoute, TransportAssignmentStatus } from '@/types/transport'

const routeDefaults = { name: '', vehicle_registration: '', driver_name: '', driver_phone: '', capacity: '' }
const routeSchema = z.object({
  name: z.string().min(1, 'Required'),
  vehicle_registration: z.string().optional(),
  driver_name: z.string().optional(),
  driver_phone: z.string().optional(),
  capacity: z.string().optional(),
})

function RoutesTab() {
  const { data, isLoading } = useTransportRoutes.useList()
  const create = useTransportRoutes.useCreate()
  const remove = useTransportRoutes.useRemove()
  const form = useForm({ resolver: zodResolver(routeSchema), defaultValues: routeDefaults })

  const columns: ColumnDef<TransportRoute>[] = [
    { key: 'name', label: 'Route', render: (r) => r.name },
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle_registration ?? '—' },
    { key: 'driver', label: 'Driver', render: (r) => r.driver_name ?? '—' },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (r) => (r.capacity ? `${r.assigned ?? 0} / ${r.capacity}` : '—'),
    },
  ]

  return (
    <SimpleCrudCard
      title="Routes"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={routeDefaults}
      fields={[
        { name: 'name', label: 'Route name', type: 'text' },
        { name: 'vehicle_registration', label: 'Vehicle registration', type: 'text' },
        { name: 'driver_name', label: 'Driver name', type: 'text' },
        { name: 'driver_phone', label: 'Driver phone', type: 'text' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
      ]}
      onCreate={(values) =>
        create.mutateAsync({
          ...values,
          capacity: values.capacity ? Number(values.capacity) : undefined,
        } as unknown as TransportRoutePayload)
      }
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New route"
      quickAddKey="transport-route"
    />
  )
}

const assignmentSchema = z.object({
  student_id: z.string().min(1, 'Required'),
  transport_route_id: z.string().min(1, 'Required'),
  academic_year_id: z.string().min(1, 'Required'),
  pickup_point: z.string().optional(),
})

const STATUS_VARIANT: Record<TransportAssignmentStatus, 'default' | 'secondary'> = {
  active: 'secondary',
  inactive: 'default',
}

function AssignTransportDialog() {
  const [open, setOpen] = useQuickAddTrigger('transport-assignment')
  const { data: routes } = useTransportRoutes.useList()
  const { data: students } = useStudents('')
  const { data: years } = useAcademicYears.useList()
  const assign = useAssignTransport()
  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { student_id: '', transport_route_id: '', academic_year_id: '', pickup_point: '' },
  })

  function onSubmit(values: z.infer<typeof assignmentSchema>) {
    assign.mutate(values, {
      onSuccess: () => {
        toast.success('Student assigned to route')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error) ? (error.response?.data?.message ?? 'Could not assign route') : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Assign route</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a transport route</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.data.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
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
              name="transport_route_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a route" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {routes?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
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
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an academic year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {years?.map((y) => (
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
              name="pickup_point"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup point</FormLabel>
                  <FormControl>
                    <input
                      type="text"
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={assign.isPending}>
                {assign.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AssignmentsTab() {
  const { data: assignments, isLoading } = useTransportAssignments()
  const unassign = useUnassignTransport()

  async function handleUnassign(id: string) {
    try {
      await unassign.mutateAsync(id)
      toast.success('Assignment ended')
    } catch (error) {
      const message = isAxiosError(error) ? (error.response?.data?.message ?? 'Could not end assignment') : 'Something went wrong'
      toast.error(message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assignments</CardTitle>
        <AssignTransportDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Academic year</TableHead>
              <TableHead>Pickup point</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
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
            {!isLoading && assignments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No assignments yet.
                </TableCell>
              </TableRow>
            )}
            {assignments?.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.student_name}</TableCell>
                <TableCell>{a.route_name}</TableCell>
                <TableCell>{a.academic_year_name}</TableCell>
                <TableCell>{a.pickup_point ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                </TableCell>
                <TableCell>
                  {a.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleUnassign(a.id)}>
                      Unassign
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function TransportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transport</h1>
        <p className="text-sm text-muted-foreground">Routes and student assignments.</p>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments" className="mt-4">
          <AssignmentsTab />
        </TabsContent>
        <TabsContent value="routes" className="mt-4">
          <RoutesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
