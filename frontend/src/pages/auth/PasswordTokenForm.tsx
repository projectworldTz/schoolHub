import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import type { UseMutationResult } from '@tanstack/react-query'
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
import type { User } from '@/types/auth'

const passwordTokenSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    password_confirmation: z.string().min(8, 'At least 8 characters'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type PasswordTokenFormValues = z.infer<typeof passwordTokenSchema>

interface PasswordTokenFormProps {
  title: string
  incompleteLinkMessage: string
  describe: (email: string) => string
  submitLabel: string
  pendingLabel: string
  successToast: (userName: string) => string
  mutation: UseMutationResult<User, unknown, { email: string; token: string; password: string }>
}

// Shared by ActivateAccountPage (a login that didn't exist yet) and
// ResetPasswordPage (an existing login, forgotten password) — same
// email+token+password redemption shape, different copy for the two contexts.
export function PasswordTokenForm({
  title,
  incompleteLinkMessage,
  describe,
  submitLabel,
  pendingLabel,
  successToast,
  mutation,
}: PasswordTokenFormProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const form = useForm<PasswordTokenFormValues>({
    resolver: zodResolver(passwordTokenSchema),
    defaultValues: { password: '', password_confirmation: '' },
  })

  function onSubmit(values: PasswordTokenFormValues) {
    mutation.mutate(
      { email, token, password: values.password },
      {
        onSuccess: (user) => {
          toast.success(successToast(user.name))
          navigate('/')
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.errors?.token?.[0] ?? error.response?.data?.message ?? 'Something went wrong')
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {linkIsMissingParams ? incompleteLinkMessage : describe(email)}
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
                disabled={mutation.isPending || linkIsMissingParams}
              >
                {mutation.isPending ? pendingLabel : submitLabel}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
