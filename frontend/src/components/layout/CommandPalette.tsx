import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  GraduationCap,
  LayoutGrid,
  Settings,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useCurrentUser } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { NAV_SECTIONS } from '@/config/nav'
import { listStudents } from '@/api/students'
import { listStaff } from '@/api/staff'

interface StaticEntry {
  label: string
  description: string
  to: string
  icon: LucideIcon
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const debouncedQuery = useDebouncedValue(query, 250)
  const searchActive = open && debouncedQuery.trim().length >= 2

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const { data: students } = useQuery({
    queryKey: ['command-palette', 'students', debouncedQuery],
    queryFn: () => listStudents(debouncedQuery),
    enabled: searchActive && hasPermission(user, 'students.manage'),
  })

  const { data: staff } = useQuery({
    queryKey: ['command-palette', 'staff', debouncedQuery],
    queryFn: () => listStaff(debouncedQuery),
    enabled: searchActive && hasPermission(user, 'staff.manage'),
  })

  function go(to: string) {
    onOpenChange(false)
    navigate(to)
  }

  const staticEntries: StaticEntry[] = [
    { label: 'Dashboard', description: 'Overview & quick stats', to: '/app/dashboard', icon: LayoutGrid },
    ...NAV_SECTIONS.flatMap((section) =>
      (section.links ?? []).map((link) => ({
        label: link.label,
        description: link.description,
        to: link.to,
        icon: link.icon,
      }))
    ),
    { label: 'Settings', description: 'School profile & configuration', to: '/app/settings', icon: Settings },
  ].filter((entry, index, all) => all.findIndex((e) => e.to === entry.to && e.label === entry.label) === index)

  const filteredStatic = query.trim().length === 0
    ? staticEntries.slice(0, 8)
    : staticEntries.filter(
        (e) =>
          e.label.toLowerCase().includes(query.toLowerCase()) ||
          e.description.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search SchoolHub"
      description="Search students, staff, and everything else"
      shouldFilter={false}
    >
      <CommandInput placeholder="Search students, staff, classes, settings…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {searchActive && students && students.data.length > 0 && (
          <CommandGroup heading="Students">
            {students.data.slice(0, 5).map((student) => (
              <CommandItem
                key={student.id}
                value={`${student.full_name} ${student.admission_number}`}
                onSelect={() => go(`/app/students/${student.id}`)}
              >
                <UsersRound className="size-4 text-muted-foreground" />
                <span>{student.full_name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{student.admission_number}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchActive && staff && staff.data.length > 0 && (
          <CommandGroup heading="Staff">
            {staff.data.map((member) => (
              <CommandItem key={member.id} value={`${member.name} ${member.job_title ?? ''}`} onSelect={() => go('/app/staff')}>
                <GraduationCap className="size-4 text-muted-foreground" />
                <span>{member.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{member.job_title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Go to">
          {filteredStatic.map((entry) => (
            <CommandItem key={`${entry.label}-${entry.to}`} value={entry.label} onSelect={() => go(entry.to)}>
              <entry.icon className="size-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{entry.label}</span>
                <span className="text-xs text-muted-foreground">{entry.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
