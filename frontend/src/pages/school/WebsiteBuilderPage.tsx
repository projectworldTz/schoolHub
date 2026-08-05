import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Lock,
  Newspaper,
  Palette,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
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
import { useSchoolProfile } from '@/hooks/useSchoolSetup'
import { cn } from '@/lib/utils'
import {
  useAddWebsiteGalleryImage,
  useCreateWebsiteBanner,
  useCreateWebsiteCalendarEvent,
  useCreateWebsiteDownload,
  useCreateWebsiteFacility,
  useCreateWebsiteGalleryAlbum,
  useCreateWebsiteTestimonial,
  useDeleteWebsiteBanner,
  useDeleteWebsiteCalendarEvent,
  useDeleteWebsiteDownload,
  useDeleteWebsiteFacility,
  useDeleteWebsiteGalleryAlbum,
  useDeleteWebsiteGalleryImage,
  useDeleteWebsiteTestimonial,
  useUpdateWebsiteBanner,
  useUpdateWebsiteNews,
  useUpdateWebsiteSections,
  useUpdateWebsiteSettings,
  useUploadWebsiteHeroMedia,
  useWebsiteAnalyticsSummary,
  useWebsiteBanners,
  useWebsiteCalendarEvents,
  useWebsiteDownloads,
  useWebsiteFacilities,
  useWebsiteGalleryAlbums,
  useWebsiteNews,
  useWebsiteSections,
  useWebsiteSettings,
  useWebsiteTestimonials,
} from '@/hooks/useWebsiteBuilder'
import type { WebsiteSection, WebsiteSectionKey, WebsiteSettingsPayload, WebsiteThemeKey } from '@/types/websiteBuilder'

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

function GalleryTab() {
  const { data: albums, isLoading } = useWebsiteGalleryAlbums()
  const createAlbum = useCreateWebsiteGalleryAlbum()
  const deleteAlbum = useDeleteWebsiteGalleryAlbum()
  const addImage = useAddWebsiteGalleryImage()
  const deleteImage = useDeleteWebsiteGalleryImage()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('campus')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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

  function handleImageUpload(albumId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    addImage.mutate(
      { albumId, file },
      { onError: (error) => toast.error(errorMessage(error, 'Could not upload image')) }
    )
    e.target.value = ''
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
              <Input id={`upload-${album.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(album.id, e)} />
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(album.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {(album.images ?? []).length === 0 && <p className="text-sm text-muted-foreground">No photos yet.</p>}
            {(album.images ?? []).map((image) => (
              <div key={image.id} className="group relative">
                <img src={image.image_url ?? ''} alt={image.caption ?? ''} className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => deleteImage.mutate(image.id)}
                  className="absolute -right-1.5 -top-1.5 hidden size-5 items-center justify-center rounded-full bg-destructive text-white group-hover:flex"
                >
                  ×
                </button>
              </div>
            ))}
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
