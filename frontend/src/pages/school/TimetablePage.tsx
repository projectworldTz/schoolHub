import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
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
import { useTimetablePeriods, useTimetableEntries, useCreateTimetableEntry, useDeleteTimetableEntry, useUpdateTimetableEntry } from '@/hooks/useTimetable'
import { useAcademicYears, useSchoolProfile } from '@/hooks/useSchoolSetup'
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
  is_break: z.boolean().default(false),
})

const periodDefaults = { name: '', start_time: '', end_time: '', sort_order: '', is_break: false }

function PeriodsTab() {
  const { data: periods, isLoading } = useTimetablePeriods.useList()
  const create = useTimetablePeriods.useCreate()
  const update = useTimetablePeriods.useUpdate()
  const remove = useTimetablePeriods.useRemove()
  const form = useForm({
    resolver: zodResolver(periodSchema),
    defaultValues: periodDefaults,
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
        { key: 'type', label: 'Type', render: (p) => (p.is_break ? 'Break / lunch' : 'Teaching period') },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Period 1' },
        { name: 'start_time', label: 'Start time', type: 'text', placeholder: '07:30' },
        { name: 'end_time', label: 'End time', type: 'text', placeholder: '08:10' },
        { name: 'sort_order', label: 'Sort order', type: 'number', placeholder: '1' },
        { name: 'is_break', label: 'Break / lunch period', type: 'switch' },
      ]}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={periodDefaults}
      onCreate={(values) =>
        create.mutateAsync({
          name: values.name as string,
          start_time: values.start_time as string,
          end_time: values.end_time as string,
          sort_order: values.sort_order ? Number(values.sort_order) : undefined,
          is_break: Boolean(values.is_break),
        })
      }
      onEdit={(period, values) => update.mutateAsync({
        id: period.id,
        payload: {
          name: values.name as string,
          start_time: values.start_time as string,
          end_time: values.end_time as string,
          sort_order: values.sort_order ? Number(values.sort_order) : undefined,
          is_break: Boolean(values.is_break),
        },
      })}
      toFormValues={(period) => ({
        name: period.name,
        start_time: period.start_time,
        end_time: period.end_time,
        sort_order: String(period.sort_order),
        is_break: period.is_break,
      })}
      onDelete={(p) => remove.mutateAsync(p.id)}
      createLabel="New period"
      editLabel="Edit period"
    />
  )
}

const entrySchema = z.object({
  subject_id: z.string().min(1, 'Required'),
  teacher_id: z.string().min(1, 'Required'),
  room_id: z.string().optional(),
})

function LessonDialog({
  open,
  onOpenChange,
  schoolClassId,
  academicYearId,
  dayOfWeek,
  periodId,
  entry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolClassId: string
  academicYearId: string
  dayOfWeek: DayOfWeek | null
  periodId: string | null
  entry?: TimetableEntry
}) {
  const { data: subjects } = useSubjects.useList()
  const { data: staff } = useStaffList()
  const { data: rooms } = useRooms.useList()
  const create = useCreateTimetableEntry()
  const update = useUpdateTimetableEntry()
  const form = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: { subject_id: '', teacher_id: '', room_id: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        subject_id: entry?.subject_id ?? '',
        teacher_id: entry?.teacher_id ?? '',
        room_id: entry?.room_id ?? '',
      })
    }
  }, [open, entry, form])

  function onSubmit(values: z.infer<typeof entrySchema>) {
    if (!dayOfWeek || !periodId) return
    const payload = {
      school_class_id: schoolClassId,
      academic_year_id: academicYearId,
      timetable_period_id: periodId,
      day_of_week: dayOfWeek,
      subject_id: values.subject_id,
      teacher_id: values.teacher_id,
      room_id: values.room_id || undefined,
    }
    const options = {
      onSuccess: () => {
        toast.success(entry ? 'Lesson updated' : 'Lesson added')
        onOpenChange(false)
      },
      onError: (error: unknown) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? `Could not ${entry ? 'update' : 'add'} lesson`)
          : 'Something went wrong'
        toast.error(message)
      },
    }

    if (entry) {
      update.mutate({ id: entry.id, payload }, options)
    } else {
      create.mutate(payload, options)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit lesson' : 'Add lesson'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Combobox
                      options={subjects?.map((subject) => ({ value: subject.id, label: subject.name, sublabel: subject.code ?? undefined })) ?? []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select subject"
                      searchPlaceholder="Search subjects…"
                      emptyText="No subject found."
                    />
                  </FormControl>
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
                  <FormControl>
                    <Combobox
                      options={staff?.data
                        .filter((person): person is typeof person & { user_id: string } => Boolean(person.user_id))
                        .map((person) => ({ value: person.user_id, label: person.name ?? 'Unnamed teacher', sublabel: person.job_title ?? undefined })) ?? []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select teacher"
                      searchPlaceholder="Search teachers…"
                      emptyText="No teacher found."
                    />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {create.isPending || update.isPending ? 'Saving…' : entry ? 'Save changes' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type PrimarySection = 'lower' | 'upper'

function primarySectionFor(className: string): PrimarySection {
  const primaryNumber = className.match(/(?:standard|std|grade|class)\s*(\d+)/i)
  return primaryNumber && Number(primaryNumber[1]) >= 5 ? 'upper' : 'lower'
}

function ClassTimetableTab({ section }: { section?: PrimarySection }) {
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const { data: streams } = useStreams.useList()
  const { data: periods } = useTimetablePeriods.useList()
  const [academicYearId, setAcademicYearId] = useState('')
  const [schoolClassId, setSchoolClassId] = useState('')
  const [dialogTarget, setDialogTarget] = useState<{ day: DayOfWeek; periodId: string } | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
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

  const availableClasses = section ? classes?.filter((c) => primarySectionFor(c.name) === section) : classes
  const classStreams = streams?.filter((s) => s.school_class_id === schoolClassId)

  useEffect(() => {
    if (schoolClassId && availableClasses && !availableClasses.some((schoolClass) => schoolClass.id === schoolClassId)) {
      setSchoolClassId('')
    }
  }, [availableClasses, schoolClassId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section ? `${section === 'lower' ? 'Lower' : 'Upper'} classes timetable` : 'Class timetable'}</CardTitle>
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
                {availableClasses?.map((c) => (
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
                {periods.map((period) => (
                  <tr key={period.id}>
                    {period.is_break ? (
                      <td
                        colSpan={DAYS.length + 1}
                        className="border bg-amber-50 p-3 text-center dark:bg-amber-950/30"
                      >
                        <div className="font-semibold text-amber-900 dark:text-amber-100">{period.name}</div>
                        <div className="text-xs text-amber-700 dark:text-amber-300">
                          {period.start_time}–{period.end_time} · No lessons scheduled during this time
                        </div>
                      </td>
                    ) : (
                      <>
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
                                <div className="absolute right-1 top-1 flex opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-5"
                                    aria-label="Edit lesson"
                                    onClick={() => setEditingEntry(entry)}
                                  >
                                    <Pencil className="size-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-5"
                                    aria-label="Delete lesson"
                                    onClick={() => remove.mutate(entry.id)}
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
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
                      </>
                    )}
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
      <LessonDialog
        open={dialogTarget !== null || editingEntry !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogTarget(null)
            setEditingEntry(null)
          }
        }}
        schoolClassId={schoolClassId}
        academicYearId={academicYearId}
        dayOfWeek={dialogTarget?.day ?? editingEntry?.day_of_week ?? null}
        periodId={dialogTarget?.periodId ?? editingEntry?.timetable_period_id ?? null}
        entry={editingEntry ?? undefined}
      />
    </Card>
  )
}

export function TimetablePage() {
  const { data: school } = useSchoolProfile()
  const isPrimary = school?.type === 'primary'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Timetable</h1>
        <p className="text-sm text-muted-foreground">Periods and the weekly class schedule.</p>
      </div>

      <Tabs defaultValue={isPrimary ? 'lower-timetable' : 'timetable'} key={isPrimary ? 'primary' : 'other'}>
        <TabsList>
          {isPrimary ? (
            <>
              <TabsTrigger value="lower-timetable">Lower classes</TabsTrigger>
              <TabsTrigger value="upper-timetable">Upper classes</TabsTrigger>
            </>
          ) : (
            <TabsTrigger value="timetable">Class timetable</TabsTrigger>
          )}
          <TabsTrigger value="periods">Periods</TabsTrigger>
        </TabsList>
        {isPrimary ? (
          <>
            <TabsContent value="lower-timetable" className="mt-4">
              <ClassTimetableTab section="lower" />
            </TabsContent>
            <TabsContent value="upper-timetable" className="mt-4">
              <ClassTimetableTab section="upper" />
            </TabsContent>
          </>
        ) : (
          <TabsContent value="timetable" className="mt-4">
            <ClassTimetableTab />
          </TabsContent>
        )}
        <TabsContent value="periods" className="mt-4">
          <PeriodsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
