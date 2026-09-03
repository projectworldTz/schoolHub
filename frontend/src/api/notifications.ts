import { apiClient } from '@/api/client'
import type { AppNotification, NotificationList } from '@/types/notifications'

export async function listNotifications(): Promise<NotificationList> {
  const { data } = await apiClient.get<NotificationList>('/notifications')
  return data
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await apiClient.patch<AppNotification>(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all')
}
