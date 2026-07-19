import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { Badge } from '@/components/ui/badge'
import { useStudents } from '@/hooks/useStudents'
import { useDisciplineIncidents } from '@/hooks/useDiscipline'
import type { DisciplineIncidentPayload } from '@/api/discipline'
import type { DisciplineIncident, DisciplineSeverity } from '@/types/discipline'

const incidentDefaults = {
  student_id: '',
  incident_date: '',
  category: '',
  severity: 'minor' as const,
  description: '',
  action_taken: '',
}
const incidentSchema = z.object({
  student_id: z.string().min(1, 'Required'),
  incident_date: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  severity: z.enum(['minor', 'moderate', 'major']),
  description: z.string().min(1, 'Required'),
  action_taken: z.string().optional(),
})

const SEVERITY_VARIANT: Record<DisciplineSeverity, 'outline' | 'secondary' | 'destructive'> = {
  minor: 'outline',
  moderate: 'secondary',
  major: 'destructive',
}

export function DisciplinePage() {
  const { data, isLoading } = useDisciplineIncidents.useList()
  const { data: students } = useStudents('')
  const create = useDisciplineIncidents.useCreate()
  const remove = useDisciplineIncidents.useRemove()
  const form = useForm({ resolver: zodResolver(incidentSchema), defaultValues: incidentDefaults })

  const columns: ColumnDef<DisciplineIncident>[] = [
    { key: 'date', label: 'Date', render: (v) => v.incident_date },
    { key: 'student', label: 'Student', render: (v) => v.student_name ?? '—' },
    { key: 'category', label: 'Category', render: (v) => v.category },
    {
      key: 'severity',
      label: 'Severity',
      render: (v) => <Badge variant={SEVERITY_VARIANT[v.severity]}>{v.severity}</Badge>,
    },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v.status === 'resolved' ? 'outline' : 'default'}>{v.status}</Badge> },
    { key: 'reported', label: 'Reported by', render: (v) => v.reported_by_name ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Discipline</h1>
        <p className="text-sm text-muted-foreground">Student incident records.</p>
      </div>

      <SimpleCrudCard
        title="Incidents"
        items={data}
        isLoading={isLoading}
        columns={columns}
        form={form as unknown as UseFormReturn<FieldValues>}
        defaultValues={incidentDefaults}
        fields={[
          {
            name: 'student_id',
            label: 'Student',
            type: 'select',
            options: students?.data.map((s) => ({ value: s.id, label: s.full_name })) ?? [],
          },
          { name: 'incident_date', label: 'Incident date', type: 'date' },
          { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Fighting, Cheating, Tardiness' },
          {
            name: 'severity',
            label: 'Severity',
            type: 'select',
            options: [
              { value: 'minor', label: 'Minor' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'major', label: 'Major' },
            ],
          },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'action_taken', label: 'Action taken', type: 'textarea' },
        ]}
        onCreate={(values) => create.mutateAsync(values as unknown as DisciplineIncidentPayload)}
        onDelete={(item) => remove.mutateAsync(item.id)}
        createLabel="New incident"
        quickAddKey="discipline-incident"
      />
    </div>
  )
}
