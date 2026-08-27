import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Building2,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  Newspaper,
  Palette,
  Pencil,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSchoolProfile } from '@/hooks/useSchoolSetup'
import { cn } from '@/lib/utils'
import {
  useAddWebsiteGalleryImage,
  useCreateWebsiteBanner,
  useCreateWebsiteCalendarEvent,
  useCreateWebsiteDownload,
  useCreateWebsiteFacility,
  useCreateWebsiteGalleryAlbum,
  useCreateWebsiteLeadership,
  useCreateWebsiteOffice,
  useCreateWebsitePolicy,
  useCreateWebsiteResearchProject,
  useCreateWebsiteSportsMedia,
  useCreateWebsiteSportsProgram,
  useCreateWebsiteTestimonial,
  useDeleteWebsiteBanner,
  useDeleteWebsiteCalendarEvent,
  useDeleteWebsiteDownload,
  useDeleteWebsiteFacility,
  useDeleteWebsiteGalleryAlbum,
  useDeleteWebsiteGalleryImage,
  useDeleteWebsiteLeadership,
  useDeleteWebsiteOffice,
  useDeleteWebsitePolicy,
  useDeleteWebsiteResearchProject,
  useDeleteWebsiteSportsMedia,
  useDeleteWebsiteSportsProgram,
  useDeleteWebsiteTestimonial,
  useUpdateWebsiteAcademicDepartments,
  useUpdateWebsiteAdmissionClasses,
  useUpdateWebsiteBanner,
  useUpdateWebsiteGalleryImage,
  useUpdateWebsiteNews,
  useUpdateWebsiteSections,
  useUpdateWebsiteSettings,
  useUploadWebsiteHeroMedia,
  useWebsiteAcademicDepartments,
  useWebsiteAdmissionClasses,
  useWebsiteAnalyticsSummary,
  useWebsiteBanners,
  useWebsiteCalendarEvents,
  useWebsiteDownloads,
  useWebsiteFacilities,
  useWebsiteGalleryAlbums,
  useWebsiteLeadership,
  useWebsiteNews,
  useWebsiteOffices,
  useWebsitePolicies,
  useWebsiteResearchProjects,
  useWebsiteSections,
  useWebsiteSettings,
  useWebsiteSportsMedia,
  useWebsiteSportsPrograms,
  useWebsiteTestimonials,
} from '@/hooks/useWebsiteBuilder'
import type {
  WebsiteAcademicDepartment,
  WebsiteAdmissionClass,
  WebsiteGalleryImage,
  WebsiteResearchProject,
  WebsiteSection,
  WebsiteSectionKey,
  WebsiteSettingsPayload,
  WebsiteThemeKey,
} from '@/types/websiteBuilder'

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) ? (error.response?.data?.message ?? fallback) : fallback
}

const LOCKED_TITLE: Record<string, string> = {
  not_granted: 'Website Builder is a premium feature',
  suspended: 'Website Builder access is suspended',
  expired: 'Website Builder access has expired',
}

function WebsiteAccessLockedNotice({ status, reason }: { status: string; reason?: string | null }) {
  const isProblem = status === 'suspended' || status === 'expired'
  return (
    <Card className="shadow-premium border-none">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-2xl text-white shadow-lg',
            isProblem ? 'bg-destructive shadow-destructive/25' : 'bg-gradient-brand shadow-primary/25'
          )}
        >
          {isProblem ? <AlertTriangle className="size-7" /> : <Lock className="size-7" />}
        </span>
        <div>
          <p className="font-display text-lg font-semibold">{LOCKED_TITLE[status] ?? 'Website Builder is locked'}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {reason ? `Reason: ${reason}. ` : ''}Ask your Platform Administrator to grant Website Builder access to
            unlock a public marketing website for your school.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const SECTION_LABELS: Record<WebsiteSectionKey, string> = {
  hero: 'Hero',
  about: 'About',
  stats: 'Statistics',
  facilities: 'Facilities',
  gallery: 'Gallery',
  news: 'News',
  admissions: 'Admissions',
  calendar: 'School Calendar',
  testimonials: 'Testimonials',
  contact: 'Contact',
}

const THEME_KEYS: WebsiteThemeKey[] = ['modern', 'minimal', 'classic', 'international', 'luxury', 'children', 'dark', 'blue', 'green']

function HomepageTab() {
  const { data: settings, isLoading } = useWebsiteSettings()
  const update = useUpdateWebsiteSettings()
  const uploadHero = useUploadWebsiteHeroMedia()
  const [form, setForm] = useState<WebsiteSettingsPayload>({})

  useEffect(() => {
    if (settings) {
      setForm({
        motto: settings.motto ?? '',
        principal_name: settings.principal_name ?? '',
        principal_message: settings.principal_message ?? '',
        mission: settings.mission ?? '',
        vision: settings.vision ?? '',
        core_values: settings.core_values ?? '',
      })
    }
  }, [settings])

  function save(e: FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => toast.success('Homepage content saved'),
      onError: (error) => toast.error(errorMessage(error, 'Could not save homepage content')),
    })
  }

  function handleHeroImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadHero.mutate(
      { file, kind: 'image' },
      {
        onSuccess: () => toast.success('Hero image updated'),
        onError: (error) => toast.error(errorMessage(error, 'Could not upload hero image')),
      }
    )
    e.target.value = ''
  }

  if (isLoading || !settings) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
          <CardDescription>The first thing visitors see</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {settings.hero_image_url ? (
              <img src={settings.hero_image_url} alt="Hero" className="h-20 w-32 rounded-lg object-cover" />
            ) : (
              <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
            )}
            <div>
              <Label htmlFor="hero-image" className="cursor-pointer text-sm font-medium text-primary">
                {uploadHero.isPending ? 'Uploading…' : 'Upload hero image'}
              </Label>
              <Input id="hero-image" type="file" accept="image/*" className="hidden" onChange={handleHeroImage} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Motto / tagline</Label>
            <Input value={form.motto ?? ''} onChange={(e) => setForm({ ...form, motto: e.target.value })} placeholder="e.g. Excellence in every child" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About the school</CardTitle>
          <CardDescription>Principal's message, mission, vision, and core values</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Principal / Head teacher name</Label>
                <Input value={form.principal_name ?? ''} onChange={(e) => setForm({ ...form, principal_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Principal's message</Label>
              <Textarea rows={3} value={form.principal_message ?? ''} onChange={(e) => setForm({ ...form, principal_message: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Mission</Label>
              <Textarea rows={2} value={form.mission ?? ''} onChange={(e) => setForm({ ...form, mission: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Vision</Label>
              <Textarea rows={2} value={form.vision ?? ''} onChange={(e) => setForm({ ...form, vision: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Core values</Label>
              <Textarea rows={2} value={form.core_values ?? ''} onChange={(e) => setForm({ ...form, core_values: e.target.value })} placeholder="Integrity, Excellence, Respect…" />
            </div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save homepage content'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function SectionsTab() {
  const { data: sections, isLoading } = useWebsiteSections()
  const update = useUpdateWebsiteSections()
  const [local, setLocal] = useState<WebsiteSection[]>([])

  useEffect(() => {
    if (sections) setLocal([...sections].sort((a, b) => a.sort_order - b.sort_order))
  }, [sections])

  function toggle(key: WebsiteSectionKey) {
    setLocal((prev) => prev.map((s) => (s.section_key === key ? { ...s, is_visible: !s.is_visible } : s)))
  }

  function move(index: number, direction: -1 | 1) {
    setLocal((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, sort_order: i }))
    })
  }

  function save() {
    update.mutate(
      local.map((s) => ({ section_key: s.section_key, is_visible: s.is_visible, sort_order: s.sort_order })),
      {
        onSuccess: () => toast.success('Section order saved'),
        onError: (error) => toast.error(errorMessage(error, 'Could not save section order')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Homepage sections</CardTitle>
          <CardDescription>Order and visibility on the public site</CardDescription>
        </div>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save order'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {local.map((section, i) => (
          <div key={section.section_key} className="flex items-center gap-3 rounded-lg border px-3 py-2">
            <GripVertical className="size-4 text-muted-foreground" />
            <span className="flex-1 font-medium">{SECTION_LABELS[section.section_key]}</span>
            <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0}>
              ↑
            </Button>
            <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === local.length - 1}>
              ↓
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toggle(section.section_key)}>
              {section.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ThemeTab() {
  const { data: settings, isLoading } = useWebsiteSettings()
  const update = useUpdateWebsiteSettings()
  const [color, setColor] = useState('')

  useEffect(() => {
    if (settings) setColor(settings.primary_color ?? '')
  }, [settings])

  function selectTheme(theme_key: WebsiteThemeKey) {
    update.mutate({ theme_key }, {
      onSuccess: () => toast.success('Theme updated'),
      onError: (error) => toast.error(errorMessage(error, 'Could not update theme')),
    })
  }

  function saveColor() {
    update.mutate({ primary_color: color || null }, {
      onSuccess: () => toast.success('Accent color updated'),
      onError: (error) => toast.error(errorMessage(error, 'Could not update accent color')),
    })
  }

  if (isLoading || !settings) return <Skeleton className="h-64 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Pick a preset — no coding required</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {THEME_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectTheme(key)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors hover:border-primary/50',
                settings.theme_key === key && 'border-primary ring-2 ring-primary/20'
              )}
            >
              <p className="font-medium capitalize">{key}</p>
              {settings.theme_key === key && <Badge className="mt-1">Active</Badge>}
            </button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Accent color override (optional)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Input type="color" value={color || '#2563eb'} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 p-1" />
          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#2563eb" className="max-w-40" />
          <Button onClick={saveColor} disabled={update.isPending} variant="outline">
            Save color
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function AdmissionsTab() {
  const { data: settings, isLoading } = useWebsiteSettings()
  const update = useUpdateWebsiteSettings()
  const [form, setForm] = useState<WebsiteSettingsPayload>({})

  useEffect(() => {
    if (settings) {
      setForm({
        admission_status: settings.admission_status,
        admission_open_date: settings.admission_open_date ?? '',
        admission_close_date: settings.admission_close_date ?? '',
        admission_requirements: settings.admission_requirements ?? '',
      })
    }
  }, [settings])

  function save(e: FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => toast.success('Admissions info saved'),
      onError: (error) => toast.error(errorMessage(error, 'Could not save admissions info')),
    })
  }

  if (isLoading || !settings) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Admissions</CardTitle>
        <CardDescription>Shown on the public site's Admissions section</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-3">
            <Label>Admissions are</Label>
            <Select value={form.admission_status as string} onValueChange={(v) => setForm({ ...form, admission_status: v as 'open' | 'closed' })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Opens on</Label>
              <Input type="date" value={(form.admission_open_date as string) ?? ''} onChange={(e) => setForm({ ...form, admission_open_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Closes on</Label>
              <Input type="date" value={(form.admission_close_date as string) ?? ''} onChange={(e) => setForm({ ...form, admission_close_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Requirements</Label>
            <Textarea rows={4} value={form.admission_requirements ?? ''} onChange={(e) => setForm({ ...form, admission_requirements: e.target.value })} />
          </div>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save admissions info'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function SeoTab() {
  const { data: settings, isLoading } = useWebsiteSettings()
  const update = useUpdateWebsiteSettings()
  const [form, setForm] = useState<WebsiteSettingsPayload>({})

  useEffect(() => {
    if (settings) {
      setForm({
        meta_title: settings.meta_title ?? '',
        meta_description: settings.meta_description ?? '',
        meta_keywords: settings.meta_keywords ?? '',
      })
    }
  }, [settings])

  function save(e: FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => toast.success('SEO settings saved'),
      onError: (error) => toast.error(errorMessage(error, 'Could not save SEO settings')),
    })
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>SEO</CardTitle>
        <CardDescription>How your site appears in search results and link previews</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Page title</Label>
            <Input value={form.meta_title ?? ''} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} maxLength={255} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={form.meta_description ?? ''} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <Label>Keywords (comma separated)</Label>
            <Input value={form.meta_keywords ?? ''} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })} />
          </div>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save SEO settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function SettingsTab() {
  const { data: settings, isLoading } = useWebsiteSettings()
  const update = useUpdateWebsiteSettings()
  const [form, setForm] = useState<WebsiteSettingsPayload>({})

  useEffect(() => {
    if (settings) {
      setForm({
        facebook_url: settings.facebook_url ?? '',
        twitter_url: settings.twitter_url ?? '',
        instagram_url: settings.instagram_url ?? '',
        youtube_url: settings.youtube_url ?? '',
        linkedin_url: settings.linkedin_url ?? '',
        whatsapp_number: settings.whatsapp_number ?? '',
        google_maps_embed_url: settings.google_maps_embed_url ?? '',
        custom_css: settings.custom_css ?? '',
        stats_visibility: settings.stats_visibility,
      })
    }
  }, [settings])

  function save(e: FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => toast.success('Settings saved'),
      onError: (error) => toast.error(errorMessage(error, 'Could not save settings')),
    })
  }

  function togglePublish(checked: boolean) {
    update.mutate({ is_published: checked }, {
      onSuccess: () => toast.success(checked ? 'Website is now live' : 'Website unpublished'),
      onError: (error) => toast.error(errorMessage(error, 'Could not update publish status')),
    })
  }

  if (isLoading || !settings) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Publish</CardTitle>
          <CardDescription>Your site is only visible to the public once published</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Switch checked={settings.is_published} onCheckedChange={togglePublish} disabled={update.isPending} />
          <span className="text-sm font-medium">{settings.is_published ? 'Published — live for visitors' : 'Draft — not visible yet'}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={form.stats_visibility as string}
            onValueChange={(v) => update.mutate({ stats_visibility: v as 'publish' | 'hide' | 'summary_only' }, {
              onError: (error) => toast.error(errorMessage(error, 'Could not update')),
            })}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publish">Publish full breakdown</SelectItem>
              <SelectItem value="summary_only">Summary only</SelectItem>
              <SelectItem value="hide">Hide entirely</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Contact &amp; social</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Facebook URL</Label>
                <Input value={form.facebook_url ?? ''} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Twitter / X URL</Label>
                <Input value={form.twitter_url ?? ''} onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram URL</Label>
                <Input value={form.instagram_url ?? ''} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>YouTube URL</Label>
                <Input value={form.youtube_url ?? ''} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input value={form.linkedin_url ?? ''} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp number</Label>
                <Input value={form.whatsapp_number ?? ''} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+255700000000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Google Maps embed URL</Label>
              <Input value={form.google_maps_embed_url ?? ''} onChange={(e) => setForm({ ...form, google_maps_embed_url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Custom CSS (optional, scoped to your public site)</Label>
              <Textarea rows={5} className="font-mono text-xs" value={form.custom_css ?? ''} onChange={(e) => setForm({ ...form, custom_css: e.target.value })} />
            </div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

interface PendingGalleryUpload {
  albumId: string
  file: File
  previewUrl: string
  caption: string
}

function GalleryTab() {
  const { data: albums, isLoading } = useWebsiteGalleryAlbums()
  const createAlbum = useCreateWebsiteGalleryAlbum()
  const deleteAlbum = useDeleteWebsiteGalleryAlbum()
  const addImage = useAddWebsiteGalleryImage()
  const updateImage = useUpdateWebsiteGalleryImage()
  const deleteImage = useDeleteWebsiteGalleryImage()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('campus')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteImageTarget, setDeleteImageTarget] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingGalleryUpload | null>(null)
  const [editing, setEditing] = useState<WebsiteGalleryImage | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null)

  function createAlbumHandler(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createAlbum.mutate(
      { name: name.trim(), category: category as never },
      {
        onSuccess: () => {
          setName('')
          toast.success('Album created')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not create album')),
      }
    )
  }

  function handleFileSelected(albumId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setPending({ albumId, file, previewUrl: URL.createObjectURL(file), caption: '' })
  }

  function cancelPending() {
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setPending(null)
  }

  function confirmUpload() {
    if (!pending) return
    addImage.mutate(
      { albumId: pending.albumId, file: pending.file, caption: pending.caption.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Photo uploaded')
          URL.revokeObjectURL(pending.previewUrl)
          setPending(null)
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not upload image')),
      }
    )
  }

  function openEdit(image: WebsiteGalleryImage) {
    setEditing(image)
    setEditCaption(image.caption ?? '')
    setEditFile(null)
    setEditPreviewUrl(null)
  }

  function closeEdit() {
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl)
    setEditing(null)
    setEditFile(null)
    setEditPreviewUrl(null)
  }

  function handleEditFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl)
    setEditFile(file)
    setEditPreviewUrl(URL.createObjectURL(file))
  }

  function saveEdit() {
    if (!editing) return
    updateImage.mutate(
      { id: editing.id, payload: { caption: editCaption.trim() || undefined, image: editFile ?? undefined } },
      {
        onSuccess: () => {
          toast.success('Photo updated')
          closeEdit()
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not update photo')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>New album</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAlbumHandler} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sports Day 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['campus', 'students', 'laboratories', 'sports', 'graduation', 'school_life'].map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createAlbum.isPending}>
              Create album
            </Button>
          </form>
        </CardContent>
      </Card>

      {(albums ?? []).map((album) => (
        <Card key={album.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{album.name}</CardTitle>
              <CardDescription className="capitalize">{album.category.replace('_', ' ')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`upload-${album.id}`} className="cursor-pointer text-sm font-medium text-primary">
                Add photo
              </Label>
              <Input
                id={`upload-${album.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelected(album.id, e)}
              />
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(album.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending?.albumId === album.id && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3">
                <img src={pending.previewUrl} alt="Selected preview" className="h-16 w-16 rounded-lg object-cover" />
                <Input
                  value={pending.caption}
                  onChange={(e) => setPending({ ...pending, caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className="min-w-48 flex-1"
                />
                <Button size="sm" onClick={confirmUpload} disabled={addImage.isPending} className="gap-1.5">
                  <Upload className="size-3.5" />
                  {addImage.isPending ? 'Uploading…' : 'Upload'}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelPending} disabled={addImage.isPending}>
                  Cancel
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {(album.images ?? []).length === 0 && <p className="text-sm text-muted-foreground">No photos yet.</p>}
              {(album.images ?? []).map((image) => (
                <div key={image.id} className="group relative">
                  <img src={image.image_url ?? ''} alt={image.caption ?? ''} className="h-24 w-24 rounded-lg object-cover" />
                  <div className="absolute inset-x-0 -top-1.5 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(image)}
                      className="flex size-5 items-center justify-center rounded-full bg-primary text-white"
                      aria-label="Edit photo"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteImageTarget(image.id)}
                      className="flex size-5 items-center justify-center rounded-full bg-destructive text-white"
                      aria-label="Delete photo"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this album?"
        description="All photos in it will be removed too. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteAlbum.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
      />

      <ConfirmDialog
        open={deleteImageTarget !== null}
        onOpenChange={(open) => !open && setDeleteImageTarget(null)}
        title="Delete this photo?"
        description="This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteImageTarget) deleteImage.mutate(deleteImageTarget)
          setDeleteImageTarget(null)
        }}
      />

      <Dialog open={editing !== null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit photo</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <img
                src={editPreviewUrl ?? editing.image_url ?? ''}
                alt={editCaption}
                className="h-40 w-full rounded-lg object-cover"
              />
              <div className="space-y-1.5">
                <Label htmlFor="edit-photo-file" className="cursor-pointer text-sm font-medium text-primary">
                  Replace image
                </Label>
                <Input id="edit-photo-file" type="file" accept="image/*" className="hidden" onChange={handleEditFileSelected} />
              </div>
              <div className="space-y-1.5">
                <Label>Caption</Label>
                <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="Caption (optional)" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={updateImage.isPending}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={updateImage.isPending}>
              {updateImage.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FacilitiesTab() {
  const { data: facilities, isLoading } = useWebsiteFacilities()
  const create = useCreateWebsiteFacility()
  const remove = useDeleteWebsiteFacility()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          toast.success('Facility added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add facility')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a facility</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Science Laboratory" />
            </div>
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(facilities ?? []).map((f) => (
          <Card key={f.id}>
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div>
                <p className="font-medium">{f.name}</p>
                {f.description && <p className="text-sm text-muted-foreground">{f.description}</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove.mutate(f.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function BannersTab() {
  const { data: banners, isLoading } = useWebsiteBanners()
  const create = useCreateWebsiteBanner()
  const update = useUpdateWebsiteBanner()
  const remove = useDeleteWebsiteBanner()

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    create.mutate(
      { image: file },
      { onError: (error) => toast.error(errorMessage(error, 'Could not upload banner')) }
    )
    e.target.value = ''
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Rotating banners</CardTitle>
          <CardDescription>Promo images shown on the homepage hero</CardDescription>
        </div>
        <div>
          <Label htmlFor="banner-upload" className="cursor-pointer text-sm font-medium text-primary">
            Add banner
          </Label>
          <Input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        {(banners ?? []).length === 0 && <p className="text-sm text-muted-foreground">No banners yet.</p>}
        {(banners ?? []).map((b) => (
          <div key={b.id} className="relative w-48 rounded-lg border p-2">
            {b.image_url && <img src={b.image_url} alt={b.title ?? ''} className="mb-2 h-24 w-full rounded object-cover" />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <Switch
                  size="sm"
                  checked={b.is_active}
                  onCheckedChange={(checked) => update.mutate({ id: b.id, payload: { is_active: checked } })}
                />
                Active
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(b.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TestimonialsTab() {
  const { data: testimonials, isLoading } = useWebsiteTestimonials()
  const create = useCreateWebsiteTestimonial()
  const remove = useDeleteWebsiteTestimonial()
  const [authorName, setAuthorName] = useState('')
  const [authorRole, setAuthorRole] = useState('parent')
  const [message, setMessage] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!authorName.trim() || !message.trim()) return
    create.mutate(
      { author_name: authorName.trim(), author_role: authorRole as never, message: message.trim() },
      {
        onSuccess: () => {
          setAuthorName('')
          setMessage('')
          toast.success('Testimonial added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add testimonial')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a testimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Author name</Label>
                <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={authorRole} onValueChange={setAuthorRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              Add testimonial
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {(testimonials ?? []).map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div>
                <p className="text-sm italic">&ldquo;{t.message}&rdquo;</p>
                <p className="mt-2 text-sm font-medium">
                  {t.author_name} <span className="text-muted-foreground capitalize">— {t.author_role}</span>
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove.mutate(t.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DownloadsTab() {
  const { data: downloads, isLoading } = useWebsiteDownloads()
  const create = useCreateWebsiteDownload()
  const remove = useDeleteWebsiteDownload()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('prospectus')
  const [file, setFile] = useState<File | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !file) {
      toast.error('Title and file are required')
      return
    }
    create.mutate(
      { title: title.trim(), category: category as never, file },
      {
        onSuccess: () => {
          setTitle('')
          setFile(null)
          toast.success('Download added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add download')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a download</CardTitle>
          <CardDescription>Prospectus, admission form, fee structure, calendar, rules, uniform guide…</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['prospectus', 'admission_form', 'fee_structure', 'academic_calendar', 'school_rules', 'uniform_guide', 'other'].map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(downloads ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No downloads yet.
                  </TableCell>
                </TableRow>
              )}
              {(downloads ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <Download className="size-3.5 text-muted-foreground" /> {d.title}
                  </TableCell>
                  <TableCell className="capitalize">{d.category.replace('_', ' ')}</TableCell>
                  <TableCell>{d.download_count}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(d.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Fixed-set pattern, same shape as SectionsTab: one row per real SchoolClass,
 * merged server-side so every class shows up here even before it has a
 * settings row yet (a not-yet-saved row has no `id`, so local state is keyed
 * by the stable `school_class_id` instead).
 */
function AdmissionClassesTab() {
  const { data: classes, isLoading } = useWebsiteAdmissionClasses()
  const update = useUpdateWebsiteAdmissionClasses()
  const [local, setLocal] = useState<WebsiteAdmissionClass[]>([])

  useEffect(() => {
    if (classes) setLocal(classes)
  }, [classes])

  function patch(schoolClassId: string, changes: Partial<WebsiteAdmissionClass>) {
    setLocal((prev) => prev.map((c) => (c.school_class_id === schoolClassId ? { ...c, ...changes } : c)))
  }

  function save() {
    update.mutate(
      local.map((c, i) => ({
        school_class_id: c.school_class_id,
        summary: c.summary,
        requirements: c.requirements,
        is_visible: c.is_visible,
        sort_order: i,
      })),
      {
        onSuccess: () => toast.success('Admission classes saved'),
        onError: (error) => toast.error(errorMessage(error, 'Could not save admission classes')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Admission by class</CardTitle>
          <CardDescription>Shown in the public site's Admission dropdown &amp; page</CardDescription>
        </div>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save all'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {local.length === 0 && <p className="text-sm text-muted-foreground">No classes found — set up classes first.</p>}
        {local.map((c) => (
          <div key={c.school_class_id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{c.class_name ?? 'Class'}</p>
              <Button variant="ghost" size="icon" onClick={() => patch(c.school_class_id, { is_visible: !c.is_visible })}>
                {c.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
              </Button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Summary (short teaser)</Label>
                <Input
                  value={c.summary ?? ''}
                  onChange={(e) => patch(c.school_class_id, { summary: e.target.value })}
                  placeholder="e.g. Ages 6-7, foundational literacy & numeracy"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Full requirements</Label>
                <Textarea rows={2} value={c.requirements ?? ''} onChange={(e) => patch(c.school_class_id, { requirements: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** Same fixed-set pattern as AdmissionClassesTab, one row per real Department. */
function AcademicDepartmentsTab() {
  const { data: departments, isLoading } = useWebsiteAcademicDepartments()
  const update = useUpdateWebsiteAcademicDepartments()
  const [local, setLocal] = useState<WebsiteAcademicDepartment[]>([])

  useEffect(() => {
    if (departments) setLocal(departments)
  }, [departments])

  function patch(departmentId: string, changes: Partial<WebsiteAcademicDepartment>) {
    setLocal((prev) => prev.map((d) => (d.department_id === departmentId ? { ...d, ...changes } : d)))
  }

  function save() {
    update.mutate(
      local.map((d, i) => ({
        department_id: d.department_id,
        public_description: d.public_description,
        is_visible: d.is_visible,
        sort_order: i,
      })),
      {
        onSuccess: () => toast.success('Academic disciplines saved'),
        onError: (error) => toast.error(errorMessage(error, 'Could not save academic disciplines')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Academic disciplines</CardTitle>
          <CardDescription>Shown in the public site's Academic Disciplines dropdown &amp; page</CardDescription>
        </div>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save all'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {local.length === 0 && <p className="text-sm text-muted-foreground">No departments found — set up departments first.</p>}
        {local.map((d) => (
          <div key={d.department_id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{d.department_name ?? 'Department'}</p>
                {d.subjects && d.subjects.length > 0 && (
                  <p className="text-xs text-muted-foreground">{d.subjects.join(', ')}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => patch(d.department_id, { is_visible: !d.is_visible })}>
                {d.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
              </Button>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Public description</Label>
              <Textarea rows={2} value={d.public_description ?? ''} onChange={(e) => patch(d.department_id, { public_description: e.target.value })} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LeadershipTab() {
  const { data: members, isLoading } = useWebsiteLeadership()
  const create = useCreateWebsiteLeadership()
  const remove = useDeleteWebsiteLeadership()
  const [name, setName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !roleTitle.trim()) return
    create.mutate(
      { name: name.trim(), role_title: roleTitle.trim(), bio: bio.trim() || undefined, photo: photo ?? undefined },
      {
        onSuccess: () => {
          setName('')
          setRoleTitle('')
          setBio('')
          setPhoto(null)
          toast.success('Leadership member added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add member')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a leadership member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Role / title</Label>
              <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Headmistress" />
            </div>
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label>Bio (optional)</Label>
              <Input value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leadership-photo" className="cursor-pointer text-sm font-medium text-primary">
                {photo ? photo.name : 'Add photo'}
              </Label>
              <Input id="leadership-photo" type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(members ?? []).map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div className="flex items-start gap-3">
                {m.photo_url && <img src={m.photo_url} alt={m.name} className="size-12 rounded-full object-cover" />}
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.role_title}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove.mutate(m.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PoliciesTab() {
  const { data: policies, isLoading } = useWebsitePolicies()
  const create = useCreateWebsitePolicy()
  const remove = useDeleteWebsitePolicy()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [document, setDocument] = useState<File | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate(
      { title: title.trim(), content: content.trim(), document: document ?? undefined },
      {
        onSuccess: () => {
          setTitle('')
          setContent('')
          setDocument(null)
          toast.success('Policy added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add policy')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-64 flex-1 space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Uniform Policy" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="policy-document" className="cursor-pointer text-sm font-medium text-primary">
                  {document ? document.name : 'Attach document (optional)'}
                </Label>
                <Input id="policy-document" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setDocument(e.target.files?.[0] ?? null)} />
              </div>
              <Button type="submit" disabled={create.isPending}>
                Add
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(policies ?? []).map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div>
                <p className="font-medium">{p.title}</p>
                {p.content && <p className="line-clamp-2 text-sm text-muted-foreground">{p.content}</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove.mutate(p.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SportsTab() {
  const { data: programs, isLoading: programsLoading } = useWebsiteSportsPrograms()
  const createProgram = useCreateWebsiteSportsProgram()
  const removeProgram = useDeleteWebsiteSportsProgram()
  const [name, setName] = useState('')
  const [schedule, setSchedule] = useState('')
  const [description, setDescription] = useState('')

  const { data: media, isLoading: mediaLoading } = useWebsiteSportsMedia()
  const createMedia = useCreateWebsiteSportsMedia()
  const removeMedia = useDeleteWebsiteSportsMedia()

  function submitProgram(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createProgram.mutate(
      { name: name.trim(), schedule: schedule.trim() || undefined, description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('')
          setSchedule('')
          setDescription('')
          toast.success('Sports program added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add program')),
      }
    )
  }

  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    createMedia.mutate(
      { media_type: file.type.startsWith('video') ? 'video' : 'image', file },
      { onError: (error) => toast.error(errorMessage(error, 'Could not upload media')) }
    )
    e.target.value = ''
  }

  if (programsLoading || mediaLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a sports program</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitProgram} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Football Team" />
            </div>
            <div className="space-y-1.5">
              <Label>Schedule (optional)</Label>
              <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Tue & Thu, 4-5pm" />
            </div>
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" disabled={createProgram.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(programs ?? []).map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div>
                <p className="font-medium">{p.name}</p>
                {p.schedule && <p className="text-xs text-muted-foreground">{p.schedule}</p>}
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeProgram.mutate(p.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Photos &amp; videos</CardTitle>
            <CardDescription>Shown in the public Sport &amp; Games gallery</CardDescription>
          </div>
          <div>
            <Label htmlFor="sports-media-upload" className="cursor-pointer text-sm font-medium text-primary">
              Add photo/video
            </Label>
            <Input id="sports-media-upload" type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {(media ?? []).length === 0 && <p className="text-sm text-muted-foreground">No photos or videos yet.</p>}
          {(media ?? []).map((m) => (
            <div key={m.id} className="relative w-40 rounded-lg border p-2">
              {m.media_type === 'video' ? (
                <video src={m.file_url ?? ''} className="mb-2 h-24 w-full rounded object-cover" muted />
              ) : (
                <img src={m.file_url ?? ''} alt={m.caption ?? ''} className="mb-2 h-24 w-full rounded object-cover" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs capitalize text-muted-foreground">{m.media_type}</span>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeMedia.mutate(m.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function OfficesTab() {
  const { data: offices, isLoading } = useWebsiteOffices()
  const create = useCreateWebsiteOffice()
  const remove = useDeleteWebsiteOffice()
  const [name, setName] = useState('')
  const [directorateHead, setDirectorateHead] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      {
        name: name.trim(),
        directorate_head: directorateHead.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('')
          setDirectorateHead('')
          setEmail('')
          setPhone('')
          toast.success('Office added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add office')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add an office / directorate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Directorate of Academics" />
            </div>
            <div className="space-y-1.5">
              <Label>Head (optional)</Label>
              <Input value={directorateHead} onChange={(e) => setDirectorateHead(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(offices ?? []).map((o) => (
          <Card key={o.id}>
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div>
                <p className="font-medium">{o.name}</p>
                {o.directorate_head && <p className="text-sm text-muted-foreground">{o.directorate_head}</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove.mutate(o.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ResearchProjectsTab() {
  const { data: items, isLoading } = useWebsiteResearchProjects()
  const create = useCreateWebsiteResearchProject()
  const remove = useDeleteWebsiteResearchProject()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<WebsiteResearchProject['category']>('research')
  const [description, setDescription] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate(
      { title: title.trim(), category, description: description.trim() || undefined },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
          toast.success(category === 'research' ? 'Research item added' : 'Project added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add item')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a research item or project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WebsiteResearchProject['category'])}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(items ?? []).map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs capitalize text-muted-foreground">{item.category}</p>
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove.mutate(item.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CalendarTab() {
  const { data: events, isLoading } = useWebsiteCalendarEvents()
  const create = useCreateWebsiteCalendarEvent()
  const remove = useDeleteWebsiteCalendarEvent()
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('academic')
  const [startDate, setStartDate] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !startDate) return
    create.mutate(
      { title: title.trim(), event_type: eventType as never, start_date: startDate },
      {
        onSuccess: () => {
          setTitle('')
          setStartDate('')
          toast.success('Event added')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not add event')),
      }
    )
  }

  if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a calendar event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['academic', 'sports_day', 'parents_day', 'graduation', 'exam', 'holiday'].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(events ?? []).map((ev) => (
          <div key={ev.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="font-medium">{ev.title}</p>
              <p className="text-xs text-muted-foreground">
                {ev.start_date} · <span className="capitalize">{ev.event_type.replace('_', ' ')}</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(ev.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsTab() {
  const { data: news, isLoading } = useWebsiteNews()
  const update = useUpdateWebsiteNews()

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public news</CardTitle>
        <CardDescription>
          Announcements appear here automatically when you check "Publish Public" while creating one in Communication →
          Announcements. Feature the ones you want highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(news ?? []).length === 0 && <p className="text-sm text-muted-foreground">No public announcements yet.</p>}
        <div className="space-y-2">
          {(news ?? []).map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="font-medium">{n.announcement.title}</p>
                <p className="text-xs text-muted-foreground">{n.announcement.published_at?.slice(0, 10)}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Switch
                  size="sm"
                  checked={n.is_featured}
                  onCheckedChange={(checked) => update.mutate({ id: n.id, payload: { is_featured: checked } })}
                />
                Featured
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsTab() {
  const { data, isLoading } = useWebsiteAnalyticsSummary()

  if (isLoading || !data) return <Skeleton className="h-80 w-full rounded-2xl" />

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Page views (30d)', value: data.page_views },
          { label: 'Section views', value: data.section_views },
          { label: 'Downloads', value: data.downloads },
          { label: 'Admission clicks', value: data.admission_clicks },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Most-viewed sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.top_sections.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
          {data.top_sections.map((s) => (
            <div key={s.section_key} className="flex items-center justify-between text-sm">
              <span className="capitalize">{s.section_key}</span>
              <span className="text-muted-foreground">{s.total}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function WebsiteBuilderPage() {
  const { data: school, isLoading } = useSchoolProfile()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display flex items-center gap-2.5 text-2xl font-semibold">
            <span className="bg-gradient-brand flex size-9 items-center justify-center rounded-xl text-white shadow-lg shadow-primary/25">
              <Globe className="size-4.5" />
            </span>
            Website Builder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your school's public marketing website — separate from School Settings.</p>
        </div>
        {school?.slug && school.website_access_status === 'active' && (
          <Button variant="outline" asChild>
            <a href={`/site/${school.slug}`} target="_blank" rel="noreferrer">
              View public site
            </a>
          </Button>
        )}
      </div>

      {isLoading || !school ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : school.website_access_status !== 'active' ? (
        <WebsiteAccessLockedNotice status={school.website_access_status} reason={school.website_suspension_reason} />
      ) : (
        <Tabs defaultValue="homepage">
          <div className="overflow-x-auto">
            <TabsList>
              <TabsTrigger value="homepage">Homepage</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="facilities">Facilities</TabsTrigger>
              <TabsTrigger value="gallery" className="gap-1"><ImageIcon className="size-3.5" />Gallery</TabsTrigger>
              <TabsTrigger value="banners">Banners</TabsTrigger>
              <TabsTrigger value="news" className="gap-1"><Newspaper className="size-3.5" />News</TabsTrigger>
              <TabsTrigger value="admissions">Admissions</TabsTrigger>
              <TabsTrigger value="admission-classes" className="gap-1"><GraduationCap className="size-3.5" />Admission Classes</TabsTrigger>
              <TabsTrigger value="academic-departments" className="gap-1"><Users className="size-3.5" />Academic Disciplines</TabsTrigger>
              <TabsTrigger value="leadership" className="gap-1"><Users className="size-3.5" />Leadership</TabsTrigger>
              <TabsTrigger value="policies" className="gap-1"><FileText className="size-3.5" />Policies</TabsTrigger>
              <TabsTrigger value="sports" className="gap-1"><Trophy className="size-3.5" />Sport & Games</TabsTrigger>
              <TabsTrigger value="offices" className="gap-1"><Building2 className="size-3.5" />Offices</TabsTrigger>
              <TabsTrigger value="research-projects" className="gap-1"><Lightbulb className="size-3.5" />Research & Projects</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
              <TabsTrigger value="theme" className="gap-1"><Palette className="size-3.5" />Theme</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1"><Search className="size-3.5" />SEO</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1"><Sparkles className="size-3.5" />Analytics</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1"><SettingsIcon className="size-3.5" />Settings</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="homepage" className="mt-4"><HomepageTab /></TabsContent>
          <TabsContent value="sections" className="mt-4"><SectionsTab /></TabsContent>
          <TabsContent value="facilities" className="mt-4"><FacilitiesTab /></TabsContent>
          <TabsContent value="gallery" className="mt-4"><GalleryTab /></TabsContent>
          <TabsContent value="banners" className="mt-4"><BannersTab /></TabsContent>
          <TabsContent value="news" className="mt-4"><NewsTab /></TabsContent>
          <TabsContent value="admissions" className="mt-4"><AdmissionsTab /></TabsContent>
          <TabsContent value="admission-classes" className="mt-4"><AdmissionClassesTab /></TabsContent>
          <TabsContent value="academic-departments" className="mt-4"><AcademicDepartmentsTab /></TabsContent>
          <TabsContent value="leadership" className="mt-4"><LeadershipTab /></TabsContent>
          <TabsContent value="policies" className="mt-4"><PoliciesTab /></TabsContent>
          <TabsContent value="sports" className="mt-4"><SportsTab /></TabsContent>
          <TabsContent value="offices" className="mt-4"><OfficesTab /></TabsContent>
          <TabsContent value="research-projects" className="mt-4"><ResearchProjectsTab /></TabsContent>
          <TabsContent value="calendar" className="mt-4"><CalendarTab /></TabsContent>
          <TabsContent value="downloads" className="mt-4"><DownloadsTab /></TabsContent>
          <TabsContent value="testimonials" className="mt-4"><TestimonialsTab /></TabsContent>
          <TabsContent value="theme" className="mt-4"><ThemeTab /></TabsContent>
          <TabsContent value="seo" className="mt-4"><SeoTab /></TabsContent>
          <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        </Tabs>
      )}
    </div>
  )
}
