export type AnnouncementAudience = 'school' | 'class' | 'role'

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  school_class_id: string | null
  school_class_name: string | null
  role: string | null
  created_by: string | null
  created_by_name: string | null
  published_at: string | null
  created_at: string
}
