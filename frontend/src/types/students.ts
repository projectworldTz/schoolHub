export interface Guardian {
  id: string
  name: string
  phone: string | null
  email: string | null
  occupation: string | null
  address: string | null
  has_portal_access?: boolean
  relationship?: string
  is_primary?: boolean
  is_emergency_contact?: boolean
}

export interface StudentEnrollment {
  id: string
  academic_year_id: string
  academic_year_name?: string
  school_class_id: string
  school_class_name?: string
  branch_name?: string | null
  stream_id: string | null
  stream_name: string | null
  status: string
  enrolled_at: string
}

export interface StudentDocument {
  id: string
  name: string
  mime_type: string | null
  size: number | null
  uploaded_by: string | null
  uploader_name?: string
  created_at: string
}

export interface Student {
  id: string
  admission_number: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  photo_path: string | null
  blood_group: string | null
  allergies: string | null
  medical_notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  previous_school_name: string | null
  qr_code: string
  status: 'active' | 'graduated' | 'transferred' | 'withdrawn'
  guardians?: Guardian[]
  current_enrollment?: StudentEnrollment
  documents?: StudentDocument[]
  created_at: string
}

export interface StudentImportRow {
  row: number
  admission_number: string
  name: string
  status: 'created' | 'would_create' | 'error'
  errors: string[]
  warnings: string[]
  student_id?: string
}

export interface StudentImportResult {
  total_rows: number
  created_count: number
  error_count: number
  committed: boolean
  missing_headers: string[]
  rows: StudentImportRow[]
}
