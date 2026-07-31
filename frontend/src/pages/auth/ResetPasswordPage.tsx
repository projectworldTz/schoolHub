import { useResetPassword } from '@/hooks/useAuth'
import { PasswordTokenForm } from '@/pages/auth/PasswordTokenForm'

export function ResetPasswordPage() {
  const resetMutation = useResetPassword()

  return (
    <PasswordTokenForm
      title="Reset your password"
      incompleteLinkMessage="This reset link looks incomplete. Request a new one from the login page."
      describe={(email) => `Choose a new password for ${email}.`}
      submitLabel="Reset password"
      pendingLabel="Resetting…"
      successToast={(name) => `Welcome back, ${name}`}
      mutation={resetMutation}
    />
  )
}
