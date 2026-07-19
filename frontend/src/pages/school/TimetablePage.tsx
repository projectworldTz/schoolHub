import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
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
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { SimpleCrudCard } from '@/components/school/SimpleCrudCard'
import { useTimetablePeriods, useTimetableEntries, useCreateTimetableEntry, useDeleteTimetableEntry } from '@/hooks/useTimetable'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useClasses, useStreams, useSubjects, useRooms } from '@/hooks/useAcademics'
import { useStaffList } from '@/hooks/useStaff'
import type { DayOfWeek, TimetableEntry } from '@/types/timetable'

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
]

const periodSchema = z.object({
  name: z.string().min(1, 'Required'),
  start_time: z.string().min(1, 'Required'),
  end_time: z.string().min(1, 'Required'),
  sort_order: z.string().optional(),
})

function PeriodsTab() {
  const { data: periods, isLoading } = useTimetablePeriods.useList()
  const create = useTimetablePeriods.useCreate()
  const remove = useTimetablePeriods.useRemove()
  const form = useForm({
    resolver: zodResolver(periodSchema),
    defaultValues: { name: '', start_time: '', end_time: '', sort_order: '' },
  })

  return (
    <SimpleCrudCard
      title="Periods"
      description="Time slots used to build the class timetable."
      items={periods}
      isLoading={isLoading}
      columns={[
        { key: 'name', label: 'Name', render: (p) => p.name },
        { key: 'start', label: 'Start', render: (p) => p.start_time },
        { key: 'end', label: 'End', render: (p) => p.end_time },
        { key: 'order', label: 'Order', render: (p) => p.sort_order },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Period 1' },
        { name: 'start_time', label: 'Start time', type: 'text', placeholder: '07:30' },
        { name: 'end_time', label: 'End time', type: 'text', placeholder: '08:10' },
        { name: 'sort_order', label: 'Sort order', type: 'number', placeholder: '1' },
      ]}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={{ name: '', start_time: '', end_time: '', sort_order: '' }}
      onCreate={(values) =>
        create.mutateAsync({
          name: values.name as string,
          start_time: values.start_time as string,
          end_time: values.end_time as string,
          sort_order: values.sort_order ? Number(values.sort_order) : undefined,
        })
      }
      onDelete={(p) => remove.mutateAsync(p.id)}
      createLabel="New period"
    />
  )
}

const entrySchema = z.object({
  subject_id: z.string().min(1, 'Required'),
  teacher_id: z.string().min(1, 'Required'),
  room_id: z.string().optional(),
})

function AddLessonDialog({
  open,
  onOpenChange,
  schoolClassId,
  academicYearId,
  dayOfWeek,
  periodId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolClassId: string
  academicYearId: string
  dayOfWeek: DayOfWeek | null
  periodId: string | null
}) {
  const { data: subjects } = useSubjects.useList()
  const { data: staff } = useStaffList()
  const { data: rooms } = useRooms.useList()
  const create = useCreateTimetableEntry()
  const form = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: { subject_id: '', teacher_id: '', room_id: '' },
  })

  useEffect(() => {
    if (open) form.reset({ subject_id: '', teacher_id: '', room_id: '' })
  }, [open, form])

  function onSubmit(values: z.infer<typeof entrySchema>) {
    if (!dayOfWeek || !periodId) return
    create.mutate(
      {
        school_class_id: schoolClassId,
        academic_year_id: academicYearId,
        timetable_period_id: periodId,
        day_of_week: dayOfWeek,
        subject_id: values.subject_id,
        teacher_id: values.teacher_id,
        room_id: values.room_id || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Lesson added')
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not add lesson')
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
          <DialogTitle>Add lesson</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
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
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staff?.data.map((s) => (
                        <SelectItem key={s.user_id} value={s.user_id}>
                          {s.name}
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
              name="room_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room (optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms?.map((r) => (
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
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ClassTimetableTab() {
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const { data: streams } = useStreams.useList()
  const { data: periods } = useTimetablePeriods.useList()
  const [academicYearId, setAcademicYearId] = useState('')
  const [schoolClassId, setSchoolClassId] = useState('')
  const [dialogTarget, setDialogTarget] = useState<{ day: DayOfWeek; periodId: string } | null>(null)
  const remove = useDeleteTimetableEntry()

  useEffect(() => {
    if (!academicYearId && academicYears?.length) {
      setAcademicYearId(academicYears.find((y) => y.is_current)?.id ?? academicYears[0].id)
    }
  }, [academicYears, academicYearId])

  const { data: entries } = useTimetableEntries({ school_class_id: schoolClassId, academic_year_id: academicYearId })

  function entryFor(day: DayOfWeek, periodId: string): TimetableEntry | undefined {
    return entries?.find((e) => e.day_of_week === day && e.timetable_period_id === periodId)
  }

  const classStreams = streams?.filter((s) => s.school_class_id === schoolClassId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class timetable</CardTitle>
        <CardDescription>
          <div className="mt-2 flex flex-wrap gap-3">
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears?.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={schoolClassId} onValueChange={setSchoolClassId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(!schoolClassId || !academicYearId) && (
          <p className="text-sm text-muted-foreground">Choose a class and academic year to view its timetable.</p>
        )}
        {schoolClassId && academicYearId && (!periods || periods.length === 0) && (
          <p className="text-sm text-muted-foreground">Add periods in the Periods tab first.</p>
        )}
        {schoolClassId && academicYearId && periods && periods.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Period</th>
                  {DAYS.map((d) => (
                    <th key={d.value} className="border p-2 text-left">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods
                  .filter((p) => !p.is_break)
                  .map((period) => (
                    <tr key={period.id}>
                      <td className="border p-2 align-top">
                        <div className="font-medium">{period.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {period.start_time}–{period.end_time}
                        </div>
                      </td>
                      {DAYS.map((day) => {
                        const entry = entryFor(day.value, period.id)
                        return (
                          <td key={day.value} className="border p-2 align-top">
                            {entry ? (
                              <div className="group relative rounded bg-muted p-2">
                                <div className="font-medium">{entry.subject_name}</div>
                                <div className="text-xs text-muted-foreground">{entry.teacher_name}</div>
                                {entry.room_name && (
                                  <div className="text-xs text-muted-foreground">{entry.room_name}</div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1 size-5 opacity-0 group-hover:opacity-100"
                                  onClick={() => remove.mutate(entry.id)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={() => setDialogTarget({ day: day.value, periodId: period.id })}
                              >
                                <Plus className="size-4" />
                              </Button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {classStreams && classStreams.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Note: this class has streams ({classStreams.map((s) => s.name).join(', ')}); lessons added here apply to
            the whole class.
          </p>
        )}
      </CardContent>
      <AddLessonDialog
        open={dialogTarget !== null}
        onOpenChange={(open) => !open && setDialogTarget(null)}
        schoolClassId={schoolClassId}
        academicYearId={academicYearId}
        dayOfWeek={dialogTarget?.day ?? null}
        periodId={dialogTarget?.periodId ?? null}
      />
    </Card>
  )
}

export function TimetablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Timetable</h1>
        <p className="text-sm text-muted-foreground">Periods and the weekly class schedule.</p>
      </div>

      <Tabs defaultValue="timetable">
        <TabsList>
          <TabsTrigger value="timetable">Class timetable</TabsTrigger>
          <TabsTrigger value="periods">Periods</TabsTrigger>
        </TabsList>
        <TabsContent value="timetable" className="mt-4">
          <ClassTimetableTab />
        </TabsContent>
        <TabsContent value="periods" className="mt-4">
          <PeriodsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
