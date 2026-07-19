import { createCrudHooks } from '@/hooks/useCrud'
import { cafeteriaMenusApi, type CafeteriaMenuPayload } from '@/api/cafeteria'
import type { CafeteriaMenu } from '@/types/cafeteria'

export const useCafeteriaMenus = createCrudHooks<CafeteriaMenu, CafeteriaMenuPayload>(
  'cafeteria-menus',
  cafeteriaMenusApi
)
