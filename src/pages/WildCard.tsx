import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getWildCard } from '@/features/recommender/wildcard'
import { useTasteSeeds } from '@/features/taste/useTasteSeeds'
import { useLibrary } from '@/features/library/hooks'
import { useAuth } from '@/providers/AuthProvider'
import { useGenres } from '@/hooks/useGenres'
import { backdropUrl, posterUrl, releaseYear, formatRating, formatRuntime } from '@/lib/format'
import { MovieActions } from '@/components/MovieActions'
import { ErrorState } from '@/components/states/ErrorState'

export function WildCard() {
  const { quizGenreIds } = useTasteSeeds()
  const { watched, isLoading: libraryLoading } = useLibrary()
  const { user } = useAuth()
  const genres = useGenres()
  const [roll, setRoll] = useState(0)
  // Films rolled this session, so "Roll again" never repeats itself.
  const [seenThisSession, setSeenThisSession] = useState<number[]>([])

  const watchedIds = useMemo(() => watched.map((w) => w.tmdb_id), [watched])
  const excludeIds = useMemo(
    () => [...watchedIds, ...seenThisSession],
    [watchedIds, seenThisSession],
  )

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['wildcard', roll],
    queryFn: () => getWildCard({ familiarGenreIds: quizGenreIds, excludeIds }),
    // Wait for the library so the very first roll already skips watched films.
    enabled: !libraryLoading,
    staleTime: 0,
    gcTime: 0,
  })

  const movie = data?.movie

  useEffect(() => {
    if (movie) setSeenThisSession((prev) => (prev.includes(movie.id) ? prev : [...prev, movie.id]))
  }, [movie])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-accent-coral">
          Wild Card
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-fg sm:text-4xl">
          Something you'd never pick
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          A well-loved film pulled from outside your usual rotation. No algorithm comfort zone —
          just something worth trying.
        </p>
      </div>

      {isFetching || libraryLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-80 w-full rounded-2xl bg-surface2" />
        </div>
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : movie ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface">
          {movie.backdrop_path ? (
            <div className="absolute inset-0">
              <img src={backdropUrl(movie.backdrop_path) ?? ''} alt="" className="h-full w-full object-cover opacity-25" />
              <div className="absolute inset-0 bg-gradient-to-t from-base via-base/90 to-base/50" />
            </div>
          ) : null}

          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
            <Link to={`/movie/${movie.id}`} className="w-32 shrink-0 sm:w-44">
              <img
                src={posterUrl(movie.poster_path, 'w500') ?? ''}
                alt={`${movie.title} poster`}
                className="w-full rounded-xl ring-1 ring-white/10"
              />
            </Link>

            <div className="min-w-0 flex-1">
              {data?.newGenre ? (
                <span className="inline-block rounded-full border border-accent-coral/40 bg-accent-coral/10 px-3 py-1 text-xs text-accent-coral">
                  A step into {data.newGenre}
                </span>
              ) : null}

              <h2 className="mt-3 font-display text-2xl font-semibold text-fg sm:text-3xl">
                <Link to={`/movie/${movie.id}`} className="hover:text-accent-violet">
                  {movie.title}
                </Link>
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
                <span>{releaseYear(movie.release_date)}</span>
                {formatRuntime(movie.runtime) ? <span>· {formatRuntime(movie.runtime)}</span> : null}
                <span className="rounded-md bg-accent-coral/15 px-1.5 py-0.5 font-medium tabular-nums text-accent-coral">
                  {formatRating(movie.vote_average)}
                </span>
              </div>

              {movie.genres?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <span key={g.id} className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
                      {g.name}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-fg/90">{movie.overview}</p>

              <div className="mt-6">
                <MovieActions tmdbId={movie.id} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-center">
        <button
          onClick={() => setRoll((r) => r + 1)}
          disabled={isFetching || libraryLoading}
          className="rounded-xl bg-accent-coral px-8 py-3.5 font-display text-base font-semibold text-base transition hover:brightness-110 disabled:opacity-60"
        >
          {isFetching ? 'Rolling…' : '🎲 Roll again'}
        </button>
      </div>

      {watchedIds.length ? (
        <p className="text-center text-xs text-muted">
          Skipping the {watchedIds.length} film{watchedIds.length === 1 ? '' : 's'} you've logged
          {user ? '' : ' on this device'} — every roll is something new.
        </p>
      ) : genres.length && !quizGenreIds.length ? (
        <p className="text-center text-xs text-muted">
          Tip: take the <Link to="/taste" className="text-accent-violet hover:underline">taste test</Link> and
          the Wild Card will steer away from what you already watch.
        </p>
      ) : null}
    </div>
  )
}
