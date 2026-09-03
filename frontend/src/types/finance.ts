export interface FeeCategory {
  id: string
  name: string
  description: string | null
  is_optional: boolean
}

export interface StudentFeeExclusion {
  id: string
  student_id: string
  fee_category_id: string
  fee_category_name?: string
  academic_year_id: string
  academic_year_name?: string
  reason: string | null
  excluded_by_name?: string
  created_at: string
}

export interface FeeStructure {
  id: string
  academic_year_id: string
  academic_year_name?: string
  term_id: string | null
  term_name?: string | null
  school_class_id: string | null
  school_class_name?: string | null
  fee_category_id: string
  fee_category_name?: string
  pay_once: boolean
  amount: string
  due_date: string | null
}

export interface InvoiceItem {
  id: string
  description: string
  amount: string
  fee_category_id?: string | null
  fee_category_name?: string | null
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'card' | 'cheque' | 'other'

export interface Payment {
  id: string
  invoice_id: string
  fee_category_id: string | null
  fee_category_name?: string | null
  amount: string
  method: PaymentMethod
  provider: string | null
  reference: string | null
  paid_at: string
  received_by_name?: string
  notes: string | null
  reversal?: { id: string; amount: string; reason: string; reversed_at: string } | null
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  invoice_number: string
  student_id: string
  student_name?: string
  admission_number?: string
  academic_year_id: string
  academic_year_name?: string
  term_id: string | null
  term_name?: string | null
  total_amount: string
  amount_paid: string
  balance: string
  status: InvoiceStatus
  due_date: string | null
  items?: InvoiceItem[]
  payments?: Payment[]
  created_at: string
}

export interface FeeImportRow {
  row: number
  admission_number: string
  student_name: string | null
  academic_year: string
  term: string | null
  fee_category: string
  amount: string
  amount_paid: string | null
  invoice_number: string | null
  status: 'created' | 'would_create' | 'skipped' | 'error'
  errors: string[]
  warnings: string[]
}

export interface FeeImportResult {
  total_rows: number
  invoice_count: number
  created_count: number
  skipped_count: number
  error_count: number
  committed: boolean
  missing_headers: string[]
  rows: FeeImportRow[]
}
