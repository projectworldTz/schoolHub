import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useActivateAccount } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const activateSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    password_confirmation: z.string().min(8, 'At least 8 characters'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type ActivateFormValues = z.infer<typeof activateSchema>

export function ActivateAccountPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const activateMutation = useActivateAccount()

  const form = useForm<ActivateFormValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: { password: '', password_confirmation: '' },
  })

  function onSubmit(values: ActivateFormValues) {
    activateMutation.mutate(
      { email, token, password: values.password },
      {
        onSuccess: (user) => {
          toast.success(`Welcome, ${user.name}`)
          navigate('/')
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.errors?.token?.[0] ?? error.response?.data?.message ?? 'Could not activate this account')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  const linkIsMissingParams = !email || !token

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Activate your account</CardTitle>
          <CardDescription>
            {linkIsMissingParams
              ? 'This activation link looks incomplete. Ask your platform administrator to resend it.'
              : `Set a password for ${email} to finish setting up your account.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={activateMutation.isPending || linkIsMissingParams}
              >
                {activateMutation.isPending ? 'Activating…' : 'Activate account'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
