import { apiClient } from '@/api/client'
import type { PromotionCommitPayload, PromotionPreview, PromotionResult, StudentPromotionRecord } from '@/types/promotions'

export interface PromotionPreviewParams {
  from_academic_year_id?: string
  to_academic_year_id?: string
}

export async function fetchPromotionPreview(params: PromotionPreviewParams): Promise<PromotionPreview> {
  const { data } = await apiClient.get<{ data: PromotionPreview }>('/school/promotions/preview', { params })
  return data.data
}

export async function commitPromotion(payload: PromotionCommitPayload): Promise<PromotionResult> {
  const { data } = await apiClient.post<{ data: PromotionResult }>('/school/promotions', payload)
  return data.data
}

export async function fetchPromotionHistory(): Promise<StudentPromotionRecord[]> {
  const { data } = await apiClient.get<{ data: StudentPromotionRecord[] }>('/school/promotions/history')
  return data.data
}
