import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '@/features/profile/hooks'
import { useAuth } from '@/providers/AuthProvider'
import { validateUsername, isUsernameAvailable, uploadProfileImage } from '@/features/profile/api'
import { clearTaste } from '@/features/taste/storage'

const BIO_LIMIT = 200

function ImagePicker({
  label,
  hint,
  current,
  round,
  onPick,
  busy,
}: {
  label: string
  hint: string
  current: string | null
  round?: boolean
  onPick: (file: File) => void
  busy: boolean
}) {
  const input = useRef<HTMLInputElement | null>(null)
  return (
    <div className="flex items-center gap-4">
      <div
        className={`overflow-hidden bg-surface2 ring-1 ring-white/10 ${
          round ? 'h-20 w-20 rounded-full' : 'h-20 w-36 rounded-lg'
        }`}
      >
        {current ? <img src={current} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div>
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-lg border border-white/10 bg-surface px-4 py-2 text-sm text-fg transition hover:border-white/25 disabled:opacity-60"
        >
          {busy ? 'Uploading…' : `Change ${label.toLowerCase()}`}
        </button>
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onPick(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

export function Settings() {
  const { user, signOut, requestPasswordReset } = useAuth()
  const { profile, isLoading, save, userId } = useProfile()

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '')
      setBio(profile.bio ?? '')
    }
  }, [profile])

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">Settings need an account</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to pick a username and customise your profile.
        </p>
        <button
          onClick={() => {
            clearTaste()
            setStatus({ kind: 'ok', text: 'Local taste cleared.' })
          }}
          className="mt-6 rounded-lg border border-white/10 bg-surface px-5 py-2.5 text-sm text-fg transition hover:border-white/25"
        >
          Clear taste saved on this device
        </button>
        {status ? <p className="mt-3 text-sm text-accent-violet">{status.text}</p> : null}
      </div>
    )
  }

  async function handleSave() {
    setStatus(null)
    const trimmed = username.trim()
    const changed = trimmed.toLowerCase() !== (profile?.username ?? '').toLowerCase()

    if (trimmed || changed) {
      const problem = validateUsername(trimmed)
      if (problem) {
        setStatus({ kind: 'error', text: problem })
        return
      }
      if (changed) {
        try {
          if (!(await isUsernameAvailable(trimmed, userId ?? undefined))) {
            setStatus({ kind: 'error', text: 'That username is taken — try another.' })
            return
          }
        } catch {
          // fall through; the unique index still protects us
        }
      }
    }

    try {
      await save.mutateAsync({ username: trimmed || null, bio: bio.trim() || null })
      setStatus({ kind: 'ok', text: 'Profile saved.' })
    } catch (err) {
      setStatus({ kind: 'error', text: (err as Error).message })
    }
  }

  async function handleImage(file: File, kind: 'avatar' | 'banner') {
    if (!userId) return
    setStatus(null)
    setUploading(kind)
    try {
      const url = await uploadProfileImage(userId, file, kind)
      await save.mutateAsync(kind === 'avatar' ? { avatar_url: url } : { banner_url: url })
      setStatus({ kind: 'ok', text: `${kind === 'avatar' ? 'Picture' : 'Banner'} updated.` })
    } catch (err) {
      setStatus({ kind: 'error', text: (err as Error).message })
    } finally {
      setUploading(null)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-base px-3 py-2.5 text-sm text-fg placeholder:text-muted/60 focus:border-accent-violet focus:outline-none'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Settings</h1>
        <Link to="/profile" className="text-sm text-muted transition hover:text-fg">
          View profile →
        </Link>
      </div>

      <section className="space-y-5 rounded-2xl border border-white/5 bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-fg">Profile</h2>

        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm text-muted">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  maxLength={20}
                  placeholder="username"
                  className={`${inputClass} pl-7`}
                />
              </div>
              <p className="mt-1 text-xs text-muted">3–20 characters. Letters, numbers, underscores.</p>
            </div>

            <div>
              <label htmlFor="bio" className="mb-1.5 block text-sm text-muted">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_LIMIT))}
                rows={3}
                placeholder="Films that made you, in a sentence or two."
                className={`${inputClass} resize-none`}
              />
              <p className="mt-1 text-right text-xs text-muted">
                {bio.length}/{BIO_LIMIT}
              </p>
            </div>

            <ImagePicker
              label="Picture"
              hint="Square works best. Under 3 MB."
              current={profile?.avatar_url ?? null}
              round
              busy={uploading === 'avatar'}
              onPick={(file) => void handleImage(file, 'avatar')}
            />

            <ImagePicker
              label="Banner"
              hint="Wide image. Under 3 MB."
              current={profile?.banner_url ?? null}
              busy={uploading === 'banner'}
              onPick={(file) => void handleImage(file, 'banner')}
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => void handleSave()}
                disabled={save.isPending}
                className="rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {save.isPending ? 'Saving…' : 'Save changes'}
              </button>
              {status ? (
                <p className={`text-sm ${status.kind === 'ok' ? 'text-accent-violet' : 'text-accent-coral'}`}>
                  {status.text}
                </p>
              ) : null}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/5 bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-fg">Your film data</h2>
        <p className="text-sm text-muted">
          Import your Letterboxd history so recommendations learn from everything you've seen, not
          just your taste test.
        </p>
        <Link
          to="/import"
          className="inline-block rounded-lg border border-accent-violet/40 bg-accent-violet/10 px-4 py-2 text-sm font-medium text-accent-violet transition hover:bg-accent-violet/20"
        >
          Import from Letterboxd
        </Link>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/5 bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-fg">Account</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Email</span>
          <span className="text-fg">{user.email}</span>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={async () => {
              if (!user.email) return
              setStatus(null)
              const result = await requestPasswordReset(user.email)
              setStatus(
                result.error
                  ? { kind: 'error', text: result.error }
                  : { kind: 'ok', text: 'Password reset link sent — check your email.' },
              )
            }}
            className="rounded-lg border border-white/10 bg-base px-4 py-2 text-sm text-fg transition hover:border-white/25"
          >
            Change password
          </button>
          <button
            onClick={() => {
              clearTaste()
              setStatus({ kind: 'ok', text: 'Taste test answers cleared on this device.' })
            }}
            className="rounded-lg border border-white/10 bg-base px-4 py-2 text-sm text-fg transition hover:border-white/25"
          >
            Reset taste test
          </button>
          <button
            onClick={() => void signOut()}
            className="rounded-lg border border-accent-coral/40 bg-accent-coral/10 px-4 py-2 text-sm font-medium text-accent-coral transition hover:bg-accent-coral/20"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}
