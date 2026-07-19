export interface Branch {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  is_main: boolean
  created_at: string
}

export interface Department {
  id: string
  name: string
  code: string | null
  head_user_id: string | null
  head_name: string | null
  created_at: string
}

export interface Term {
  id: string
  academic_year_id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

export interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  terms?: Term[]
  created_at: string
}

export interface Holiday {
  id: string
  academic_year_id: string | null
  name: string
  start_date: string
  end_date: string
  description: string | null
}
