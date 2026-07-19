import { createCrudHooks } from '@/hooks/useCrud'
import { announcementsApi, type AnnouncementPayload } from '@/api/communication'
import type { Announcement } from '@/types/communication'

export const useAnnouncements = createCrudHooks<Announcement, AnnouncementPayload>('announcements', announcementsApi)
