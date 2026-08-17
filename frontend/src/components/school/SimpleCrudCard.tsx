import { useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { MoreHorizontal } from 'lucide-react'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export interface FieldDef {
  name: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'switch' | 'select' | 'combobox' | 'date'
  placeholder?: string
  options?: { value: string; label: string; sublabel?: string }[]
}

export interface ColumnDef<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
}

/**
 * The caller builds its own useForm<TConcrete>() (with its own zodResolver
 * call) and passes it in — keeping that concrete typing at each call site
 * sidesteps fighting zod v4 + RHF's generic resolver inference inside a
 * shared component. The same form instance backs both the create and edit
 * dialogs (only one is ever open at a time); it's reset to the item's
 * current values on edit and back to defaultValues whenever "New" reopens.
 */
interface SimpleCrudCardProps<T extends { id: string }> {
  title: string
  description?: string
  items: T[] | undefined
  isLoading: boolean
  columns: ColumnDef<T>[]
  fields: FieldDef[]
  form: UseFormReturn<FieldValues>
  defaultValues: FieldValues
  onCreate: (values: FieldValues) => Promise<unknown>
  onEdit?: (item: T, values: FieldValues) => Promise<unknown>
  /** Maps an item to the edit form's initial values — required if onEdit is set. */
  toFormValues?: (item: T) => FieldValues
  onDelete?: (item: T) => Promise<unknown>
  createLabel?: string
  editLabel?: string
  /** When set, `?new=<quickAddKey>` in the URL auto-opens the create dialog. */
  quickAddKey?: string
}

export function SimpleCrudCard<T extends { id: string }>({
  title,
  description,
  items,
  isLoading,
  columns,
  fields,
  form,
  defaultValues,
  onCreate,
  onEdit,
  toFormValues,
  onDelete,
  createLabel = 'New',
  editLabel,
  quickAddKey,
}: SimpleCrudCardProps<T>) {
  const [open, setOpen] = useQuickAddTrigger(quickAddKey ?? '__unused__')
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<T | null>(null)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  async function handleSubmit(values: FieldValues) {
    setSubmitting(true)
    try {
      await onCreate(values)
      toast.success(`${title.replace(/s$/, '')} created`)
      form.reset(defaultValues)
      setOpen(false)
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message ?? 'Something went wrong')
        : 'Something went wrong'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(item: T) {
    form.reset(toFormValues ? toFormValues(item) : (item as unknown as FieldValues))
    setEditingItem(item)
  }

  async function handleEditSubmit(values: FieldValues) {
    if (!editingItem || !onEdit) return
    setEditSubmitting(true)
    try {
      await onEdit(editingItem, values)
      toast.success(`${title.replace(/s$/, '')} updated`)
      setEditingItem(null)
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message ?? 'Something went wrong')
        : 'Something went wrong'
      toast.error(message)
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDelete(item: T) {
    if (!onDelete) return
    try {
      await onDelete(item)
      toast.success('Deleted')
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message ?? 'Could not delete')
        : 'Something went wrong'
      toast.error(message)
    } finally {
      setPendingDelete(null)
    }
  }

  function renderFields() {
    return fields.map((field) => (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: rhf }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === 'textarea' ? (
                <Textarea placeholder={field.placeholder} {...rhf} value={rhf.value ?? ''} />
              ) : field.type === 'switch' ? (
                <Switch checked={Boolean(rhf.value)} onCheckedChange={rhf.onChange} />
              ) : field.type === 'select' ? (
                <Select onValueChange={rhf.onChange} value={rhf.value ?? ''}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'combobox' ? (
                <Combobox
                  options={field.options ?? []}
                  value={rhf.value ?? ''}
                  onChange={rhf.onChange}
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                  placeholder={field.placeholder}
                  {...rhf}
                  value={rhf.value ?? ''}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (next) form.reset(defaultValues)
            setOpen(next)
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">{createLabel}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createLabel}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {renderFields()}
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
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
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              {(onDelete || onEdit) && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items?.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                  Nothing here yet.
                </TableCell>
              </TableRow>
            )}
            {items?.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.render(item)}</TableCell>
                ))}
                {(onDelete || onEdit) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => openEdit(item)}>Edit</DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setPendingDelete(item)}
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={editingItem !== null} onOpenChange={(next) => !next && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editLabel ?? `Edit ${title.replace(/s$/, '').toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              {renderFields()}
              <DialogFooter>
                <Button type="submit" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete this ${title.replace(/s$/, '').toLowerCase()}?`}
        description="This can't be undone."
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </Card>
  )
}
