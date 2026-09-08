import { NAV_SECTIONS } from '@/config/nav'
import { hasPermission } from '@/lib/permissions'
import type { User } from '@/types/auth'

export function visibleNavSections(user: User | undefined | null) {
  return NAV_SECTIONS
    .filter((section) => hasPermission(user, section.permission))
    .map((section) => {
      const links = section.links?.filter((link) => hasPermission(user, link.permission))
      return {
        ...section,
        links,
        label: section.key === 'finance' && !links?.some((link) => link.to === '/app/finance')
          ? 'Expenses'
          : section.label,
      }
    })
    .filter((section) => section.to || Boolean(section.links?.length))
}
