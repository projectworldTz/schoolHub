import { createContext, useContext } from 'react'
import type { PublicWebsiteData } from '@/types/websiteBuilder'

export interface PublicWebsiteContextValue {
  slug: string
  data: PublicWebsiteData
}

export const PublicWebsiteContext = createContext<PublicWebsiteContextValue | null>(null)

/** Reads the site-wide fetch made once by SitePublicLayout — every page under /site/:slug uses this instead of re-fetching. */
export function usePublicWebsiteContext(): PublicWebsiteContextValue {
  const ctx = useContext(PublicWebsiteContext)
  if (!ctx) throw new Error('usePublicWebsiteContext must be used within SitePublicLayout')
  return ctx
}
