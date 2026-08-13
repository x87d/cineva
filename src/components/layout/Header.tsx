import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { AuthModal } from '@/components/auth/AuthModal'
import { useProfile } from '@/features/profile/hooks'
import { SearchBar } from '@/components/SearchBar'

/** Original viewfinder mark: violet focus-frame + a coral aperture. */
function CinevaMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 13V9.5Q8 8 9.5 8H13" stroke="#6C5CE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 8H22.5Q24 8 24 9.5V13" stroke="#6C5CE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 19V22.5Q24 24 22.5 24H19" stroke="#6C5CE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 24H9.5Q8 24 8 22.5V19" stroke="#6C5CE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="3.4" fill="#FF6B6B" />
    </svg>
  )
}

export function Header() {
  const { user, loading, signOut } = useAuth()
  const { profile } = useProfile()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Cineva home">
          <CinevaMark />
          <span className="font-display text-lg font-semibold tracking-tight text-fg">Cineva</span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-4 sm:flex">
          {[
            { to: '/feed', label: 'For you' },
            { to: '/browse', label: 'Browse' },
            { to: '/my-taste', label: 'My Taste' },
            { to: '/library', label: 'Library' },
          ].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm transition ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden flex-1 justify-center px-2 sm:flex">
          <SearchBar className="w-full max-w-md" />
        </div>

        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <Link
            to="/wildcard"
            title="Wild Card — a film outside your usual taste"
            className="rounded-lg border border-accent-coral/40 bg-accent-coral/10 px-3 py-1.5 text-sm font-medium text-accent-coral transition hover:bg-accent-coral/20"
          >
            🎲<span className="ml-1.5 hidden lg:inline">Wild Card</span>
          </Link>
          {loading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-surface py-1.5 pl-1.5 pr-3 text-sm text-fg transition hover:border-white/20"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-violet/20 text-xs font-semibold text-accent-violet">
                    {(profile?.username?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {profile?.username ? `@${profile.username}` : user.email}
                </span>
              </button>
              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-white/10 bg-surface py-1 shadow-xl">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-fg transition hover:bg-white/5"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-fg transition hover:bg-white/5"
                    >
                      Settings
                    </Link>
                    <div className="my-1 border-t border-white/5" />
                    <button
                      onClick={async () => {
                        setMenuOpen(false)
                        await signOut()
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-fg transition hover:bg-white/5"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-lg bg-accent-violet px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  )
}
