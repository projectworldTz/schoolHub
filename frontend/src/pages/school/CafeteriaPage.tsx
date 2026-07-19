import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useCafeteriaMenus } from '@/hooks/useCafeteria'
import type { CafeteriaMenuPayload } from '@/api/cafeteria'
import type { CafeteriaMenu } from '@/types/cafeteria'

const menuDefaults = { menu_date: '', meal_type: 'lunch' as const, description: '' }
const menuSchema = z.object({
  menu_date: z.string().min(1, 'Required'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  description: z.string().min(1, 'Required'),
})

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function CafeteriaPage() {
  const { data, isLoading } = useCafeteriaMenus.useList()
  const create = useCafeteriaMenus.useCreate()
  const remove = useCafeteriaMenus.useRemove()
  const form = useForm({ resolver: zodResolver(menuSchema), defaultValues: menuDefaults })

  const columns: ColumnDef<CafeteriaMenu>[] = [
    { key: 'date', label: 'Date', render: (m) => m.menu_date },
    { key: 'meal', label: 'Meal', render: (m) => <Badge variant="outline">{MEAL_LABEL[m.meal_type]}</Badge> },
    { key: 'description', label: 'Menu', render: (m) => m.description },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cafeteria</h1>
        <p className="text-sm text-muted-foreground">Daily meal menus.</p>
      </div>

      <SimpleCrudCard
        title="Menus"
        items={data}
        isLoading={isLoading}
        columns={columns}
        form={form as unknown as UseFormReturn<FieldValues>}
        defaultValues={menuDefaults}
        fields={[
          { name: 'menu_date', label: 'Date', type: 'date' },
          {
            name: 'meal_type',
            label: 'Meal',
            type: 'select',
            options: [
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' },
              { value: 'snack', label: 'Snack' },
            ],
          },
          { name: 'description', label: 'Menu description', type: 'textarea' },
        ]}
        onCreate={(values) => create.mutateAsync(values as unknown as CafeteriaMenuPayload)}
        onDelete={(item) => remove.mutateAsync(item.id)}
        createLabel="New menu"
        quickAddKey="cafeteria-menu"
      />
    </div>
  )
}
