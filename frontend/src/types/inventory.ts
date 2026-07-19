export interface InventoryItem {
  id: string
  name: string
  category: string | null
  unit: string | null
  quantity: number
  reorder_level: number | null
  low_stock: boolean
}

export type InventoryTransactionType = 'in' | 'out'

export interface InventoryTransaction {
  id: string
  inventory_item_id: string
  item_name?: string
  type: InventoryTransactionType
  quantity: number
  reason: string | null
  recorded_by_name?: string
  transaction_date: string | null
}
