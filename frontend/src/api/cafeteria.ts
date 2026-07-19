import { createCrudApi } from '@/api/crud'
import type { CafeteriaMenu } from '@/types/cafeteria'

export interface CafeteriaMenuPayload {
  menu_date: string
  meal_type: string
  description: string
}

export const cafeteriaMenusApi = createCrudApi<CafeteriaMenu, CafeteriaMenuPayload>('cafeteria-menus')
