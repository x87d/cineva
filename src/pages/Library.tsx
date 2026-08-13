import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { getMovieDetails } from '@/lib/tmdb'
import { useLibrary } from '@/features/library/hooks'
import { useAuth } from '@/providers/AuthProvider'
import { posterUrl, releaseYear } from '@/lib/format'
import { StarRating } from '@/components/StarRating'
import { SkeletonGrid } from '@/components/states/SkeletonGrid'
import { EmptyState } from '@/components/states/EmptyState'

type Tab = 'watched' | 'watchlist'

export function Library() {
  const [tab, setTab] = useState<Tab>('watched')
  const lib = useLibrary()
  const { user } = useAuth()

  const ids = (tab === 'watched' ? lib.watched : lib.watchlist).map((row) => row.tmdb_id)

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['movie', String(id)],
      queryFn: () => getMovieDetails(id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  const loading = lib.isLoading || queries.some((q) => q.isLoading)
  const movies = queries.map((q) => q.data).filter(Boolean)

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      active ? 'bg-accent-violet text-white' : 'text-muted hover:text-fg'
    }`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Your library</h1>
        {!user ? (
          <p className="mt-1.5 text-sm text-muted">
            Saved on this device. Sign in to keep it across devices — your films come with you.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-3">
        <button className={tabClass(tab === 'watched')} onClick={() => setTab('watched')}>
          Watched ({lib.watched.length})
        </button>
        <button className={tabClass(tab === 'watchlist')} onClick={() => setTab('watchlist')}>
          Watchlist ({lib.watchlist.length})
        </button>
      </div>

      {loading && ids.length ? (
        <SkeletonGrid count={6} />
      ) : !ids.length ? (
        <EmptyState
          title={tab === 'watched' ? 'Nothing logged yet.' : 'Your watchlist is empty.'}
          hint={
            <>
              Open any film and use the buttons there, or{' '}
              <Link to="/import" className="text-accent-violet hover:underline">
                import your Letterboxd history
              </Link>
              .
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {movies.map((movie) => {
            if (!movie) return null
            const poster = posterUrl(movie.poster_path, 'w500')
            return (
              <div key={movie.id}>
                <Link
                  to={`/movie/${movie.id}`}
                  className="group block overflow-hidden rounded-xl bg-surface ring-1 ring-white/5 transition hover:ring-accent-violet/40"
                >
                  <div className="aspect-[2/3] w-full bg-surface2">
                    {poster ? (
                      <img src={poster} alt={`${movie.title} poster`} loading="lazy" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                </Link>
                <h3 className="mt-2 line-clamp-1 text-sm font-medium text-fg">{movie.title}</h3>
                <p className="text-xs text-muted">{releaseYear(movie.release_date)}</p>

                {tab === 'watched' ? (
                  <div className="mt-1.5">
                    <StarRating
                      size="sm"
                      value={lib.ratingOf(movie.id)}
                      onChange={(next) => lib.rate.mutate({ tmdbId: movie.id, rating: next })}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => lib.unsaveFromWatchlist.mutate(movie.id)}
                    className="mt-1.5 text-xs text-muted transition hover:text-accent-coral"
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
