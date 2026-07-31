import { useActivateAccount } from '@/hooks/useAuth'
import { PasswordTokenForm } from '@/pages/auth/PasswordTokenForm'

export function ActivateAccountPage() {
  const activateMutation = useActivateAccount()

  return (
    <PasswordTokenForm
      title="Activate your account"
      incompleteLinkMessage="This activation link looks incomplete. Ask your platform administrator to resend it."
      describe={(email) => `Set a password for ${email} to finish setting up your account.`}
      submitLabel="Activate account"
      pendingLabel="Activating…"
      successToast={(name) => `Welcome, ${name}`}
      mutation={activateMutation}
    />
  )
}
