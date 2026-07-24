import { Combobox } from '@/components/ui/combobox'
import type { Student } from '@/types/students'

interface StudentComboboxProps {
  students: Student[] | undefined
  value: string
  onChange: (id: string) => void
  placeholder?: string
  disabled?: boolean
}

/**
 * A searchable student picker — swap-in replacement for a plain `<Select>`
 * wherever a user has to find one student in a roster too long to scan by
 * eye (a full class or the whole school). Filters client-side over an
 * already-fetched roster, so it's a drop-in replacement everywhere
 * `useStudents('')` was already being loaded for a `<Select>` — no new
 * network round-trip per keystroke.
 */
export function StudentCombobox({ students, value, onChange, placeholder = 'Select a student', disabled }: StudentComboboxProps) {
  const options = (students ?? []).map((s) => ({ value: s.id, label: s.full_name, sublabel: s.admission_number }))

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search by name or admission #…"
      emptyText="No student found."
      disabled={disabled}
    />
  )
}
