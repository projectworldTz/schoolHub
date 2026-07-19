export interface FeeCategory {
  id: string
  name: string
  description: string | null
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
  amount: string
  due_date: string | null
}

export interface InvoiceItem {
  id: string
  description: string
  amount: string
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'card' | 'cheque' | 'other'

export interface Payment {
  id: string
  invoice_id: string
  amount: string
  method: PaymentMethod
  provider: string | null
  reference: string | null
  paid_at: string
  received_by_name?: string
  notes: string | null
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
