import { createCrudApi } from '@/api/crud'
import type { InventoryItem, InventoryTransaction } from '@/types/inventory'

export interface InventoryItemPayload {
  name: string
  category?: string
  unit?: string
  quantity?: number
  reorder_level?: number
}

export const inventoryItemsApi = createCrudApi<InventoryItem, InventoryItemPayload>('inventory-items')

export interface InventoryTransactionPayload {
  inventory_item_id: string
  type: string
  quantity: number
  reason?: string
  transaction_date?: string
}

export const inventoryTransactionsApi = createCrudApi<InventoryTransaction, InventoryTransactionPayload>(
  'inventory-transactions'
)
