import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, supabaseConfigError, checkSupabaseReachable } from '@/lib/supabase'
import { migrateGuestLibrary } from '@/features/library/api'

interface SignUpResult {
  error?: string
  needsConfirmation?: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  configured: boolean
  signUp: (email: string, password: string, username: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  /** True while the user is in the reset-link flow and must set a new password. */
  isRecovering: boolean
}

/** Supabase surfaces connection failures as a bare "Failed to fetch" — explain it instead. */
async function describeAuthError(error: { message: string }): Promise<string> {
  const raw = error.message ?? ''
  const isNetwork =
    /failed to fetch|networkerror|load failed|fetch failed/i.test(raw)
  if (!isNetwork) return raw
  const reachable = await checkSupabaseReachable()
  return reachable.message ?? 'Could not reach the authentication server.'
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecovering, setIsRecovering] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      // Arriving from a reset email: Supabase signs the user in temporarily so
      // they can set a new password. Flag it so the UI asks for one.
      if (event === 'PASSWORD_RECOVERY') setIsRecovering(true)
      // Carry anything logged as a guest into the new account, once.
      if (event === 'SIGNED_IN' && nextUser) {
        void migrateGuestLibrary(nextUser.id).catch(() => undefined)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isSupabaseConfigured,
      isRecovering,
      async signUp(email, password, username) {
        if (!supabase) return { error: supabaseConfigError ?? 'Accounts are not configured yet.' }
        // Stored on the auth user; a database trigger copies it into the profile.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() } },
        })
        if (error) return { error: await describeAuthError(error) }
        // With email confirmation on, there is no session until the user confirms.
        return { needsConfirmation: !data.session }
      },
      async signIn(email, password) {
        if (!supabase) return { error: supabaseConfigError ?? 'Accounts are not configured yet.' }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? { error: await describeAuthError(error) } : {}
      },
      async signOut() {
        if (!supabase) return
        await supabase.auth.signOut()
        setIsRecovering(false)
      },
      async requestPasswordReset(email) {
        if (!supabase) return { error: supabaseConfigError ?? 'Accounts are not configured yet.' }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return error ? { error: await describeAuthError(error) } : {}
      },
      async updatePassword(password) {
        if (!supabase) return { error: supabaseConfigError ?? 'Accounts are not configured yet.' }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) return { error: await describeAuthError(error) }
        setIsRecovering(false)
        return {}
      },
    }),
    [user, loading, isRecovering],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
