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

export interface FieldDef {
  name: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'switch' | 'select' | 'date'
  placeholder?: string
  options?: { value: string; label: string }[]
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
 * shared component.
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
  onDelete?: (item: T) => Promise<unknown>
  createLabel?: string
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
  onDelete,
  createLabel = 'New',
  quickAddKey,
}: SimpleCrudCardProps<T>) {
  const [open, setOpen] = useQuickAddTrigger(quickAddKey ?? '__unused__')
  const [submitting, setSubmitting] = useState(false)

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
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">{createLabel}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createLabel}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {fields.map((field) => (
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
                            <Select onValueChange={rhf.onChange} defaultValue={rhf.value}>
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
                ))}
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
              {onDelete && <TableHead className="w-12" />}
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
                {onDelete && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
