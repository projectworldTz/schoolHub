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
  const { useList, useCreate, useRemove } = useSubjects
  const { data, isLoading } = useList()
  const create = useCreate()
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
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New subject"
      quickAddKey="subject"
    />
  )
}

const gradingSystemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  is_default: z.boolean().default(false),
  grade_bands: z
    .array(
      z.object({
        label: z.string().min(1, 'Required'),
        min_score: z.coerce.number().int().min(0).max(100),
        max_score: z.coerce.number().int().min(0).max(100),
        remark: z.string().optional(),
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
      grade_bands: [{ label: 'A', min_score: 80, max_score: 100, remark: 'Excellent' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'grade_bands' })

  function onSubmit(values: z.infer<typeof gradingSystemSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Grading system created')
        form.reset({ name: '', is_default: false, grade_bands: [{ label: 'A', min_score: 80, max_score: 100, remark: 'Excellent' }] })
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
                onClick={() => append({ label: '', min_score: 0, max_score: 0, remark: '' })}
              >
                <Plus className="size-4" /> Add band
              </Button>
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
