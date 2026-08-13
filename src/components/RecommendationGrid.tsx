import { Link } from 'react-router-dom'
import { posterUrl, releaseYear, formatRating } from '@/lib/format'
import { ReasonChips } from './ReasonChips'
import type { Recommendation } from '@/features/recommender/types'

/** Like PosterGrid, but each card carries its explanation chips underneath. */
export function RecommendationGrid({ items }: { items: Recommendation[] }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map(({ movie, reasons }) => {
        const poster = posterUrl(movie.poster_path, 'w500')
        return (
          <div key={movie.id}>
            <Link
              to={`/movie/${movie.id}`}
              className="group block overflow-hidden rounded-xl bg-surface ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1.5 hover:ring-accent-violet/40 hover:shadow-[0_16px_50px_-16px_rgba(108,92,231,0.55)]"
            >
              <div className="aspect-[2/3] w-full bg-surface2">
                {poster ? (
                  <img
                    src={poster}
                    alt={`${movie.title} poster`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-muted">
                    {movie.title}
                  </div>
                )}
              </div>
            </Link>
            <div className="mt-2.5">
              <h3 className="line-clamp-1 text-sm font-medium text-fg">{movie.title}</h3>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-muted">{releaseYear(movie.release_date)}</span>
                <span className="rounded-md bg-accent-coral/15 px-1.5 py-0.5 font-medium tabular-nums text-accent-coral">
                  {formatRating(movie.vote_average)}
                </span>
              </div>
              <ReasonChips reasons={reasons} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
