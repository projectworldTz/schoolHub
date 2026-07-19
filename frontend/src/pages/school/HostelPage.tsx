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
import { useAllocateHostelRoom, useHostelAllocations, useHostelRooms, useVacateHostelAllocation } from '@/hooks/useHostel'
import type { HostelRoomPayload } from '@/api/hostel'
import type { HostelRoom, HostelAllocationStatus } from '@/types/hostel'

const roomDefaults = { name: '', type: 'mixed' as const, capacity: '1' }
const roomSchema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.enum(['boys', 'girls', 'mixed']),
  capacity: z.string().min(1, 'Required'),
})

function RoomsTab() {
  const { data, isLoading } = useHostelRooms.useList()
  const create = useHostelRooms.useCreate()
  const remove = useHostelRooms.useRemove()
  const form = useForm({ resolver: zodResolver(roomSchema), defaultValues: roomDefaults })

  const columns: ColumnDef<HostelRoom>[] = [
    { key: 'name', label: 'Room', render: (r) => r.name },
    { key: 'type', label: 'Type', render: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: 'occupancy', label: 'Occupancy', render: (r) => `${r.occupied ?? 0} / ${r.capacity}` },
  ]

  return (
    <SimpleCrudCard
      title="Rooms"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={roomDefaults}
      fields={[
        { name: 'name', label: 'Room name', type: 'text' },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: [
            { value: 'boys', label: 'Boys' },
            { value: 'girls', label: 'Girls' },
            { value: 'mixed', label: 'Mixed' },
          ],
        },
        { name: 'capacity', label: 'Capacity', type: 'number' },
      ]}
      onCreate={(values) =>
        create.mutateAsync({ ...values, capacity: Number(values.capacity) } as unknown as HostelRoomPayload)
      }
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New room"
      quickAddKey="hostel-room"
    />
  )
}

const allocationSchema = z.object({
  student_id: z.string().min(1, 'Required'),
  hostel_room_id: z.string().min(1, 'Required'),
  academic_year_id: z.string().min(1, 'Required'),
})

const STATUS_VARIANT: Record<HostelAllocationStatus, 'default' | 'secondary'> = {
  active: 'secondary',
  vacated: 'default',
}

function AllocateRoomDialog() {
  const [open, setOpen] = useQuickAddTrigger('hostel-allocation')
  const { data: rooms } = useHostelRooms.useList()
  const { data: students } = useStudents('')
  const { data: years } = useAcademicYears.useList()
  const allocate = useAllocateHostelRoom()
  const form = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: { student_id: '', hostel_room_id: '', academic_year_id: '' },
  })

  function onSubmit(values: z.infer<typeof allocationSchema>) {
    allocate.mutate(values, {
      onSuccess: () => {
        toast.success('Room allocated')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error) ? (error.response?.data?.message ?? 'Could not allocate room') : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Allocate room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate a hostel room</DialogTitle>
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
              name="hostel_room_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.occupied ?? 0}/{r.capacity})
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
            <DialogFooter>
              <Button type="submit" disabled={allocate.isPending}>
                {allocate.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AllocationsTab() {
  const { data: allocations, isLoading } = useHostelAllocations()
  const vacate = useVacateHostelAllocation()

  async function handleVacate(id: string) {
    try {
      await vacate.mutateAsync(id)
      toast.success('Allocation vacated')
    } catch (error) {
      const message = isAxiosError(error) ? (error.response?.data?.message ?? 'Could not vacate allocation') : 'Something went wrong'
      toast.error(message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Allocations</CardTitle>
        <AllocateRoomDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Academic year</TableHead>
              <TableHead>Allocated</TableHead>
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
            {!isLoading && allocations?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No allocations yet.
                </TableCell>
              </TableRow>
            )}
            {allocations?.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.student_name}</TableCell>
                <TableCell>{a.room_name}</TableCell>
                <TableCell>{a.academic_year_name}</TableCell>
                <TableCell>{a.allocated_at ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                </TableCell>
                <TableCell>
                  {a.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleVacate(a.id)}>
                      Vacate
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

export function HostelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hostel</h1>
        <p className="text-sm text-muted-foreground">Rooms and boarding allocations.</p>
      </div>

      <Tabs defaultValue="allocations">
        <TabsList>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>
        <TabsContent value="allocations" className="mt-4">
          <AllocationsTab />
        </TabsContent>
        <TabsContent value="rooms" className="mt-4">
          <RoomsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
