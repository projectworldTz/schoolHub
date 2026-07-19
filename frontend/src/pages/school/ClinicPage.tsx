import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useStudents } from '@/hooks/useStudents'
import { useClinicVisits } from '@/hooks/useClinic'
import type { ClinicVisitPayload } from '@/api/clinic'
import type { ClinicVisit } from '@/types/clinic'

const visitDefaults = {
  student_id: '',
  visit_date: '',
  reason: '',
  diagnosis: '',
  treatment: '',
  follow_up_date: '',
}
const visitSchema = z.object({
  student_id: z.string().min(1, 'Required'),
  visit_date: z.string().min(1, 'Required'),
  reason: z.string().min(1, 'Required'),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  follow_up_date: z.string().optional(),
})

export function ClinicPage() {
  const { data, isLoading } = useClinicVisits.useList()
  const { data: students } = useStudents('')
  const create = useClinicVisits.useCreate()
  const remove = useClinicVisits.useRemove()
  const form = useForm({ resolver: zodResolver(visitSchema), defaultValues: visitDefaults })

  const columns: ColumnDef<ClinicVisit>[] = [
    { key: 'date', label: 'Date', render: (v) => v.visit_date },
    { key: 'student', label: 'Student', render: (v) => v.student_name ?? '—' },
    { key: 'reason', label: 'Reason', render: (v) => v.reason },
    { key: 'diagnosis', label: 'Diagnosis', render: (v) => v.diagnosis ?? '—' },
    { key: 'treatment', label: 'Treatment', render: (v) => v.treatment ?? '—' },
    { key: 'recorded', label: 'Recorded by', render: (v) => v.recorded_by_name ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">School Clinic</h1>
        <p className="text-sm text-muted-foreground">Student health visits and records.</p>
      </div>

      <SimpleCrudCard
        title="Visits"
        items={data}
        isLoading={isLoading}
        columns={columns}
        form={form as unknown as UseFormReturn<FieldValues>}
        defaultValues={visitDefaults}
        fields={[
          {
            name: 'student_id',
            label: 'Student',
            type: 'select',
            options: students?.data.map((s) => ({ value: s.id, label: s.full_name })) ?? [],
          },
          { name: 'visit_date', label: 'Visit date', type: 'date' },
          { name: 'reason', label: 'Reason', type: 'textarea' },
          { name: 'diagnosis', label: 'Diagnosis', type: 'textarea' },
          { name: 'treatment', label: 'Treatment', type: 'textarea' },
          { name: 'follow_up_date', label: 'Follow-up date', type: 'date' },
        ]}
        onCreate={(values) => create.mutateAsync(values as unknown as ClinicVisitPayload)}
        onDelete={(item) => remove.mutateAsync(item.id)}
        createLabel="New visit"
        quickAddKey="clinic-visit"
      />
    </div>
  )
}
