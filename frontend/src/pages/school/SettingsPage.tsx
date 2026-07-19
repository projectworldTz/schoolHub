import { useState } from 'react'
import { z } from 'zod'
import { useEffect } from 'react'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Check, Copy, MoreHorizontal } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import {
  useBranches,
  useDepartments,
  useSchoolProfile,
  useUpdateSchoolProfile,
} from '@/hooks/useSchoolSetup'
import { useApiTokens, useCreateApiToken, useDeleteApiToken } from '@/hooks/useApiTokens'
import type { Branch, Department } from '@/types/school-setup'
import type { CreatedApiToken } from '@/types/apiTokens'

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().length(2).optional().or(z.literal('')),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional().or(z.literal('')),
})

function ProfileTab() {
  const { data: school, isLoading } = useSchoolProfile()
  const updateProfile = useUpdateSchoolProfile()

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '', address: '', city: '', country: '', timezone: '', currency: '' },
  })

  useEffect(() => {
    if (school) {
      form.reset({
        name: school.name,
        email: school.email ?? '',
        phone: school.phone ?? '',
        address: school.address ?? '',
        city: school.city ?? '',
        country: school.country ?? '',
        timezone: school.timezone ?? '',
        currency: school.currency ?? '',
      })
    }
  }, [school, form])

  function onSubmit(values: z.infer<typeof profileSchema>) {
    updateProfile.mutate(values, {
      onSuccess: () => toast.success('School profile updated'),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not update profile')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Profile</CardTitle>
        <CardDescription>Basic information shown across the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input maxLength={2} placeholder="TZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input maxLength={3} placeholder="TZS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

const branchSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  is_main: z.boolean().default(false),
})

const branchDefaults = { name: '', address: '', city: '', phone: '', is_main: false }

function BranchesTab() {
  const { useList, useCreate, useRemove } = useBranches
  const { data, isLoading } = useList()
  const create = useCreate()
  const remove = useRemove()
  const form = useForm({ resolver: zodResolver(branchSchema), defaultValues: branchDefaults })

  const columns: ColumnDef<Branch>[] = [
    { key: 'name', label: 'Name', render: (b) => b.name },
    { key: 'city', label: 'City', render: (b) => b.city ?? '—' },
    { key: 'is_main', label: 'Main', render: (b) => (b.is_main ? 'Yes' : '') },
  ]

  return (
    <SimpleCrudCard
      title="Branches"
      description="Campuses or sites this school operates."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={branchDefaults}
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'address', label: 'Address', type: 'text' },
        { name: 'city', label: 'City', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'is_main', label: 'Main campus', type: 'switch' },
      ]}
      onCreate={(values) => create.mutateAsync(values)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New branch"
    />
  )
}

const departmentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().optional(),
})

const departmentDefaults = { name: '', code: '' }

function DepartmentsTab() {
  const { useList, useCreate, useRemove } = useDepartments
  const { data, isLoading } = useList()
  const create = useCreate()
  const remove = useRemove()
  const form = useForm({ resolver: zodResolver(departmentSchema), defaultValues: departmentDefaults })

  const columns: ColumnDef<Department>[] = [
    { key: 'name', label: 'Name', render: (d) => d.name },
    { key: 'code', label: 'Code', render: (d) => d.code ?? '—' },
    { key: 'head', label: 'Head', render: (d) => d.head_name ?? '—' },
  ]

  return (
    <SimpleCrudCard
      title="Departments"
      description="Academic departments (Sciences, Languages, ...)."
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={departmentDefaults}
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'code', label: 'Code', type: 'text' },
      ]}
      onCreate={(values) => create.mutateAsync(values)}
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New department"
    />
  )
}

const tokenSchema = z.object({
  name: z.string().min(1, 'Required'),
  scope: z.enum(['full-access', 'read-only']),
})

function RevealTokenDialog({ token, onClose }: { token: CreatedApiToken | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!token) return
    await navigator.clipboard.writeText(token.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={token !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API key created</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Copy this key now — for your security, it won't be shown again.
        </p>
        <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
          <code className="flex-1 break-all text-xs">{token?.token}</code>
          <Button size="icon" variant="ghost" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ApiTokensTab() {
  const [open, setOpen] = useState(false)
  const [revealedToken, setRevealedToken] = useState<CreatedApiToken | null>(null)
  const { data: tokens, isLoading } = useApiTokens()
  const create = useCreateApiToken()
  const remove = useDeleteApiToken()
  const form = useForm({
    resolver: zodResolver(tokenSchema),
    defaultValues: { name: '', scope: 'full-access' as const },
  })

  function onSubmit(values: z.infer<typeof tokenSchema>) {
    create.mutate(
      { name: values.name, abilities: values.scope === 'read-only' ? 'read-only' : undefined },
      {
        onSuccess: (created) => {
          form.reset()
          setOpen(false)
          setRevealedToken(created)
        },
        onError: (error) => {
          const message = isAxiosError(error) ? (error.response?.data?.message ?? 'Could not create key') : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  async function handleDelete(id: number) {
    try {
      await remove.mutateAsync(id)
      toast.success('API key revoked')
    } catch {
      toast.error('Could not revoke key')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API keys</CardTitle>
          <CardDescription>
            Personal access tokens for the public API (<code>/api/v1/...</code>) — scripts, integrations, or the
            mobile app can authenticate with one instead of a session.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">New API key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New API key</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Reporting script" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-access">Full access — same as your account</SelectItem>
                          <SelectItem value="read-only">Read-only — GET requests only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? 'Creating…' : 'Create key'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && tokens?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No API keys yet.
                </TableCell>
              </TableRow>
            )}
            {tokens?.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>
                  <Badge variant={t.scope === 'full-access' ? 'secondary' : 'outline'}>{t.scope}</Badge>
                </TableCell>
                <TableCell>{t.last_used_at ? new Date(t.last_used_at).toLocaleString() : 'Never'}</TableCell>
                <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id)}>
                        Revoke
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <RevealTokenDialog token={revealedToken} onClose={() => setRevealedToken(null)} />
    </Card>
  )
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">School Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, branches, and departments.</p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="branches" className="mt-4">
          <BranchesTab />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="api-keys" className="mt-4">
          <ApiTokensTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
