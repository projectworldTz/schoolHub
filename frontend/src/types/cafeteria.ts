export type CafeteriaMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface CafeteriaMenu {
  id: string
  menu_date: string
  meal_type: CafeteriaMealType
  description: string
}
