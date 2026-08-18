import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  commitPromotion,
  fetchPromotionHistory,
  fetchPromotionPreview,
  type PromotionPreviewParams,
} from '@/api/promotions'
import type { PromotionCommitPayload } from '@/types/promotions'

export function usePromotionPreview(params: PromotionPreviewParams) {
  return useQuery({
    queryKey: ['school', 'promotions', 'preview', params],
    queryFn: () => fetchPromotionPreview(params),
  })
}

export function usePromotionHistory() {
  return useQuery({ queryKey: ['school', 'promotions', 'history'], queryFn: fetchPromotionHistory })
}

export function useCommitPromotion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PromotionCommitPayload) => commitPromotion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'promotions'] })
      queryClient.invalidateQueries({ queryKey: ['school', 'students'] })
    },
  })
}
