import { useQuery } from '@tanstack/react-query'
import { fetchPublicWebsite } from '@/api/publicWebsite'

export function usePublicWebsite(slug: string) {
  return useQuery({
    queryKey: ['public', 'website', slug],
    queryFn: () => fetchPublicWebsite(slug),
    enabled: Boolean(slug),
    retry: false,
  })
}
