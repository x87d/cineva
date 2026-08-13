import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/providers/AuthProvider'
import { supabaseConfigError } from '@/lib/supabase'
import { validateUsername, isUsernameAvailable } from '@/features/profile/api'
import { PasswordInput } from './PasswordInput'

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp, requestPasswordReset } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (mode === 'forgot') {
      setBusy(true)
      const result = await requestPasswordReset(email)
      setBusy(false)
      if (result.error) setError(result.error)
      else
        setNotice(
          "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.",
        )
      return
    }

    if (mode === 'signup') {
      const problem = validateUsername(username)
      if (problem) {
        setError(problem)
        return
      }
      setBusy(true)
      try {
        if (!(await isUsernameAvailable(username))) {
          setError('That username is taken — try another.')
          setBusy(false)
          return
        }
      } catch {
        // If the check itself fails, let the unique index decide on submit.
      }
    } else {
      setBusy(true)
    }

    const result =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password, username)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (mode === 'signup' && 'needsConfirmation' in result && result.needsConfirmation) {
      setNotice('Check your email to confirm your account, then sign in.')
      return
    }
    onClose()
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setNotice(null)
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-base px-3 py-2.5 text-sm text-fg placeholder:text-muted/60 focus:border-accent-violet focus:outline-none'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted transition hover:text-fg"
        >
          ✕
        </button>
        <h2 className="font-display text-xl font-semibold text-fg">
          {mode === 'signin'
            ? 'Welcome back'
            : mode === 'signup'
              ? 'Create your account'
              : 'Reset your password'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {mode === 'signin'
            ? 'Sign in to sync your watchlist and feed.'
            : mode === 'signup'
              ? 'Save what you watch and get a feed that learns your taste.'
              : "Enter your email and we'll send you a link to set a new one."}
        </p>

        {supabaseConfigError ? (
          <p className="mt-4 rounded-lg border border-accent-coral/30 bg-accent-coral/10 p-3 text-xs leading-relaxed text-accent-coral">
            {supabaseConfigError}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className={inputClass}
          />
          {mode === 'signup' ? (
            <div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  placeholder="username"
                  autoComplete="username"
                  maxLength={20}
                  className={`${inputClass} pl-7`}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted">
                3–20 characters. Letters, numbers and underscores.
              </p>
            </div>
          ) : null}
          {mode !== 'forgot' ? (
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={6}
              placeholder="Password (min 6 characters)"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          ) : null}

          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('forgot')
                setError(null)
                setNotice(null)
              }}
              className="block text-left text-xs text-muted transition hover:text-accent-violet"
            >
              Forgot your password?
            </button>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-accent-coral/30 bg-accent-coral/10 p-3 text-xs leading-relaxed text-accent-coral">
              {error}
            </p>
          ) : null}
          {notice ? <p className="text-sm text-accent-violet">{notice}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent-violet px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {mode === 'forgot' ? (
            <button
              onClick={() => {
                setMode('signin')
                setError(null)
                setNotice(null)
              }}
              className="font-medium text-accent-violet hover:underline"
            >
              ← Back to sign in
            </button>
          ) : (
            <>
              {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
              <button onClick={switchMode} className="font-medium text-accent-violet hover:underline">
                {mode === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>,
    document.body,
  )
}
