import { Link } from 'react-router-dom'
import { posterUrl, releaseYear, formatRating } from '@/lib/format'
import { ReasonChips } from './ReasonChips'
import { useLibrary } from '@/features/library/hooks'
import type { Recommendation } from '@/features/recommender/types'

/** A feed tile: poster, quick save, and the "why" when we have one. */
export function FeedCard({ item }: { item: Recommendation }) {
  const { movie, reasons } = item
  const lib = useLibrary()
  const saved = lib.isSaved(movie.id)
  const poster = posterUrl(movie.poster_path, 'w500')

  return (
    <div className="mb-5 break-inside-avoid">
      <div className="group relative overflow-hidden rounded-xl bg-surface ring-1 ring-white/5 transition-all duration-300 hover:ring-accent-violet/40 hover:shadow-[0_16px_50px_-16px_rgba(108,92,231,0.55)]">
        <Link to={`/movie/${movie.id}`} className="block">
          {poster ? (
            <img src={poster} alt={`${movie.title} poster`} loading="lazy" className="w-full" />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center bg-surface2 p-4 text-center text-sm text-muted">
              {movie.title}
            </div>
          )}
        </Link>

        <button
          onClick={() =>
            saved ? lib.unsaveFromWatchlist.mutate(movie.id) : lib.saveToWatchlist.mutate(movie.id)
          }
          aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
          className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${
            saved
              ? 'bg-accent-coral text-base'
              : 'bg-base/70 text-fg opacity-0 group-hover:opacity-100 hover:bg-accent-violet'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M6 4h12v16l-6-4-6 4z" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-2">
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
}
