import { useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { TopBar } from '@/components/layout/TopBar'
import { ModuleNavBar } from '@/components/layout/ModuleNavBar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { QuickAddMenu } from '@/components/layout/QuickAddMenu'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/useAuth'
import { useExitActingSchool } from '@/hooks/useSchools'

/** Shown only while a Super Admin has "entered" a school — see SchoolsPage. */
function ActingSchoolBanner({ schoolName }: { schoolName: string }) {
  const navigate = useNavigate()
  const exitActingSchool = useExitActingSchool()

  function handleExit() {
    exitActingSchool.mutate(undefined, {
      onSuccess: () => {
        toast.success('Back to platform admin')
        navigate('/platform/schools')
      },
    })
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-amber-950">
      <span>Platform admin — viewing {schoolName} with full access</span>
      <Button
        variant="outline"
        size="sm"
        className="h-6 border-amber-950/30 bg-transparent px-2 text-xs text-amber-950 hover:bg-amber-950/10 hover:text-amber-950"
        onClick={handleExit}
        disabled={exitActingSchool.isPending}
      >
        Exit
      </Button>
    </div>
  )
}

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)
  // Any route with an :id param renders its own <Breadcrumbs extra="..." />
  // with the real entity name — this avoids maintaining a route whitelist
  // here that's guaranteed to go stale as detail pages are added.
  const { id } = useParams()
  const { data: user } = useCurrentUser()

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 shadow-md shadow-black/5">
        {user?.acting_school && <ActingSchoolBanner schoolName={user.acting_school.name} />}
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <ModuleNavBar />
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {!id && <Breadcrumbs />}
        <Outlet />
      </main>
      <QuickAddMenu floating />
    </div>
  )
}
