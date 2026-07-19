import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useInventoryItems, useInventoryTransactions, useRecordInventoryTransaction } from '@/hooks/useInventory'
import type { InventoryItemPayload, InventoryTransactionPayload } from '@/api/inventory'
import type { InventoryItem, InventoryTransaction } from '@/types/inventory'

const itemDefaults = { name: '', category: '', unit: '', quantity: '0', reorder_level: '' }
const itemSchema = z.object({
  name: z.string().min(1, 'Required'),
  category: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.string().optional(),
  reorder_level: z.string().optional(),
})

function ItemsTab() {
  const { data, isLoading } = useInventoryItems.useList()
  const create = useInventoryItems.useCreate()
  const remove = useInventoryItems.useRemove()
  const form = useForm({ resolver: zodResolver(itemSchema), defaultValues: itemDefaults })

  const columns: ColumnDef<InventoryItem>[] = [
    { key: 'name', label: 'Item', render: (i) => i.name },
    { key: 'category', label: 'Category', render: (i) => i.category ?? '—' },
    { key: 'quantity', label: 'Quantity', render: (i) => `${i.quantity} ${i.unit ?? ''}`.trim() },
    {
      key: 'stock',
      label: 'Stock level',
      render: (i) => (i.low_stock ? <Badge variant="destructive">Low stock</Badge> : <Badge variant="outline">OK</Badge>),
    },
  ]

  return (
    <SimpleCrudCard
      title="Items"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={itemDefaults}
      fields={[
        { name: 'name', label: 'Item name', type: 'text' },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'unit', label: 'Unit', type: 'text', placeholder: 'ream, box, litre…' },
        { name: 'quantity', label: 'Starting quantity', type: 'number' },
        { name: 'reorder_level', label: 'Reorder level', type: 'number' },
      ]}
      onCreate={(values) =>
        create.mutateAsync({
          ...values,
          quantity: values.quantity ? Number(values.quantity) : undefined,
          reorder_level: values.reorder_level ? Number(values.reorder_level) : undefined,
        } as unknown as InventoryItemPayload)
      }
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New item"
      quickAddKey="inventory-item"
    />
  )
}

const transactionDefaults = { inventory_item_id: '', type: 'in' as const, quantity: '1', reason: '' }
const transactionSchema = z.object({
  inventory_item_id: z.string().min(1, 'Required'),
  type: z.enum(['in', 'out']),
  quantity: z.string().min(1, 'Required'),
  reason: z.string().optional(),
})

function TransactionsTab() {
  const { data, isLoading } = useInventoryTransactions()
  const { data: items } = useInventoryItems.useList()
  const record = useRecordInventoryTransaction()
  const form = useForm({ resolver: zodResolver(transactionSchema), defaultValues: transactionDefaults })

  const columns: ColumnDef<InventoryTransaction>[] = [
    { key: 'item', label: 'Item', render: (t) => t.item_name },
    {
      key: 'type',
      label: 'Type',
      render: (t) => <Badge variant={t.type === 'in' ? 'secondary' : 'outline'}>{t.type === 'in' ? 'Stock in' : 'Stock out'}</Badge>,
    },
    { key: 'quantity', label: 'Quantity', render: (t) => t.quantity },
    { key: 'reason', label: 'Reason', render: (t) => t.reason ?? '—' },
    { key: 'date', label: 'Date', render: (t) => t.transaction_date ?? '—' },
    { key: 'recorded', label: 'Recorded by', render: (t) => t.recorded_by_name ?? '—' },
  ]

  return (
    <SimpleCrudCard
      title="Transactions"
      description="Every stock movement, in or out — this ledger is append-only."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={transactionDefaults}
      fields={[
        {
          name: 'inventory_item_id',
          label: 'Item',
          type: 'select',
          options: items?.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} on hand)` })) ?? [],
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: [
            { value: 'in', label: 'Stock in' },
            { value: 'out', label: 'Stock out' },
          ],
        },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'reason', label: 'Reason', type: 'text' },
      ]}
      onCreate={(values) =>
        record.mutateAsync({ ...values, quantity: Number(values.quantity) } as unknown as InventoryTransactionPayload)
      }
      createLabel="Record transaction"
      quickAddKey="inventory-transaction"
    />
  )
}

export function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Supplies, stock levels, and movements.</p>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          <ItemsTab />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <TransactionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
