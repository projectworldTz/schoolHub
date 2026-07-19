import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useExpenseCategories, useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import type { ExpenseCategoryPayload, ExpensePayload } from '@/api/expenses'
import type { BudgetPayload } from '@/api/budgets'
import type { Expense, ExpenseCategory } from '@/types/expenses'
import type { Budget } from '@/types/budgets'

const categoryDefaults = { name: '' }
const categorySchema = z.object({ name: z.string().min(1, 'Required') })

function CategoriesTab() {
  const { data, isLoading } = useExpenseCategories.useList()
  const create = useExpenseCategories.useCreate()
  const remove = useExpenseCategories.useRemove()
  const form = useForm({ resolver: zodResolver(categorySchema), defaultValues: categoryDefaults })

  const columns: ColumnDef<ExpenseCategory>[] = [{ key: 'name', label: 'Name', render: (c) => c.name }]

  return (
    <SimpleCrudCard
      title="Expense categories"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={categoryDefaults}
      fields={[{ name: 'name', label: 'Name', type: 'text' }]}
      onCreate={(values) => create.mutateAsync(values as ExpenseCategoryPayload)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New category"
    />
  )
}

const expenseDefaults = { expense_category_id: '', amount: '', description: '', expense_date: '' }
const expenseSchema = z.object({
  expense_category_id: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required'),
  description: z.string().optional(),
  expense_date: z.string().min(1, 'Required'),
})

function ExpensesTab() {
  const { data, isLoading } = useExpenses.useList()
  const { data: categories } = useExpenseCategories.useList()
  const create = useExpenses.useCreate()
  const remove = useExpenses.useRemove()
  const form = useForm({ resolver: zodResolver(expenseSchema), defaultValues: expenseDefaults })

  const columns: ColumnDef<Expense>[] = [
    { key: 'date', label: 'Date', render: (e) => e.expense_date },
    { key: 'category', label: 'Category', render: (e) => e.category_name ?? '—' },
    { key: 'amount', label: 'Amount', render: (e) => Number(e.amount).toLocaleString() },
    { key: 'description', label: 'Description', render: (e) => e.description ?? '—' },
    { key: 'recorded', label: 'Recorded by', render: (e) => e.recorded_by_name ?? '—' },
  ]

  return (
    <SimpleCrudCard
      title="Expenses"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={expenseDefaults}
      fields={[
        {
          name: 'expense_category_id',
          label: 'Category',
          type: 'select',
          options: categories?.map((c) => ({ value: c.id, label: c.name })) ?? [],
        },
        { name: 'amount', label: 'Amount', type: 'number' },
        { name: 'expense_date', label: 'Date', type: 'date' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      onCreate={(values) => create.mutateAsync({ ...values, amount: Number(values.amount) } as unknown as ExpensePayload)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New expense"
    />
  )
}

const budgetDefaults = { expense_category_id: '', academic_year_id: '', amount: '', notes: '' }
const budgetSchema = z.object({
  expense_category_id: z.string().min(1, 'Required'),
  academic_year_id: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})

function BudgetsTab() {
  const { data, isLoading } = useBudgets.useList()
  const { data: categories } = useExpenseCategories.useList()
  const { data: years } = useAcademicYears.useList()
  const create = useBudgets.useCreate()
  const remove = useBudgets.useRemove()
  const form = useForm({ resolver: zodResolver(budgetSchema), defaultValues: budgetDefaults })

  const columns: ColumnDef<Budget>[] = [
    { key: 'category', label: 'Category', render: (b) => b.category_name ?? '—' },
    { key: 'year', label: 'Academic year', render: (b) => b.academic_year_name ?? '—' },
    { key: 'amount', label: 'Budgeted amount', render: (b) => Number(b.amount).toLocaleString() },
    { key: 'notes', label: 'Notes', render: (b) => b.notes ?? '—' },
  ]

  return (
    <SimpleCrudCard
      title="Budgets"
      description="One budgeted amount per category, per academic year — compared against actual spend in Analytics › Finance."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={budgetDefaults}
      fields={[
        {
          name: 'expense_category_id',
          label: 'Category',
          type: 'select',
          options: categories?.map((c) => ({ value: c.id, label: c.name })) ?? [],
        },
        {
          name: 'academic_year_id',
          label: 'Academic year',
          type: 'select',
          options: years?.map((y) => ({ value: y.id, label: y.name })) ?? [],
        },
        { name: 'amount', label: 'Budgeted amount', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      onCreate={(values) => create.mutateAsync({ ...values, amount: Number(values.amount) } as unknown as BudgetPayload)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New budget line"
      quickAddKey="budget"
    />
  )
}

export function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <p className="text-sm text-muted-foreground">Track school spending by category.</p>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="budgets" className="mt-4">
          <BudgetsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
