import { useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { TopHeader } from '@/components/layout/TopHeader'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { QuickAddMenu } from '@/components/layout/QuickAddMenu'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)
  // Any route with an :id param renders its own <Breadcrumbs extra="..." />
  // with the real entity name — this avoids maintaining a route whitelist
  // here that's guaranteed to go stale as detail pages are added.
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-background">
      <TopHeader onOpenSearch={() => setSearchOpen(true)} />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {!id && <Breadcrumbs />}
        <Outlet />
      </main>
      <QuickAddMenu floating />
    </div>
  )
}
