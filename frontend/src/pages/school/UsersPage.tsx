import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { MoreHorizontal } from 'lucide-react'
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

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  roles: z.array(z.string()).min(1, 'Select at least one role'),
})

type CreateUserForm = z.infer<typeof createUserSchema>

function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const { data: roles } = useAvailableRoles()
  const createUser = useCreateSchoolUser()

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', phone: '', roles: [] },
  })

  function onSubmit(values: CreateUserForm) {
    createUser.mutate(
      { ...values, phone: values.phone || undefined },
      {
        onSuccess: () => {
          toast.success('User created — an activation email has been sent')
          form.reset({ name: '', email: '', phone: '', roles: [] })
          setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New user</Button>
      </DialogTrigger>
      <DialogContent>
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
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
                        <DropdownMenuItem onClick={() => toggleActive(user.id, user.is_active)}>
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        {user.id !== currentUser?.id && (
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
              ))}
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
