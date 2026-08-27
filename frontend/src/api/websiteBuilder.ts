import { apiClient } from '@/api/client'
import type {
  WebsiteAcademicDepartment,
  WebsiteAdmissionClass,
  WebsiteAnalyticsSummary,
  WebsiteBanner,
  WebsiteCalendarEvent,
  WebsiteDownload,
  WebsiteFacility,
  WebsiteGalleryAlbum,
  WebsiteGalleryImage,
  WebsiteLeadershipMember,
  WebsiteNews,
  WebsiteOffice,
  WebsitePolicy,
  WebsiteResearchProject,
  WebsiteSection,
  WebsiteSettings,
  WebsiteSettingsPayload,
  WebsiteSportsMedia,
  WebsiteSportsProgram,
  WebsiteTestimonial,
} from '@/types/websiteBuilder'

const BASE = '/school/website-builder'

export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  const { data } = await apiClient.get<{ data: WebsiteSettings }>(`${BASE}/settings`)
  return data.data
}

export async function updateWebsiteSettings(payload: WebsiteSettingsPayload): Promise<WebsiteSettings> {
  const { data } = await apiClient.put<{ data: WebsiteSettings }>(`${BASE}/settings`, payload)
  return data.data
}

export async function uploadWebsiteHeroMedia(file: File, kind: 'image' | 'video'): Promise<WebsiteSettings> {
  const form = new FormData()
  form.append(kind, file)
  const { data } = await apiClient.post<{ data: WebsiteSettings }>(`${BASE}/settings/hero-media`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function fetchWebsiteSections(): Promise<WebsiteSection[]> {
  const { data } = await apiClient.get<{ data: WebsiteSection[] }>(`${BASE}/sections`)
  return data.data
}

export async function updateWebsiteSections(sections: Pick<WebsiteSection, 'section_key' | 'is_visible' | 'sort_order'>[]): Promise<WebsiteSection[]> {
  const { data } = await apiClient.put<{ data: WebsiteSection[] }>(`${BASE}/sections`, { sections })
  return data.data
}

export async function fetchWebsiteFacilities(): Promise<WebsiteFacility[]> {
  const { data } = await apiClient.get<{ data: WebsiteFacility[] }>(`${BASE}/facilities`)
  return data.data
}

export interface WebsiteFacilityPayload {
  name: string
  description?: string
  icon_key?: string
  image?: File
  sort_order?: number
}

function toFormData<T extends object>(payload: T): FormData {
  const form = new FormData()
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (value instanceof File) form.append(key, value)
    else if (typeof value === 'boolean') form.append(key, value ? '1' : '0')
    else form.append(key, String(value))
  })
  return form
}

export async function createWebsiteFacility(payload: WebsiteFacilityPayload): Promise<WebsiteFacility> {
  const { data } = await apiClient.post<{ data: WebsiteFacility }>(`${BASE}/facilities`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function updateWebsiteFacility(id: string, payload: WebsiteFacilityPayload): Promise<WebsiteFacility> {
  const { data } = await apiClient.post<{ data: WebsiteFacility }>(`${BASE}/facilities/${id}?_method=PUT`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteFacility(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/facilities/${id}`)
}

export async function fetchWebsiteGalleryAlbums(): Promise<WebsiteGalleryAlbum[]> {
  const { data } = await apiClient.get<{ data: WebsiteGalleryAlbum[] }>(`${BASE}/gallery-albums`)
  return data.data
}

export interface WebsiteGalleryAlbumPayload {
  name: string
  category: WebsiteGalleryAlbum['category']
  sort_order?: number
}

export async function createWebsiteGalleryAlbum(payload: WebsiteGalleryAlbumPayload): Promise<WebsiteGalleryAlbum> {
  const { data } = await apiClient.post<{ data: WebsiteGalleryAlbum }>(`${BASE}/gallery-albums`, payload)
  return data.data
}

export async function deleteWebsiteGalleryAlbum(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/gallery-albums/${id}`)
}

export async function addWebsiteGalleryImage(albumId: string, file: File, caption?: string): Promise<WebsiteGalleryImage> {
  const { data } = await apiClient.post<{ data: WebsiteGalleryImage }>(
    `${BASE}/gallery-albums/${albumId}/images`,
    toFormData({ image: file, caption }),
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data.data
}

export interface WebsiteGalleryImagePayload {
  image?: File
  caption?: string
  sort_order?: number
}

export async function updateWebsiteGalleryImage(id: string, payload: WebsiteGalleryImagePayload): Promise<WebsiteGalleryImage> {
  const { data } = await apiClient.post<{ data: WebsiteGalleryImage }>(
    `${BASE}/gallery-images/${id}?_method=PUT`,
    toFormData(payload),
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data.data
}

export async function deleteWebsiteGalleryImage(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/gallery-images/${id}`)
}

export async function fetchWebsiteBanners(): Promise<WebsiteBanner[]> {
  const { data } = await apiClient.get<{ data: WebsiteBanner[] }>(`${BASE}/banners`)
  return data.data
}

export interface WebsiteBannerPayload {
  image?: File
  title?: string
  subtitle?: string
  link_url?: string
  is_active?: boolean
  sort_order?: number
}

export async function createWebsiteBanner(payload: WebsiteBannerPayload): Promise<WebsiteBanner> {
  const { data } = await apiClient.post<{ data: WebsiteBanner }>(`${BASE}/banners`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function updateWebsiteBanner(id: string, payload: WebsiteBannerPayload): Promise<WebsiteBanner> {
  const { data } = await apiClient.post<{ data: WebsiteBanner }>(`${BASE}/banners/${id}?_method=PUT`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteBanner(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/banners/${id}`)
}

export async function fetchWebsiteTestimonials(): Promise<WebsiteTestimonial[]> {
  const { data } = await apiClient.get<{ data: WebsiteTestimonial[] }>(`${BASE}/testimonials`)
  return data.data
}

export interface WebsiteTestimonialPayload {
  author_name: string
  author_role: WebsiteTestimonial['author_role']
  message: string
  photo?: File
  is_published?: boolean
  sort_order?: number
}

export async function createWebsiteTestimonial(payload: WebsiteTestimonialPayload): Promise<WebsiteTestimonial> {
  const { data } = await apiClient.post<{ data: WebsiteTestimonial }>(`${BASE}/testimonials`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteTestimonial(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/testimonials/${id}`)
}

export async function fetchWebsiteDownloads(): Promise<WebsiteDownload[]> {
  const { data } = await apiClient.get<{ data: WebsiteDownload[] }>(`${BASE}/downloads`)
  return data.data
}

export interface WebsiteDownloadPayload {
  title: string
  category: WebsiteDownload['category']
  file?: File
  sort_order?: number
}

export async function createWebsiteDownload(payload: WebsiteDownloadPayload): Promise<WebsiteDownload> {
  const { data } = await apiClient.post<{ data: WebsiteDownload }>(`${BASE}/downloads`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteDownload(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/downloads/${id}`)
}

export async function fetchWebsiteCalendarEvents(): Promise<WebsiteCalendarEvent[]> {
  const { data } = await apiClient.get<{ data: WebsiteCalendarEvent[] }>(`${BASE}/calendar-events`)
  return data.data
}

export interface WebsiteCalendarEventPayload {
  title: string
  event_type: WebsiteCalendarEvent['event_type']
  start_date: string
  end_date?: string
  description?: string
}

export async function createWebsiteCalendarEvent(payload: WebsiteCalendarEventPayload): Promise<WebsiteCalendarEvent> {
  const { data } = await apiClient.post<{ data: WebsiteCalendarEvent }>(`${BASE}/calendar-events`, payload)
  return data.data
}

export async function deleteWebsiteCalendarEvent(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/calendar-events/${id}`)
}

export async function fetchWebsiteNews(): Promise<WebsiteNews[]> {
  const { data } = await apiClient.get<{ data: WebsiteNews[] }>(`${BASE}/news`)
  return data.data
}

export async function updateWebsiteNews(id: string, payload: { is_featured?: boolean; sort_order?: number }): Promise<WebsiteNews> {
  const { data } = await apiClient.put<{ data: WebsiteNews }>(`${BASE}/news/${id}`, payload)
  return data.data
}

export async function fetchWebsiteAnalyticsSummary(): Promise<WebsiteAnalyticsSummary> {
  const { data } = await apiClient.get<{ data: WebsiteAnalyticsSummary }>(`${BASE}/analytics/summary`)
  return data.data
}

// Multi-page nav content: Admission (per-class), Academic Disciplines
// (per-department) — fixed-set, same shape as sections: one row per real
// SchoolClass/Department, merged server-side so the admin list always shows
// every class/department even before it has a settings row yet.

export async function fetchWebsiteAdmissionClasses(): Promise<WebsiteAdmissionClass[]> {
  const { data } = await apiClient.get<{ data: WebsiteAdmissionClass[] }>(`${BASE}/admission-classes`)
  return data.data
}

export interface WebsiteAdmissionClassRow {
  school_class_id: string
  summary?: string | null
  requirements?: string | null
  is_visible: boolean
  sort_order: number
}

export async function updateWebsiteAdmissionClasses(classes: WebsiteAdmissionClassRow[]): Promise<WebsiteAdmissionClass[]> {
  const { data } = await apiClient.put<{ data: WebsiteAdmissionClass[] }>(`${BASE}/admission-classes`, { classes })
  return data.data
}

export async function fetchWebsiteAcademicDepartments(): Promise<WebsiteAcademicDepartment[]> {
  const { data } = await apiClient.get<{ data: WebsiteAcademicDepartment[] }>(`${BASE}/academic-departments`)
  return data.data
}

export interface WebsiteAcademicDepartmentRow {
  department_id: string
  public_description?: string | null
  is_visible: boolean
  sort_order: number
}

export async function updateWebsiteAcademicDepartments(departments: WebsiteAcademicDepartmentRow[]): Promise<WebsiteAcademicDepartment[]> {
  const { data } = await apiClient.put<{ data: WebsiteAcademicDepartment[] }>(`${BASE}/academic-departments`, { departments })
  return data.data
}

// Explore Us → Leadership & Management

export async function fetchWebsiteLeadership(): Promise<WebsiteLeadershipMember[]> {
  const { data } = await apiClient.get<{ data: WebsiteLeadershipMember[] }>(`${BASE}/leadership`)
  return data.data
}

export interface WebsiteLeadershipPayload {
  name: string
  role_title: string
  bio?: string
  photo?: File
  is_visible?: boolean
  sort_order?: number
}

export async function createWebsiteLeadership(payload: WebsiteLeadershipPayload): Promise<WebsiteLeadershipMember> {
  const { data } = await apiClient.post<{ data: WebsiteLeadershipMember }>(`${BASE}/leadership`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function updateWebsiteLeadership(id: string, payload: WebsiteLeadershipPayload): Promise<WebsiteLeadershipMember> {
  const { data } = await apiClient.post<{ data: WebsiteLeadershipMember }>(`${BASE}/leadership/${id}?_method=PUT`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteLeadership(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/leadership/${id}`)
}

// Explore Us → Policies

export async function fetchWebsitePolicies(): Promise<WebsitePolicy[]> {
  const { data } = await apiClient.get<{ data: WebsitePolicy[] }>(`${BASE}/policies`)
  return data.data
}

export interface WebsitePolicyPayload {
  title: string
  content: string
  document?: File
  is_visible?: boolean
  sort_order?: number
}

export async function createWebsitePolicy(payload: WebsitePolicyPayload): Promise<WebsitePolicy> {
  const { data } = await apiClient.post<{ data: WebsitePolicy }>(`${BASE}/policies`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function updateWebsitePolicy(id: string, payload: WebsitePolicyPayload): Promise<WebsitePolicy> {
  const { data } = await apiClient.post<{ data: WebsitePolicy }>(`${BASE}/policies/${id}?_method=PUT`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsitePolicy(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/policies/${id}`)
}

// Explore Us → Sport & Games (programs + image/video gallery)

export async function fetchWebsiteSportsPrograms(): Promise<WebsiteSportsProgram[]> {
  const { data } = await apiClient.get<{ data: WebsiteSportsProgram[] }>(`${BASE}/sports-programs`)
  return data.data
}

export interface WebsiteSportsProgramPayload {
  name: string
  description?: string
  schedule?: string
  is_visible?: boolean
  sort_order?: number
}

export async function createWebsiteSportsProgram(payload: WebsiteSportsProgramPayload): Promise<WebsiteSportsProgram> {
  const { data } = await apiClient.post<{ data: WebsiteSportsProgram }>(`${BASE}/sports-programs`, payload)
  return data.data
}

export async function deleteWebsiteSportsProgram(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/sports-programs/${id}`)
}

export async function fetchWebsiteSportsMedia(): Promise<WebsiteSportsMedia[]> {
  const { data } = await apiClient.get<{ data: WebsiteSportsMedia[] }>(`${BASE}/sports-media`)
  return data.data
}

export interface WebsiteSportsMediaPayload {
  media_type: WebsiteSportsMedia['media_type']
  file?: File
  caption?: string
  is_visible?: boolean
  sort_order?: number
}

export async function createWebsiteSportsMedia(payload: WebsiteSportsMediaPayload): Promise<WebsiteSportsMedia> {
  const { data } = await apiClient.post<{ data: WebsiteSportsMedia }>(`${BASE}/sports-media`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteSportsMedia(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/sports-media/${id}`)
}

// Offices & Directorates

export async function fetchWebsiteOffices(): Promise<WebsiteOffice[]> {
  const { data } = await apiClient.get<{ data: WebsiteOffice[] }>(`${BASE}/offices`)
  return data.data
}

export interface WebsiteOfficePayload {
  name: string
  directorate_head?: string
  description?: string
  email?: string
  phone?: string
  photo?: File
  is_visible?: boolean
  sort_order?: number
}

export async function createWebsiteOffice(payload: WebsiteOfficePayload): Promise<WebsiteOffice> {
  const { data } = await apiClient.post<{ data: WebsiteOffice }>(`${BASE}/offices`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function updateWebsiteOffice(id: string, payload: WebsiteOfficePayload): Promise<WebsiteOffice> {
  const { data } = await apiClient.post<{ data: WebsiteOffice }>(`${BASE}/offices/${id}?_method=PUT`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteOffice(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/offices/${id}`)
}

// Research & Innovation / Projects — one shared table, filtered by category

export async function fetchWebsiteResearchProjects(): Promise<WebsiteResearchProject[]> {
  const { data } = await apiClient.get<{ data: WebsiteResearchProject[] }>(`${BASE}/research-projects`)
  return data.data
}

export interface WebsiteResearchProjectPayload {
  title: string
  category: WebsiteResearchProject['category']
  description?: string
  status?: string
  image?: File
  link_url?: string
  is_visible?: boolean
  sort_order?: number
}

export async function createWebsiteResearchProject(payload: WebsiteResearchProjectPayload): Promise<WebsiteResearchProject> {
  const { data } = await apiClient.post<{ data: WebsiteResearchProject }>(`${BASE}/research-projects`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteWebsiteResearchProject(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/research-projects/${id}`)
}
