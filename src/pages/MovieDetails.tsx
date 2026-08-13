import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMovieDetails } from '@/lib/tmdb'
import { backdropUrl, posterUrl, profileUrl, releaseYear, formatRating, formatRuntime } from '@/lib/format'
import { PosterGrid } from '@/components/PosterGrid'
import { MovieActions } from '@/components/MovieActions'
import { WhyRecommended } from '@/components/WhyRecommended'
import { WatchProviders } from '@/components/WatchProviders'
import { ErrorState } from '@/components/states/ErrorState'

function DetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 w-full rounded-2xl bg-surface2 sm:h-80" />
      <div className="h-8 w-2/3 rounded bg-surface2" />
      <div className="h-24 w-full rounded bg-surface2" />
    </div>
  )
}

export function MovieDetails() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id as string),
    enabled: Boolean(id),
  })

  if (isLoading) return <DetailsSkeleton />
  if (isError || !data) {
    return <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
  }

  const backdrop = backdropUrl(data.backdrop_path)
  const poster = posterUrl(data.poster_path, 'w500')
  const runtime = formatRuntime(data.runtime)
  const cast = data.credits?.cast?.slice(0, 12) ?? []
  const trailer =
    data.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ??
    data.videos?.results?.find((v) => v.site === 'YouTube')
  const similar = data.similar?.results?.slice(0, 12) ?? []

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface">
        {backdrop ? (
          <div className="absolute inset-0">
            <img src={backdrop} alt="" className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-base via-base/85 to-base/40" />
          </div>
        ) : null}

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-10">
          <div className="w-32 shrink-0 overflow-hidden rounded-xl bg-surface2 ring-1 ring-white/10 sm:w-48">
            {poster ? (
              <img src={poster} alt={`${data.title} poster`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center p-3 text-center text-xs text-muted">
                {data.title}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-4xl">{data.title}</h1>
            {data.tagline ? <p className="mt-1 text-sm italic text-muted">{data.tagline}</p> : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{releaseYear(data.release_date)}</span>
              {runtime ? <span>· {runtime}</span> : null}
              <span className="inline-flex items-center gap-1.5">
                ·
                <span className="rounded-md bg-accent-coral/15 px-1.5 py-0.5 font-medium tabular-nums text-accent-coral">
                  {formatRating(data.vote_average)}
                </span>
              </span>
            </div>

            {data.genres?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.genres.map((g) => (
                  <span key={g.id} className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
                    {g.name}
                  </span>
                ))}
              </div>
            ) : null}

            {data.overview ? (
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-fg/90">{data.overview}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {trailer ? (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-violet px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch trailer
                </a>
              ) : null}
            </div>

            <div className="mt-4">
              <MovieActions tmdbId={data.id} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <WhyRecommended movie={data} />
        <WatchProviders providers={data['watch/providers']?.results} />
      </div>

      {cast.length ? (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-fg">Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {cast.map((member) => {
              const photo = profileUrl(member.profile_path)
              return (
                <div key={member.id} className="w-24 shrink-0 text-center">
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface2">
                    {photo ? (
                      <img src={photo} alt={member.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted">?</div>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-xs font-medium text-fg">{member.name}</p>
                  <p className="truncate text-xs text-muted">{member.character}</p>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {similar.length ? (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-fg">More like this</h2>
          <PosterGrid movies={similar} />
        </section>
      ) : null}

      <div>
        <Link to="/" className="text-sm text-muted transition hover:text-fg">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
