import { useState } from 'react'
import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import {
  useAcademicYears,
  useCreateTerm,
  useDeleteTerm,
  useHolidays,
  useTerms,
} from '@/hooks/useSchoolSetup'
import type { AcademicYear, Holiday, Term } from '@/types/school-setup'

const academicYearSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  is_current: z.boolean().default(false),
})

const yearOrTermDefaults = { name: '', start_date: '', end_date: '', is_current: false }

function AcademicYearsTab() {
  const { useList, useCreate, useRemove } = useAcademicYears
  const { data: years, isLoading } = useList()
  const create = useCreate()
  const remove = useRemove()
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)

  const { data: terms, isLoading: termsLoading } = useTerms(selectedYearId)
  const createTerm = useCreateTerm(selectedYearId ?? '')
  const deleteTerm = useDeleteTerm(selectedYearId ?? '')

  const yearForm = useForm({ resolver: zodResolver(academicYearSchema), defaultValues: yearOrTermDefaults })
  const termForm = useForm({ resolver: zodResolver(academicYearSchema), defaultValues: yearOrTermDefaults })

  const columns: ColumnDef<AcademicYear>[] = [
    { key: 'name', label: 'Name', render: (y) => y.name },
    { key: 'start', label: 'Start', render: (y) => y.start_date.slice(0, 10) },
    { key: 'end', label: 'End', render: (y) => y.end_date.slice(0, 10) },
    {
      key: 'current',
      label: 'Status',
      render: (y) => (y.is_current ? <Badge>Current</Badge> : null),
    },
  ]

  const termColumns: ColumnDef<Term>[] = [
    { key: 'name', label: 'Name', render: (t) => t.name },
    { key: 'start', label: 'Start', render: (t) => t.start_date.slice(0, 10) },
    { key: 'end', label: 'End', render: (t) => t.end_date.slice(0, 10) },
    {
      key: 'current',
      label: 'Status',
      render: (t) => (t.is_current ? <Badge>Current</Badge> : null),
    },
  ]

  return (
    <div className="space-y-6">
      <SimpleCrudCard
        title="Academic Years"
        items={years}
        isLoading={isLoading}
        columns={columns}
        form={yearForm as unknown as UseFormReturn<FieldValues>}
        defaultValues={yearOrTermDefaults}
        fields={[
          { name: 'name', label: 'Name', type: 'text', placeholder: '2026/2027' },
          { name: 'start_date', label: 'Start date', type: 'date' },
          { name: 'end_date', label: 'End date', type: 'date' },
          { name: 'is_current', label: 'Current academic year', type: 'switch' },
        ]}
        onCreate={(values) => create.mutateAsync(values)}
        onDelete={(item) => remove.mutateAsync(item.id)}
        createLabel="New academic year"
      />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">Terms for:</p>
          <Select value={selectedYearId ?? undefined} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an academic year" />
            </SelectTrigger>
            <SelectContent>
              {years?.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedYearId && (
          <SimpleCrudCard
            title="Terms"
            items={terms}
            isLoading={termsLoading}
            columns={termColumns}
            form={termForm as unknown as UseFormReturn<FieldValues>}
            defaultValues={yearOrTermDefaults}
            fields={[
              { name: 'name', label: 'Name', type: 'text', placeholder: 'Term 1' },
              { name: 'start_date', label: 'Start date', type: 'date' },
              { name: 'end_date', label: 'End date', type: 'date' },
              { name: 'is_current', label: 'Current term', type: 'switch' },
            ]}
            onCreate={(values) => createTerm.mutateAsync(values)}
            onDelete={(item) => deleteTerm.mutateAsync(item.id)}
            createLabel="New term"
          />
        )}
      </div>
    </div>
  )
}

const holidaySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
})

const holidayDefaults = { name: '', start_date: '', end_date: '', description: '' }

function HolidaysTab() {
  const { useList, useCreate, useRemove } = useHolidays
  const { data, isLoading } = useList()
  const create = useCreate()
  const remove = useRemove()
  const form = useForm({ resolver: zodResolver(holidaySchema), defaultValues: holidayDefaults })

  const columns: ColumnDef<Holiday>[] = [
    { key: 'name', label: 'Name', render: (h) => h.name },
    { key: 'start', label: 'Start', render: (h) => h.start_date.slice(0, 10) },
    { key: 'end', label: 'End', render: (h) => h.end_date.slice(0, 10) },
  ]

  return (
    <SimpleCrudCard
      title="Holidays"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={holidayDefaults}
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'start_date', label: 'Start date', type: 'date' },
        { name: 'end_date', label: 'End date', type: 'date' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      onCreate={(values) => create.mutateAsync(values)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New holiday"
    />
  )
}

export function AcademicSetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Academic Setup</h1>
        <p className="text-sm text-muted-foreground">Academic years, terms, and holidays.</p>
      </div>
      <Tabs defaultValue="years">
        <TabsList>
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>
        <TabsContent value="years" className="mt-4">
          <AcademicYearsTab />
        </TabsContent>
        <TabsContent value="holidays" className="mt-4">
          <HolidaysTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
