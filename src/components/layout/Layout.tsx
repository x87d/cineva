import { useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from './Header'
import { useAuth } from '@/providers/AuthProvider'

export function Layout({ children }: { children: ReactNode }) {
  const { isRecovering } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Someone following a reset link should land on the password form, wherever
  // Supabase drops them.
  useEffect(() => {
    if (isRecovering && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true })
    }
  }, [isRecovering, location.pathname, navigate])

  return (
    <div className="flex min-h-dvh flex-col bg-base text-fg">
      <Header />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-6 text-xs text-muted/70 sm:px-6">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  )
}
