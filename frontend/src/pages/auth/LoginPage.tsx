import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useLogin } from '@/hooks/useAuth'
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

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()
  // ProtectedRoute stashes where an unauthenticated visit was headed (e.g.
  // a scanned QR link, /scan/:qrCode) — send them back there instead of
  // always landing on the role's default home.
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: (user) => {
        toast.success(`Welcome back, ${user.name}`)
        navigate(from ? `${from.pathname}${from.search}` : '/')
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Invalid email or password')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <img src="/schoolhub-emblem.png" alt="SchoolHub Africa" className="h-24 w-auto rounded-2xl shadow-lg shadow-primary/20" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-muted-foreground underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
