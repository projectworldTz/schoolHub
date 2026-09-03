import { useState } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { useGradingSystems, useSubjects } from '@/hooks/useAcademics'
import type { Subject } from '@/types/academics'

const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
})

const subjectDefaults = { name: '', code: '' }

function SubjectsTab() {
  const { useList, useCreate, useUpdate, useRemove } = useSubjects
  const { data, isLoading } = useList()
  const create = useCreate()
  const update = useUpdate()
  const remove = useRemove()
  const form = useForm({ resolver: zodResolver(subjectSchema), defaultValues: subjectDefaults })

  const columns: ColumnDef<Subject>[] = [
    { key: 'name', label: 'Name', render: (s) => s.name },
    { key: 'code', label: 'Code', render: (s) => s.code ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (s) => <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ]

  return (
    <SimpleCrudCard
      title="Subjects"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={subjectDefaults}
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'code', label: 'Code', type: 'text' },
      ]}
      onCreate={(values) => create.mutateAsync(values)}
      onEdit={(item, values) => update.mutateAsync({ id: item.id, payload: values })}
      toFormValues={(item) => ({ name: item.name, code: item.code ?? '' })}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New subject"
      editLabel="Edit subject"
      quickAddKey="subject"
    />
  )
}

const gradingSystemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  is_default: z.boolean().default(false),
  necta_enabled: z.boolean().default(false),
  points_subject_count: z.coerce.number().int().min(1).max(20).default(7),
  division_rules: z.array(z.object({
    label: z.string().min(1, 'Required'),
    min_points: z.coerce.number().int().min(0).max(200),
    max_points: z.coerce.number().int().min(0).max(200),
  })).default([]),
  assessment_weights: z.object({
    quiz: z.coerce.number().min(0).max(100),
    midterm: z.coerce.number().min(0).max(100),
    final: z.coerce.number().min(0).max(100),
    mock: z.coerce.number().min(0).max(100),
    other: z.coerce.number().min(0).max(100),
  }),
  grade_bands: z
    .array(
      z.object({
        label: z.string().min(1, 'Required'),
        min_score: z.coerce.number().int().min(0).max(100),
        max_score: z.coerce.number().int().min(0).max(100),
        remark: z.string().optional(),
        points: z.coerce.number().int().min(0).max(10).optional(),
      })
    )
    .min(1, 'Add at least one grade band'),
})

function CreateGradingSystemDialog() {
  const [open, setOpen] = useState(false)
  const create = useGradingSystems.useCreate()

  const form = useForm({
    resolver: zodResolver(gradingSystemSchema),
    defaultValues: {
      name: '',
      is_default: false,
      necta_enabled: false,
      points_subject_count: 7,
      division_rules: [],
      assessment_weights: { quiz: 10, midterm: 30, final: 60, mock: 0, other: 0 },
      grade_bands: [{ label: 'A', min_score: 80, max_score: 100, remark: 'Excellent', points: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'grade_bands' })
  const divisions = useFieldArray({ control: form.control, name: 'division_rules' })
  const nectaEnabled = form.watch('necta_enabled')

  function onSubmit(values: z.infer<typeof gradingSystemSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Grading system created')
        form.reset({ name: '', is_default: false, necta_enabled: false, points_subject_count: 7, division_rules: [], assessment_weights: { quiz: 10, midterm: 30, final: 60, mock: 0, other: 0 }, grade_bands: [{ label: 'A', min_score: 80, max_score: 100, remark: 'Excellent', points: 1 }] })
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not create grading system')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New grading system</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New grading system</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="NECTA Scale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Default grading system</FormLabel>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Grade bands</p>
              {fields.map((band, index) => (
                <div key={band.id} className="flex items-center gap-2">
                  <Input
                    placeholder="A"
                    className="w-16"
                    {...form.register(`grade_bands.${index}.label`)}
                  />
                  <Input
                    type="number"
                    placeholder="Min"
                    {...form.register(`grade_bands.${index}.min_score`)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    {...form.register(`grade_bands.${index}.max_score`)}
                  />
                  <Input
                    placeholder="Remark, e.g. Excellent"
                    className="w-40"
                    {...form.register(`grade_bands.${index}.remark`)}
                  />
                  {nectaEnabled && (
                    <Input type="number" placeholder="Points" className="w-20" {...form.register(`grade_bands.${index}.points`)} />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ label: '', min_score: 0, max_score: 0, remark: '', points: undefined })}
              >
                <Plus className="size-4" /> Add band
              </Button>
            </div>

            <FormField
              control={form.control}
              name="necta_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">Enable NECTA-style points and divisions</FormLabel>
                </FormItem>
              )}
            />
            {nectaEnabled && (
              <div className="space-y-3 rounded-md border p-3">
                <FormField control={form.control} name="points_subject_count" render={({ field }) => (
                  <FormItem><FormLabel>Best subjects counted</FormLabel><FormControl><Input type="number" min={1} max={20} {...field} value={Number(field.value)} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Division ranges</p>
                  {divisions.fields.map((rule, index) => (
                    <div key={rule.id} className="flex gap-2">
                      <Input placeholder="Division I" {...form.register(`division_rules.${index}.label`)} />
                      <Input type="number" placeholder="Min" {...form.register(`division_rules.${index}.min_points`)} />
                      <Input type="number" placeholder="Max" {...form.register(`division_rules.${index}.max_points`)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => divisions.remove(index)}><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => divisions.append({ label: '', min_points: 0, max_points: 0 })}>
                    <Plus className="size-4" /> Add division
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Continuous-assessment weights</p>
              <p className="text-xs text-muted-foreground">Set unused exam types to zero. Scores are normalized when only some components are available.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(['quiz', 'midterm', 'final', 'mock', 'other'] as const).map((type) => (
                  <label key={type} className="text-xs capitalize">{type}<Input type="number" min={0} max={100} {...form.register(`assessment_weights.${type}`)} /></label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function GradingSystemsTab() {
  const { data, isLoading } = useGradingSystems.useList()
  const remove = useGradingSystems.useRemove()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Grading Systems</CardTitle>
          <CardDescription>Score-to-grade scales used for report cards.</CardDescription>
        </div>
        <CreateGradingSystemDialog />
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No grading systems yet.</p>
        )}
        {data?.map((system) => (
          <div key={system.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">
                {system.name} {system.is_default && <Badge className="ml-2">Default</Badge>}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => remove.mutate(system.id)}
              >
                Delete
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {system.grade_bands.map((band) => (
                  <TableRow key={band.id}>
                    <TableCell>{band.label}</TableCell>
                    <TableCell>
                      {band.min_score}–{band.max_score}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{band.remark ?? '—'}</TableCell>
                    <TableCell>{band.points ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AcademicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Academics</h1>
        <p className="text-sm text-muted-foreground">Subjects and grading systems.</p>
      </div>
      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="grading">Grading Systems</TabsTrigger>
        </TabsList>
        <TabsContent value="subjects" className="mt-4">
          <SubjectsTab />
        </TabsContent>
        <TabsContent value="grading" className="mt-4">
          <GradingSystemsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
