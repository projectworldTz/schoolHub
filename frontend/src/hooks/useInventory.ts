import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import { inventoryItemsApi, inventoryTransactionsApi, type InventoryItemPayload, type InventoryTransactionPayload } from '@/api/inventory'
import type { InventoryItem } from '@/types/inventory'

export const useInventoryItems = createCrudHooks<InventoryItem, InventoryItemPayload>('inventory-items', inventoryItemsApi)

const TRANSACTIONS_KEY = ['school', 'inventory-transactions'] as const

export function useInventoryTransactions() {
  return useQuery({ queryKey: TRANSACTIONS_KEY, queryFn: inventoryTransactionsApi.list })
}

export function useRecordInventoryTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InventoryTransactionPayload) => inventoryTransactionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'inventory-items'] })
    },
  })
}
