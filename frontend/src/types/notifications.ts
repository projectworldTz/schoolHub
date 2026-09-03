export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  action_url: string | null
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export interface NotificationList {
  data: AppNotification[]
  meta: { unread_count: number }
}
