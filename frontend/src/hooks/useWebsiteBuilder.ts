import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWebsiteGalleryImage,
  createWebsiteBanner,
  createWebsiteCalendarEvent,
  createWebsiteDownload,
  createWebsiteFacility,
  createWebsiteGalleryAlbum,
  createWebsiteTestimonial,
  deleteWebsiteBanner,
  deleteWebsiteCalendarEvent,
  deleteWebsiteDownload,
  deleteWebsiteFacility,
  deleteWebsiteGalleryAlbum,
  deleteWebsiteGalleryImage,
  deleteWebsiteTestimonial,
  fetchWebsiteAnalyticsSummary,
  fetchWebsiteBanners,
  fetchWebsiteCalendarEvents,
  fetchWebsiteDownloads,
  fetchWebsiteFacilities,
  fetchWebsiteGalleryAlbums,
  fetchWebsiteNews,
  fetchWebsiteSections,
  fetchWebsiteSettings,
  fetchWebsiteTestimonials,
  updateWebsiteBanner,
  updateWebsiteFacility,
  updateWebsiteNews,
  updateWebsiteSections,
  updateWebsiteSettings,
  uploadWebsiteHeroMedia,
  type WebsiteBannerPayload,
  type WebsiteCalendarEventPayload,
  type WebsiteDownloadPayload,
  type WebsiteFacilityPayload,
  type WebsiteGalleryAlbumPayload,
  type WebsiteTestimonialPayload,
} from '@/api/websiteBuilder'
import type { WebsiteSection, WebsiteSettingsPayload } from '@/types/websiteBuilder'

const KEY = {
  settings: ['website-builder', 'settings'] as const,
  sections: ['website-builder', 'sections'] as const,
  facilities: ['website-builder', 'facilities'] as const,
  galleryAlbums: ['website-builder', 'gallery-albums'] as const,
  banners: ['website-builder', 'banners'] as const,
  testimonials: ['website-builder', 'testimonials'] as const,
  downloads: ['website-builder', 'downloads'] as const,
  calendarEvents: ['website-builder', 'calendar-events'] as const,
  news: ['website-builder', 'news'] as const,
  analytics: ['website-builder', 'analytics'] as const,
}

export function useWebsiteSettings() {
  return useQuery({ queryKey: KEY.settings, queryFn: fetchWebsiteSettings })
}

export function useUpdateWebsiteSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteSettingsPayload) => updateWebsiteSettings(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.settings }),
  })
}

export function useUploadWebsiteHeroMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: 'image' | 'video' }) => uploadWebsiteHeroMedia(file, kind),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.settings }),
  })
}

export function useWebsiteSections() {
  return useQuery({ queryKey: KEY.sections, queryFn: fetchWebsiteSections })
}

export function useUpdateWebsiteSections() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sections: Pick<WebsiteSection, 'section_key' | 'is_visible' | 'sort_order'>[]) => updateWebsiteSections(sections),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.sections }),
  })
}

export function useWebsiteFacilities() {
  return useQuery({ queryKey: KEY.facilities, queryFn: fetchWebsiteFacilities })
}

export function useCreateWebsiteFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteFacilityPayload) => createWebsiteFacility(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.facilities }),
  })
}

export function useUpdateWebsiteFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebsiteFacilityPayload }) => updateWebsiteFacility(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.facilities }),
  })
}

export function useDeleteWebsiteFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteFacility(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.facilities }),
  })
}

export function useWebsiteGalleryAlbums() {
  return useQuery({ queryKey: KEY.galleryAlbums, queryFn: fetchWebsiteGalleryAlbums })
}

export function useCreateWebsiteGalleryAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteGalleryAlbumPayload) => createWebsiteGalleryAlbum(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.galleryAlbums }),
  })
}

export function useDeleteWebsiteGalleryAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteGalleryAlbum(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.galleryAlbums }),
  })
}

export function useAddWebsiteGalleryImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, file, caption }: { albumId: string; file: File; caption?: string }) =>
      addWebsiteGalleryImage(albumId, file, caption),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.galleryAlbums }),
  })
}

export function useDeleteWebsiteGalleryImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteGalleryImage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.galleryAlbums }),
  })
}

export function useWebsiteBanners() {
  return useQuery({ queryKey: KEY.banners, queryFn: fetchWebsiteBanners })
}

export function useCreateWebsiteBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteBannerPayload) => createWebsiteBanner(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.banners }),
  })
}

export function useUpdateWebsiteBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebsiteBannerPayload }) => updateWebsiteBanner(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.banners }),
  })
}

export function useDeleteWebsiteBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteBanner(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.banners }),
  })
}

export function useWebsiteTestimonials() {
  return useQuery({ queryKey: KEY.testimonials, queryFn: fetchWebsiteTestimonials })
}

export function useCreateWebsiteTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteTestimonialPayload) => createWebsiteTestimonial(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.testimonials }),
  })
}

export function useDeleteWebsiteTestimonial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteTestimonial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.testimonials }),
  })
}

export function useWebsiteDownloads() {
  return useQuery({ queryKey: KEY.downloads, queryFn: fetchWebsiteDownloads })
}

export function useCreateWebsiteDownload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteDownloadPayload) => createWebsiteDownload(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.downloads }),
  })
}

export function useDeleteWebsiteDownload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteDownload(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.downloads }),
  })
}

export function useWebsiteCalendarEvents() {
  return useQuery({ queryKey: KEY.calendarEvents, queryFn: fetchWebsiteCalendarEvents })
}

export function useCreateWebsiteCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteCalendarEventPayload) => createWebsiteCalendarEvent(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.calendarEvents }),
  })
}

export function useDeleteWebsiteCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteCalendarEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.calendarEvents }),
  })
}

export function useWebsiteNews() {
  return useQuery({ queryKey: KEY.news, queryFn: fetchWebsiteNews })
}

export function useUpdateWebsiteNews() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { is_featured?: boolean; sort_order?: number } }) =>
      updateWebsiteNews(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.news }),
  })
}

export function useWebsiteAnalyticsSummary() {
  return useQuery({ queryKey: KEY.analytics, queryFn: fetchWebsiteAnalyticsSummary })
}
