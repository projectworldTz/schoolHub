export type WebsiteThemeKey = 'modern' | 'minimal' | 'classic' | 'international' | 'luxury' | 'children' | 'dark' | 'blue' | 'green'

export interface WebsiteTheme {
  label: string
  font_heading: string
  font_body: string
  primary_color: string
  radius: string
  shadow: string
  dark?: boolean
}

export interface WebsiteSettings {
  id: string
  theme_key: WebsiteThemeKey
  theme: WebsiteTheme | null
  primary_color: string | null
  motto: string | null
  principal_name: string | null
  principal_message: string | null
  mission: string | null
  vision: string | null
  core_values: string | null
  hero_image_path: string | null
  hero_image_url: string | null
  hero_video_path: string | null
  hero_video_url: string | null
  stats_visibility: 'publish' | 'hide' | 'summary_only'
  admission_status: 'open' | 'closed'
  admission_open_date: string | null
  admission_close_date: string | null
  admission_requirements: string | null
  facebook_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  linkedin_url: string | null
  whatsapp_number: string | null
  google_maps_embed_url: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  custom_css: string | null
  is_published: boolean
}

export type WebsiteSettingsPayload = Partial<Omit<WebsiteSettings, 'id' | 'theme' | 'hero_image_path' | 'hero_image_url' | 'hero_video_path' | 'hero_video_url'>>

export const WEBSITE_SECTION_KEYS = [
  'hero', 'about', 'stats', 'facilities', 'gallery',
  'news', 'admissions', 'calendar', 'testimonials', 'contact',
] as const

export type WebsiteSectionKey = (typeof WEBSITE_SECTION_KEYS)[number]

export interface WebsiteSection {
  id: string
  section_key: WebsiteSectionKey
  is_visible: boolean
  sort_order: number
}

export interface WebsiteFacility {
  id: string
  name: string
  description: string | null
  icon_key: string | null
  image_url: string | null
  sort_order: number
}

export interface WebsiteGalleryImage {
  id: string
  website_gallery_album_id: string
  image_url: string | null
  caption: string | null
  sort_order: number
}

export interface WebsiteGalleryAlbum {
  id: string
  name: string
  category: 'campus' | 'students' | 'laboratories' | 'sports' | 'graduation' | 'school_life'
  sort_order: number
  images_count?: number
  images?: WebsiteGalleryImage[]
}

export interface WebsiteBanner {
  id: string
  image_url: string | null
  title: string | null
  subtitle: string | null
  link_url: string | null
  is_active: boolean
  sort_order: number
}

export interface WebsiteTestimonial {
  id: string
  author_name: string
  author_role: 'parent' | 'student' | 'alumni'
  message: string
  photo_url: string | null
  is_published: boolean
  sort_order: number
}

export interface WebsiteDownload {
  id: string
  title: string
  category: 'prospectus' | 'admission_form' | 'fee_structure' | 'academic_calendar' | 'school_rules' | 'uniform_guide' | 'other'
  file_size: number
  download_count: number
  sort_order: number
}

export interface WebsiteCalendarEvent {
  id: string
  title: string
  event_type: 'academic' | 'sports_day' | 'parents_day' | 'graduation' | 'exam' | 'holiday'
  start_date: string
  end_date: string | null
  description: string | null
}

export interface WebsiteNews {
  id: string
  is_featured: boolean
  sort_order: number
  announcement: {
    id: string
    title: string
    body: string
    published_at: string | null
  }
}

export interface WebsiteAdmissionClass {
  id: string
  school_class_id: string
  class_name: string | null
  class_level: number | null
  summary: string | null
  requirements: string | null
  is_visible: boolean
  sort_order: number
}

export interface WebsiteAcademicDepartment {
  id: string
  department_id: string
  department_name: string | null
  department_code: string | null
  subjects: string[] | null
  public_description: string | null
  is_visible: boolean
  sort_order: number
}

export interface WebsiteLeadershipMember {
  id: string
  name: string
  role_title: string
  bio: string | null
  photo_url: string | null
  is_visible: boolean
  sort_order: number
}

export interface WebsitePolicy {
  id: string
  title: string
  content: string
  document_url: string | null
  is_visible: boolean
  sort_order: number
}

export interface WebsiteSportsProgram {
  id: string
  name: string
  description: string | null
  schedule: string | null
  is_visible: boolean
  sort_order: number
}

export interface WebsiteSportsMedia {
  id: string
  media_type: 'image' | 'video'
  file_url: string | null
  caption: string | null
  is_visible: boolean
  sort_order: number
}

export interface WebsiteOffice {
  id: string
  name: string
  directorate_head: string | null
  description: string | null
  email: string | null
  phone: string | null
  photo_url: string | null
  is_visible: boolean
  sort_order: number
}

export interface WebsiteResearchProject {
  id: string
  title: string
  category: 'research' | 'project'
  description: string | null
  status: string | null
  image_url: string | null
  link_url: string | null
  is_visible: boolean
  sort_order: number
}

export interface PublicWebsiteStats {
  student_count: number
  teacher_count: number
  graduate_count: number
  pass_rate: number | null
  academic_average?: number | null
}

export interface PublicWebsitePerformanceInsights {
  pass_rate_trend: { label: string; pass_rate: number }[]
  subject_performance: { label: string; average_percentage: number }[]
  grade_distribution: { label: string; count: number }[]
}

export interface PublicWebsiteData {
  school: {
    name: string
    slug: string
    logo_url: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    country: string | null
  }
  settings: WebsiteSettings
  sections: WebsiteSectionKey[]
  stats: PublicWebsiteStats | null
  performance_insights: PublicWebsitePerformanceInsights | null
  facilities: WebsiteFacility[]
  gallery_albums: WebsiteGalleryAlbum[]
  banners: WebsiteBanner[]
  testimonials: WebsiteTestimonial[]
  downloads: WebsiteDownload[]
  calendar_events: WebsiteCalendarEvent[]
  news: WebsiteNews[]
  admission_classes: WebsiteAdmissionClass[]
  academic_departments: WebsiteAcademicDepartment[]
  leadership: WebsiteLeadershipMember[]
  policies: WebsitePolicy[]
  sports_programs: WebsiteSportsProgram[]
  sports_media: WebsiteSportsMedia[]
  offices: WebsiteOffice[]
  research_items: WebsiteResearchProject[]
  projects: WebsiteResearchProject[]
}

export interface WebsiteAnalyticsSummary {
  page_views: number
  section_views: number
  downloads: number
  admission_clicks: number
  daily_views: { date: string; total: number }[]
  top_sections: { section_key: string; total: number }[]
  top_downloads: { id: string; title: string; download_count: number }[]
}
