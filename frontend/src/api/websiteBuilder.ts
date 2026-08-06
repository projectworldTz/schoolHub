import { apiClient } from '@/api/client'
import type {
  WebsiteAnalyticsSummary,
  WebsiteBanner,
  WebsiteCalendarEvent,
  WebsiteDownload,
  WebsiteFacility,
  WebsiteGalleryAlbum,
  WebsiteGalleryImage,
  WebsiteNews,
  WebsiteSection,
  WebsiteSettings,
  WebsiteSettingsPayload,
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
