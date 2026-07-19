import { createCrudApi } from '@/api/crud'
import type { Announcement } from '@/types/communication'

export interface AnnouncementPayload {
  title: string
  body: string
  audience: string
  school_class_id?: string
  role?: string
  published_at?: string
}

export const announcementsApi = createCrudApi<Announcement, AnnouncementPayload>('announcements')
