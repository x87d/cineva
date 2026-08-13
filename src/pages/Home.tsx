import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getTrending } from '@/lib/tmdb'
import { useGenres } from '@/hooks/useGenres'
import { PosterGrid } from '@/components/PosterGrid'
import { SkeletonGrid } from '@/components/states/SkeletonGrid'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { SearchBar } from '@/components/SearchBar'

export function Home() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending,
  })
  const movies = data?.results ?? []
  const genres = useGenres()

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-surface px-6 py-20 sm:px-12 sm:py-28">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-violet/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-accent-coral/10 blur-3xl" />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-accent-violet">
          Cineva
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-6xl">
          Recommendations that tell you <span className="text-accent-coral">why</span>.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Start from a film you love, blend a few together, or let Cineva learn your taste — then
          take a Wild Card to expand it.
        </p>
        <div className="mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">
          <SearchBar className="flex-1" />
          <Link
            to="/taste"
            className="shrink-0 rounded-lg bg-accent-violet px-5 py-2 text-center text-sm font-medium text-white transition hover:brightness-110"
          >
            Take the taste test
          </Link>
          <Link
            to="/wildcard"
            className="shrink-0 rounded-lg border border-accent-coral/40 bg-accent-coral/10 px-5 py-2 text-center text-sm font-medium text-accent-coral transition hover:bg-accent-coral/20"
          >
            🎲 Wild Card
          </Link>
        </div>
      </section>

      {genres.length ? (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-fg">Browse by genre</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Link
                key={g.id}
                to={`/browse?genre=${g.id}`}
                className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-muted transition hover:border-accent-violet/50 hover:text-fg"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold text-fg">Trending this week</h2>
          <span className="text-xs text-muted">Powered by TMDB</span>
        </div>

        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
        ) : movies.length === 0 ? (
          <EmptyState title="No films to show right now." hint="Check back in a moment." />
        ) : (
          <PosterGrid movies={movies} />
        )}
      </section>
    </div>
  )
}
