import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { PasswordInput } from '@/components/auth/PasswordInput'

const MIN_LENGTH = 6

/** Where the emailed reset link lands. Supabase signs the user in temporarily
 *  so they can set a new password here. */
export function ResetPassword() {
  const { updatePassword, user, isRecovering, loading } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }

    setBusy(true)
    const result = await updatePassword(password)
    setBusy(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/feed'), 1800)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">Password updated</h1>
        <p className="mt-2 text-sm text-muted">You're signed in. Taking you to your feed…</p>
      </div>
    )
  }

  // Link expired, already used, or opened directly without a reset email.
  if (!loading && !user && !isRecovering) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">This link has expired</h1>
        <p className="mt-2 text-sm text-muted">
          Reset links can only be used once, and they don't last long. Request a fresh one from the
          sign-in box.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          Back to Cineva
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="font-display text-2xl font-semibold text-fg">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">
        {user?.email ? `For ${user.email}.` : ''} Make it something you'll remember.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <PasswordInput
          value={password}
          onChange={setPassword}
          minLength={MIN_LENGTH}
          placeholder={`New password (min ${MIN_LENGTH} characters)`}
          autoComplete="new-password"
          autoFocus
        />
        <PasswordInput
          value={confirm}
          onChange={setConfirm}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />

        {error ? (
          <p className="rounded-lg border border-accent-coral/30 bg-accent-coral/10 p-3 text-xs leading-relaxed text-accent-coral">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent-violet px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
