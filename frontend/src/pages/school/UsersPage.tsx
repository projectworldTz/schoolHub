import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Check, Copy, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useAddSchoolUserEmail,
  useAvailableRoles,
  useCreateSchoolUser,
  useDeleteSchoolUser,
  useSchoolUsers,
  useUpdateSchoolUser,
  useUsedRoles,
} from '@/hooks/useSchoolUsers'
import { useCurrentUser } from '@/hooks/useAuth'
import { TablePagination } from '@/components/school/TablePagination'
import type { User } from '@/types/auth'

const createUserSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    noEmail: z.boolean(),
    email: z.string().optional(),
    phone: z.string().optional(),
    roles: z.array(z.string()).min(1, 'Select at least one role'),
  })
  .superRefine((data, ctx) => {
    if (!data.noEmail && !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid email, or check "No email yet"',
        path: ['email'],
      })
    }
  })

type CreateUserForm = z.infer<typeof createUserSchema>

const createUserDefaults: CreateUserForm = { name: '', noEmail: false, email: '', phone: '', roles: [] }

/**
 * Shown once right after creating a no-email account — there's no
 * activation email to send, so this password (never persisted in
 * plaintext) is the only way the admin can hand the teacher a working
 * login. Same "shown once" pattern as the platform's school-owner
 * temporary password reveal.
 */
function TemporaryPasswordReveal({ user, onDone }: { user: User; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const temporaryPassword = user.temporary_password ?? ''

  async function handleCopy() {
    await navigator.clipboard.writeText(temporaryPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{user.name}'s account is ready</DialogTitle>
        <DialogDescription>
          This account has no email yet, so there's no activation link to send. Share this temporary password
          with {user.name} directly. Copy it now — for security, it won't be shown again. They'll be required
          to set their own password the first time they sign in. Once they have an email, use "Add email" on
          their row to send a normal activation link.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
        <code className="flex-1 break-all text-sm">{temporaryPassword}</code>
        <Button size="icon" variant="ghost" onClick={handleCopy} type="button">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </>
  )
}

function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [createdUser, setCreatedUser] = useState<User | null>(null)
  const { data: roles } = useAvailableRoles()
  const createUser = useCreateSchoolUser()

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: createUserDefaults,
  })

  const noEmail = form.watch('noEmail')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setCreatedUser(null)
  }

  function onSubmit(values: CreateUserForm) {
    createUser.mutate(
      {
        name: values.name,
        email: values.noEmail ? undefined : values.email,
        phone: values.phone || undefined,
        roles: values.roles,
      },
      {
        onSuccess: (user) => {
          form.reset(createUserDefaults)
          if (user.temporary_password) {
            setCreatedUser(user)
          } else {
            toast.success('User created — an activation email has been sent')
            setOpen(false)
          }
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not create user')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">New user</Button>
      </DialogTrigger>
      <DialogContent>
        {createdUser ? (
          <TemporaryPasswordReveal user={createdUser} onDone={() => handleOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>New user</DialogTitle>
              <DialogDescription>
                They'll get an email to set their own password — no password to set here.
              </DialogDescription>
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={noEmail}
                    onCheckedChange={(checked) => {
                      form.setValue('noEmail', Boolean(checked))
                      form.clearErrors('email')
                    }}
                  />
                  No email yet (they'll get a temporary password instead)
                </label>
                {!noEmail && (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel>
                      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                        {roles?.map((role) => (
                          <label key={role} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={field.value.includes(role)}
                              onCheckedChange={(checked) => {
                                field.onChange(
                                  checked ? [...field.value, role] : field.value.filter((r) => r !== role)
                                )
                              }}
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? 'Creating…' : 'Create user'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

const editRolesSchema = z.object({
  roles: z.array(z.string()).min(1, 'Select at least one role'),
})

type EditRolesForm = z.infer<typeof editRolesSchema>

function EditRolesDialog({
  user,
  onOpenChange,
}: {
  user: User
  onOpenChange: (open: boolean) => void
}) {
  const { data: roles } = useAvailableRoles()
  const updateUser = useUpdateSchoolUser()

  const form = useForm<EditRolesForm>({
    resolver: zodResolver(editRolesSchema),
    defaultValues: { roles: user.roles },
  })

  function onSubmit(values: EditRolesForm) {
    updateUser.mutate(
      { id: user.id, payload: { roles: values.roles } },
      {
        onSuccess: () => {
          toast.success('Roles updated')
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update roles')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit roles — {user.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                    {roles?.map((role) => (
                      <label key={role} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(role)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked ? [...field.value, role] : field.value.filter((r) => r !== role)
                            )
                          }}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const editDetailsSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
})

type EditDetailsForm = z.infer<typeof editDetailsSchema>

function EditDetailsDialog({
  user,
  onOpenChange,
}: {
  user: User
  onOpenChange: (open: boolean) => void
}) {
  const updateUser = useUpdateSchoolUser()

  const form = useForm<EditDetailsForm>({
    resolver: zodResolver(editDetailsSchema),
    defaultValues: { name: user.name, email: user.email, phone: user.phone ?? '' },
  })

  function onSubmit(values: EditDetailsForm) {
    updateUser.mutate(
      { id: user.id, payload: { ...values, phone: values.phone || undefined } },
      {
        onSuccess: () => {
          toast.success('User details updated')
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update user details')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit details — {user.name}</DialogTitle>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const addEmailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

type AddEmailForm = z.infer<typeof addEmailSchema>

/**
 * Upgrades a no-email account to a real one — clears the placeholder flag
 * server-side and sends the same activation email a brand-new user gets,
 * since this is effectively the teacher's first real chance to set their
 * own password.
 */
function AddEmailDialog({
  user,
  onOpenChange,
}: {
  user: User
  onOpenChange: (open: boolean) => void
}) {
  const addEmail = useAddSchoolUserEmail()

  const form = useForm<AddEmailForm>({
    resolver: zodResolver(addEmailSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: AddEmailForm) {
    addEmail.mutate(
      { id: user.id, email: values.email },
      {
        onSuccess: () => {
          toast.success('Email added — an activation email has been sent')
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not add email')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add email — {user.name}</DialogTitle>
          <DialogDescription>
            They'll get an activation email to set their own password, same as a brand-new user.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={addEmail.isPending}>
                {addEmail.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const USERS_PER_PAGE = 100
const ALL_ROLES = '__all'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSchoolUsers({
    search: search || undefined,
    role: role || undefined,
    page,
    per_page: USERS_PER_PAGE,
  })
  const { data: usedRoles } = useUsedRoles()
  const { data: currentUser } = useCurrentUser()
  const updateUser = useUpdateSchoolUser()
  const deleteUser = useDeleteSchoolUser()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingRolesUser, setEditingRolesUser] = useState<User | null>(null)
  const [editingDetailsUser, setEditingDetailsUser] = useState<User | null>(null)
  const [addingEmailUser, setAddingEmailUser] = useState<User | null>(null)

  function handleSearchChange(next: string) {
    setSearch(next)
    setPage(1)
  }

  function handleRoleChange(next: string) {
    setRole(next === ALL_ROLES ? '' : next)
    setPage(1)
  }

  function toggleActive(userId: string, isActive: boolean) {
    updateUser.mutate(
      { id: userId, payload: { is_active: !isActive } },
      {
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update user')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  function handleDelete(userId: string) {
    deleteUser.mutate(userId, {
      onSuccess: () => toast.success('User removed'),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not remove user')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users & Roles</h1>
          <p className="text-sm text-muted-foreground">Staff accounts for this school.</p>
        </div>
        <CreateUserDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap gap-3">
              <Input
                placeholder="Search by name…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-xs"
              />
              <Select value={role || ALL_ROLES} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ROLES}>All roles</SelectItem>
                  {usedRoles?.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((user, index) => {
                // Only the School Owner can suspend/remove the School Owner
                // account — everyone else (Manager included) gets those
                // actions hidden here, mirrored by a 403 in
                // SchoolUserController if bypassed via direct API call.
                const targetIsOwnerLockedForActor =
                  user.roles.includes('School Owner') && !currentUser?.roles.includes('School Owner')

                return (
                  <TableRow key={user.id}>
                    <TableCell className="text-muted-foreground">
                      {(data.meta.current_page - 1) * data.meta.per_page + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      {user.has_placeholder_email ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          No email
                        </Badge>
                      ) : (
                        user.email
                      )}
                    </TableCell>
                    <TableCell className="space-x-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'outline'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingDetailsUser(user)}>
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingRolesUser(user)}>
                            Edit roles
                          </DropdownMenuItem>
                          {user.has_placeholder_email && (
                            <DropdownMenuItem onClick={() => setAddingEmailUser(user)}>
                              Add email
                            </DropdownMenuItem>
                          )}
                          {!targetIsOwnerLockedForActor && (
                            <DropdownMenuItem onClick={() => toggleActive(user.id, user.is_active)}>
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          )}
                          {user.id !== currentUser?.id && !targetIsOwnerLockedForActor && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setPendingDeleteId(user.id)}
                            >
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {data && (
            <TablePagination
              page={data.meta.current_page}
              totalPages={data.meta.last_page}
              totalItems={data.meta.total}
              pageSize={data.meta.per_page}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
      {editingDetailsUser && (
        <EditDetailsDialog
          user={editingDetailsUser}
          onOpenChange={(open) => !open && setEditingDetailsUser(null)}
        />
      )}
      {editingRolesUser && (
        <EditRolesDialog
          user={editingRolesUser}
          onOpenChange={(open) => !open && setEditingRolesUser(null)}
        />
      )}
      {addingEmailUser && (
        <AddEmailDialog
          user={addingEmailUser}
          onOpenChange={(open) => !open && setAddingEmailUser(null)}
        />
      )}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Remove this user's account?"
        description="This can't be undone."
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}
