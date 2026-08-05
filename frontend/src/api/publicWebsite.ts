import axios from 'axios'
import { apiOrigin } from '@/api/client'
import type { PublicWebsiteData } from '@/types/websiteBuilder'

// Deliberately a bare axios instance, not the app's apiClient: this page has
// no session, no CSRF cookie, and must never send credentials — same
// reasoning as the Notice Board's public API calls.
const publicClient = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: { Accept: 'application/json' },
})

export async function fetchPublicWebsite(slug: string): Promise<PublicWebsiteData> {
  const { data } = await publicClient.get<{ data: PublicWebsiteData }>(`/public/site/${slug}`)
  return data.data
}

export type WebsiteTrackEventType = 'page_view' | 'section_view' | 'download' | 'admission_click'

export function trackWebsiteEvent(slug: string, eventType: WebsiteTrackEventType, sectionKey?: string): void {
  // Fire-and-forget beacon — never blocks or throws into the caller.
  publicClient.post(`/public/site/${slug}/track`, { event_type: eventType, section_key: sectionKey }).catch(() => {})
}

export function websiteDownloadUrl(slug: string, downloadId: string): string {
  return `${apiOrigin}/api/public/site/${slug}/downloads/${downloadId}`
}
