import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Check, Copy } from 'lucide-react'
import { useCreateSchool } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { School } from '@/types/school'

const SCHOOL_TYPES = [
  'nursery',
  'primary',
  'secondary',
  'college',
  'university',
  'vocational',
  'other',
] as const

const LICENSE_DURATIONS = [
  { value: '1', label: '1 month' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' },
] as const

const createSchoolSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  type: z.enum(SCHOOL_TYPES),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  country: z.string().length(2, 'Use a 2-letter country code').optional().or(z.literal('')),
  subscription_plan: z.string().optional(),
  license_duration_months: z.enum(['1', '3', '6', '12']),
  owner_name: z.string().min(2, 'Owner name is required'),
  owner_email: z.string().email('Enter a valid email'),
  owner_phone: z.string().optional(),
})

type CreateSchoolFormValues = z.infer<typeof createSchoolSchema>

function TemporaryPasswordReveal({ school, onDone }: { school: School; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const temporaryPassword = school.owner?.temporary_password ?? ''

  async function handleCopy() {
    await navigator.clipboard.writeText(temporaryPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{school.name} is registered</DialogTitle>
        <DialogDescription>
          Share this temporary password with {school.owner?.name} directly (phone, WhatsApp, email — your
          choice). Copy it now — for security, it won't be shown again. They'll be required to set their own
          password the first time they sign in.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Email: <span className="font-medium text-foreground">{school.owner?.email}</span>
        </p>
        <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
          <code className="flex-1 break-all text-sm">{temporaryPassword}</code>
          <Button size="icon" variant="ghost" onClick={handleCopy} type="button">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </>
  )
}

export function CreateSchoolDialog() {
  const [open, setOpen] = useState(false)
  const [createdSchool, setCreatedSchool] = useState<School | null>(null)
  const createSchool = useCreateSchool()

  const form = useForm<CreateSchoolFormValues>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: 'secondary',
      email: '',
      city: '',
      country: 'TZ',
      subscription_plan: '',
      license_duration_months: '1',
      owner_name: '',
      owner_email: '',
      owner_phone: '',
    },
  })

  function onSubmit(values: CreateSchoolFormValues) {
    createSchool.mutate(
      { ...values, license_duration_months: Number(values.license_duration_months) as 1 | 3 | 6 | 12 },
      {
        onSuccess: (school) => {
          form.reset()
          setCreatedSchool(school)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not register school')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setCreatedSchool(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Register school</Button>
      </DialogTrigger>
      <DialogContent>
        {createdSchool ? (
          <TemporaryPasswordReveal school={createdSchool} onDone={() => handleOpenChange(false)} />
        ) : (
          <>
        <DialogHeader>
          <DialogTitle>Register a new school</DialogTitle>
        </DialogHeader>
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
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="st-josephs-secondary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SCHOOL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type[0].toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Country code</FormLabel>
                    <FormControl>
                      <Input maxLength={2} placeholder="TZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="subscription_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription plan</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Standard" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license_duration_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LICENSE_DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium">School Owner account</p>
              <p className="text-muted-foreground text-sm">
                Creates the school's first login with a one-time temporary password, shown to you once
                registration completes so you can relay it to the owner yourself.
              </p>
              <FormField
                control={form.control}
                name="owner_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createSchool.isPending}>
                {createSchool.isPending ? 'Registering…' : 'Register school'}
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
