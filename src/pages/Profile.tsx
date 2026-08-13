import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useProfile } from '@/features/profile/hooks'
import { useLibrary } from '@/features/library/hooks'
import { useAuth } from '@/providers/AuthProvider'
import { getMovieDetails } from '@/lib/tmdb'
import { posterUrl, releaseYear } from '@/lib/format'
import { SkeletonGrid } from '@/components/states/SkeletonGrid'
import { EmptyState } from '@/components/states/EmptyState'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-fg">{value}</p>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
    </div>
  )
}

export function Profile() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const lib = useLibrary()

  const watchedIds = lib.watched.map((w) => w.tmdb_id).slice(0, 18)
  const queries = useQueries({
    queries: watchedIds.map((id) => ({
      queryKey: ['movie', String(id)],
      queryFn: () => getMovieDetails(id),
      staleTime: 1000 * 60 * 60,
    })),
  })
  const movies = queries.map((q) => q.data).filter(Boolean)

  const averageRating = useMemo(() => {
    const rated = lib.watched.filter((w) => w.rating)
    if (!rated.length) return '—'
    return (rated.reduce((sum, w) => sum + (w.rating ?? 0), 0) / rated.length).toFixed(1)
  }, [lib.watched])

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">Profiles need an account</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to claim a username and keep your films across devices. Anything you've logged on
          this device comes with you.
        </p>
        <Link
          to="/library"
          className="mt-6 inline-block rounded-lg border border-white/10 bg-surface px-5 py-2.5 text-sm font-medium text-fg transition hover:border-white/25"
        >
          View your local library
        </Link>
      </div>
    )
  }

  const name = profile?.username ?? profile?.display_name ?? user.email?.split('@')[0] ?? 'You'
  const initial = (profile?.username ?? user.email ?? 'U')[0].toUpperCase()

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
        <div className="relative h-36 w-full bg-gradient-to-br from-accent-violet/30 via-surface2 to-accent-coral/20 sm:h-52">
          {profile?.banner_url ? (
            <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-16">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface2 ring-4 ring-surface sm:h-32 sm:w-32">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-accent-violet/20 font-display text-3xl font-semibold text-accent-violet">
                  {initial}
                </div>
              )}
            </div>
            <Link
              to="/settings"
              className="mb-2 ml-auto rounded-lg border border-white/10 bg-surface px-4 py-2 text-sm text-fg transition hover:border-white/25"
            >
              Edit profile
            </Link>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-semibold text-fg">
              {profile?.username ? `@${profile.username}` : name}
            </h1>
            {profileLoading ? null : !profile?.username ? (
              <p className="mt-1 text-sm text-muted">
                No username yet —{' '}
                <Link to="/settings" className="text-accent-violet hover:underline">
                  pick one
                </Link>
                .
              </p>
            ) : null}
            {profile?.bio ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg/90">{profile.bio}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No bio yet.{' '}
                <Link to="/settings" className="text-accent-violet hover:underline">
                  Add one
                </Link>
                .
              </p>
            )}
          </div>

          <div className="mt-6 flex gap-10">
            <Stat label="Watched" value={lib.watched.length} />
            <Stat label="Watchlist" value={lib.watchlist.length} />
            <Stat label="Avg rating" value={averageRating} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-fg">Recently watched</h2>
          {lib.watched.length > 18 ? (
            <Link to="/library" className="text-sm text-muted transition hover:text-fg">
              See all {lib.watched.length}
            </Link>
          ) : null}
        </div>

        {lib.isLoading ? (
          <SkeletonGrid count={6} />
        ) : !watchedIds.length ? (
          <EmptyState
            title="No films logged yet."
            hint={
              <>
                Rate something you've seen and it'll appear here.{' '}
                <Link to="/browse" className="text-accent-violet hover:underline">
                  Browse films
                </Link>
                .
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {movies.map((movie) => {
              if (!movie) return null
              const poster = posterUrl(movie.poster_path, 'w342')
              const rating = lib.ratingOf(movie.id)
              return (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="group block overflow-hidden rounded-lg bg-surface ring-1 ring-white/5 transition hover:ring-accent-violet/40"
                >
                  <div className="aspect-[2/3] w-full bg-surface2">
                    {poster ? (
                      <img src={poster} alt={movie.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-1 text-xs font-medium text-fg">{movie.title}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted">
                      <span>{releaseYear(movie.release_date)}</span>
                      {rating ? <span className="text-accent-coral">{'★'.repeat(rating)}</span> : null}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
