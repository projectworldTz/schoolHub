import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWebsiteGalleryImage,
  createWebsiteBanner,
  createWebsiteCalendarEvent,
  createWebsiteDownload,
  createWebsiteFacility,
  createWebsiteGalleryAlbum,
  createWebsiteLeadership,
  createWebsiteOffice,
  createWebsitePolicy,
  createWebsiteResearchProject,
  createWebsiteSportsMedia,
  createWebsiteSportsProgram,
  createWebsiteTestimonial,
  deleteWebsiteBanner,
  deleteWebsiteCalendarEvent,
  deleteWebsiteDownload,
  deleteWebsiteFacility,
  deleteWebsiteGalleryAlbum,
  deleteWebsiteGalleryImage,
  deleteWebsiteLeadership,
  deleteWebsiteOffice,
  deleteWebsitePolicy,
  deleteWebsiteResearchProject,
  deleteWebsiteSportsMedia,
  deleteWebsiteSportsProgram,
  deleteWebsiteTestimonial,
  fetchWebsiteAcademicDepartments,
  fetchWebsiteAdmissionClasses,
  fetchWebsiteAnalyticsSummary,
  fetchWebsiteBanners,
  fetchWebsiteCalendarEvents,
  fetchWebsiteDownloads,
  fetchWebsiteFacilities,
  fetchWebsiteGalleryAlbums,
  fetchWebsiteLeadership,
  fetchWebsiteNews,
  fetchWebsiteOffices,
  fetchWebsitePolicies,
  fetchWebsiteResearchProjects,
  fetchWebsiteSections,
  fetchWebsiteSettings,
  fetchWebsiteSportsMedia,
  fetchWebsiteSportsPrograms,
  fetchWebsiteTestimonials,
  updateWebsiteAcademicDepartments,
  updateWebsiteAdmissionClasses,
  updateWebsiteBanner,
  updateWebsiteFacility,
  updateWebsiteGalleryImage,
  updateWebsiteLeadership,
  updateWebsiteNews,
  updateWebsiteOffice,
  updateWebsitePolicy,
  updateWebsiteSections,
  updateWebsiteSettings,
  uploadWebsiteHeroMedia,
  type WebsiteAcademicDepartmentRow,
  type WebsiteAdmissionClassRow,
  type WebsiteBannerPayload,
  type WebsiteCalendarEventPayload,
  type WebsiteDownloadPayload,
  type WebsiteFacilityPayload,
  type WebsiteGalleryAlbumPayload,
  type WebsiteGalleryImagePayload,
  type WebsiteLeadershipPayload,
  type WebsiteOfficePayload,
  type WebsitePolicyPayload,
  type WebsiteResearchProjectPayload,
  type WebsiteSportsMediaPayload,
  type WebsiteSportsProgramPayload,
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
  admissionClasses: ['website-builder', 'admission-classes'] as const,
  academicDepartments: ['website-builder', 'academic-departments'] as const,
  leadership: ['website-builder', 'leadership'] as const,
  policies: ['website-builder', 'policies'] as const,
  sportsPrograms: ['website-builder', 'sports-programs'] as const,
  sportsMedia: ['website-builder', 'sports-media'] as const,
  offices: ['website-builder', 'offices'] as const,
  researchProjects: ['website-builder', 'research-projects'] as const,
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

export function useUpdateWebsiteGalleryImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebsiteGalleryImagePayload }) => updateWebsiteGalleryImage(id, payload),
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

export function useWebsiteAdmissionClasses() {
  return useQuery({ queryKey: KEY.admissionClasses, queryFn: fetchWebsiteAdmissionClasses })
}

export function useUpdateWebsiteAdmissionClasses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (classes: WebsiteAdmissionClassRow[]) => updateWebsiteAdmissionClasses(classes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.admissionClasses }),
  })
}

export function useWebsiteAcademicDepartments() {
  return useQuery({ queryKey: KEY.academicDepartments, queryFn: fetchWebsiteAcademicDepartments })
}

export function useUpdateWebsiteAcademicDepartments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (departments: WebsiteAcademicDepartmentRow[]) => updateWebsiteAcademicDepartments(departments),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.academicDepartments }),
  })
}

export function useWebsiteLeadership() {
  return useQuery({ queryKey: KEY.leadership, queryFn: fetchWebsiteLeadership })
}

export function useCreateWebsiteLeadership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteLeadershipPayload) => createWebsiteLeadership(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.leadership }),
  })
}

export function useUpdateWebsiteLeadership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebsiteLeadershipPayload }) => updateWebsiteLeadership(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.leadership }),
  })
}

export function useDeleteWebsiteLeadership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteLeadership(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.leadership }),
  })
}

export function useWebsitePolicies() {
  return useQuery({ queryKey: KEY.policies, queryFn: fetchWebsitePolicies })
}

export function useCreateWebsitePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsitePolicyPayload) => createWebsitePolicy(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.policies }),
  })
}

export function useUpdateWebsitePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebsitePolicyPayload }) => updateWebsitePolicy(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.policies }),
  })
}

export function useDeleteWebsitePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsitePolicy(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.policies }),
  })
}

export function useWebsiteSportsPrograms() {
  return useQuery({ queryKey: KEY.sportsPrograms, queryFn: fetchWebsiteSportsPrograms })
}

export function useCreateWebsiteSportsProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteSportsProgramPayload) => createWebsiteSportsProgram(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.sportsPrograms }),
  })
}

export function useDeleteWebsiteSportsProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteSportsProgram(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.sportsPrograms }),
  })
}

export function useWebsiteSportsMedia() {
  return useQuery({ queryKey: KEY.sportsMedia, queryFn: fetchWebsiteSportsMedia })
}

export function useCreateWebsiteSportsMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteSportsMediaPayload) => createWebsiteSportsMedia(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.sportsMedia }),
  })
}

export function useDeleteWebsiteSportsMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteSportsMedia(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.sportsMedia }),
  })
}

export function useWebsiteOffices() {
  return useQuery({ queryKey: KEY.offices, queryFn: fetchWebsiteOffices })
}

export function useCreateWebsiteOffice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteOfficePayload) => createWebsiteOffice(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.offices }),
  })
}

export function useUpdateWebsiteOffice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebsiteOfficePayload }) => updateWebsiteOffice(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.offices }),
  })
}

export function useDeleteWebsiteOffice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteOffice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.offices }),
  })
}

export function useWebsiteResearchProjects() {
  return useQuery({ queryKey: KEY.researchProjects, queryFn: fetchWebsiteResearchProjects })
}

export function useCreateWebsiteResearchProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebsiteResearchProjectPayload) => createWebsiteResearchProject(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.researchProjects }),
  })
}

export function useDeleteWebsiteResearchProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebsiteResearchProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.researchProjects }),
  })
}
