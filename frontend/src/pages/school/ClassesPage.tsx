import { useState } from 'react'
import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useClasses, useRooms, useStreams, useSubjects, useSyncClassSubjects } from '@/hooks/useAcademics'
import { useAcademicYears, useBranches } from '@/hooks/useSchoolSetup'
import type { Room, SchoolClass, Stream } from '@/types/academics'

const classSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.coerce.number().int().min(0, 'Level is required'),
  branch_id: z.string().optional(),
})

const classDefaults = { name: '', level: 0, branch_id: '' }

const NO_BRANCH = '__none'

function ClassBranchCell({ schoolClass, branches }: { schoolClass: SchoolClass; branches: { id: string; name: string }[] }) {
  const update = useClasses.useUpdate()

  return (
    <Select
      value={schoolClass.branch_id ?? NO_BRANCH}
      onValueChange={(value) =>
        update.mutate({
          id: schoolClass.id,
          payload: { name: schoolClass.name, level: schoolClass.level, branch_id: value === NO_BRANCH ? undefined : value },
        })
      }
    >
      <SelectTrigger className="h-8 w-40">
        <SelectValue placeholder="No branch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_BRANCH}>No branch</SelectItem>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function CurriculumEditor({ schoolClass }: { schoolClass: SchoolClass }) {
  const { data: subjects } = useSubjects.useList()
  const syncSubjects = useSyncClassSubjects()
  const currentIds = new Set((schoolClass.subjects ?? []).map((s) => s.id))

  function toggle(subjectId: string, checked: boolean) {
    const next = new Set(currentIds)
    if (checked) next.add(subjectId)
    else next.delete(subjectId)

    syncSubjects.mutate(
      { classId: schoolClass.id, subjectIds: Array.from(next) },
      {
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update curriculum')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="space-y-2">
      {subjects?.map((subject) => (
        <label key={subject.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={currentIds.has(subject.id)}
            onCheckedChange={(checked) => toggle(subject.id, checked === true)}
          />
          {subject.name}
        </label>
      ))}
      {subjects?.length === 0 && (
        <p className="text-sm text-muted-foreground">No subjects yet — add some under Academics.</p>
      )}
    </div>
  )
}

function ClassesTab() {
  const { useList, useCreate, useRemove } = useClasses
  const { data, isLoading } = useList()
  const { data: branches } = useBranches.useList()
  const create = useCreate()
  const remove = useRemove()
  const [curriculumClassId, setCurriculumClassId] = useState<string | null>(null)
  const form = useForm({ resolver: zodResolver(classSchema), defaultValues: classDefaults })

  const columns: ColumnDef<SchoolClass>[] = [
    { key: 'name', label: 'Name', render: (c) => c.name },
    { key: 'level', label: 'Level', render: (c) => c.level },
    { key: 'branch', label: 'Branch', render: (c) => <ClassBranchCell schoolClass={c} branches={branches ?? []} /> },
  ]

  const selectedClass = data?.find((c) => c.id === curriculumClassId)

  return (
    <div className="space-y-6">
      <SimpleCrudCard
        title="Classes"
        description="Grade/form levels, e.g. Form 1, Form 2."
        items={data}
        isLoading={isLoading}
        columns={columns}
        form={form as unknown as UseFormReturn<FieldValues>}
        defaultValues={classDefaults}
        fields={[
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Form 1' },
          { name: 'level', label: 'Level (ordering)', type: 'number' },
          {
            name: 'branch_id',
            label: 'Branch (optional)',
            type: 'select',
            options: branches?.map((b) => ({ value: b.id, label: b.name })) ?? [],
          },
        ]}
        onCreate={(values) => create.mutateAsync(values)}
        onDelete={(item) => remove.mutateAsync(item.id)}
        createLabel="New class"
      />

      <Card>
        <CardHeader>
          <CardTitle>Curriculum</CardTitle>
          <CardDescription>Which subjects are taught at each class level.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={curriculumClassId ?? undefined} onValueChange={setCurriculumClassId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClass && <CurriculumEditor schoolClass={selectedClass} />}
        </CardContent>
      </Card>
    </div>
  )
}

const roomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.coerce.number().int().min(1).optional(),
  type: z.string().optional(),
})

const roomDefaults = { name: '', capacity: undefined, type: 'classroom' }

function RoomsTab() {
  const { useList, useCreate, useRemove } = useRooms
  const { data, isLoading } = useList()
  const create = useCreate()
  const remove = useRemove()
  const form = useForm({ resolver: zodResolver(roomSchema), defaultValues: roomDefaults })

  const columns: ColumnDef<Room>[] = [
    { key: 'name', label: 'Name', render: (r) => r.name },
    { key: 'type', label: 'Type', render: (r) => r.type },
    { key: 'capacity', label: 'Capacity', render: (r) => r.capacity ?? '—' },
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
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'type', label: 'Type', type: 'text', placeholder: 'classroom' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
      ]}
      onCreate={(values) => create.mutateAsync(values)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New room"
    />
  )
}

const streamSchema = z.object({
  school_class_id: z.string().min(1, 'Class is required'),
  academic_year_id: z.string().min(1, 'Academic year is required'),
  name: z.string().min(1, 'Name is required'),
  capacity: z.coerce.number().int().min(1).optional(),
})

const streamDefaults = { school_class_id: '', academic_year_id: '', name: '', capacity: undefined }

function StreamsTab() {
  const { useList, useCreate, useRemove } = useStreams
  const { data, isLoading } = useList()
  const { data: classes } = useClasses.useList()
  const { data: academicYears } = useAcademicYears.useList()
  const create = useCreate()
  const remove = useRemove()
  const form = useForm({ resolver: zodResolver(streamSchema), defaultValues: streamDefaults })

  const columns: ColumnDef<Stream>[] = [
    { key: 'name', label: 'Name', render: (s) => s.name },
    { key: 'capacity', label: 'Capacity', render: (s) => s.capacity ?? '—' },
    { key: 'teacher', label: 'Class Teacher', render: (s) => s.class_teacher_name ?? '—' },
    { key: 'room', label: 'Room', render: (s) => s.room_name ?? '—' },
  ]

  return (
    <SimpleCrudCard
      title="Streams"
      description="Sections within a class for the current academic year, e.g. Form 1 Blue."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={streamDefaults}
      fields={[
        {
          name: 'school_class_id',
          label: 'Class',
          type: 'select',
          options: classes?.map((c) => ({ value: c.id, label: c.name })) ?? [],
        },
        {
          name: 'academic_year_id',
          label: 'Academic year',
          type: 'select',
          options: academicYears?.map((y) => ({ value: y.id, label: y.name })) ?? [],
        },
        { name: 'name', label: 'Stream name', type: 'text', placeholder: 'Blue' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
      ]}
      onCreate={(values) => create.mutateAsync(values)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New stream"
    />
  )
}

export function ClassesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classes</h1>
        <p className="text-sm text-muted-foreground">Classes, curriculum, streams, and rooms.</p>
      </div>
      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>
        <TabsContent value="classes" className="mt-4">
          <ClassesTab />
        </TabsContent>
        <TabsContent value="streams" className="mt-4">
          <StreamsTab />
        </TabsContent>
        <TabsContent value="rooms" className="mt-4">
          <RoomsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
