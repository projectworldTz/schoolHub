import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useCreateSchool } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SCHOOL_TYPES = [
  'nursery',
  'primary',
  'secondary',
  'college',
  'university',
  'vocational',
  'other',
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
  owner_name: z.string().min(2, 'Owner name is required'),
  owner_email: z.string().email('Enter a valid email'),
  owner_password: z.string().min(8, 'At least 8 characters'),
})

type CreateSchoolFormValues = z.infer<typeof createSchoolSchema>

export function CreateSchoolDialog() {
  const [open, setOpen] = useState(false)
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
      owner_name: '',
      owner_email: '',
      owner_password: '',
    },
  })

  function onSubmit(values: CreateSchoolFormValues) {
    createSchool.mutate(values, {
      onSuccess: () => {
        toast.success('School registered')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not register school')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Register school</Button>
      </DialogTrigger>
      <DialogContent>
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
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium">School Owner account</p>
              <p className="text-muted-foreground text-sm">
                Creates the school's first login. There's no invite-email flow yet — share this
                password with the owner directly.
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
                name="owner_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
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
      </DialogContent>
    </Dialog>
  )
}
