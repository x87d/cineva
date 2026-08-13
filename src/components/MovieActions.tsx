import { useLibrary } from '@/features/library/hooks'
import { StarRating } from './StarRating'

/** Log a film as watched (with a rating) or save it for later. */
export function MovieActions({ tmdbId }: { tmdbId: number }) {
  const lib = useLibrary()
  const rating = lib.ratingOf(tmdbId)
  const watched = lib.isWatched(tmdbId)
  const saved = lib.isSaved(tmdbId)

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface/80 px-4 py-2.5">
        <span className="text-xs text-muted">{watched ? 'Your rating' : 'Rate to log'}</span>
        <StarRating
          value={rating}
          onChange={(next) => {
            if (next === null && watched) lib.unwatch.mutate(tmdbId)
            else lib.rate.mutate({ tmdbId, rating: next })
          }}
        />
      </div>

      <button
        onClick={() =>
          watched ? lib.unwatch.mutate(tmdbId) : lib.rate.mutate({ tmdbId, rating: null })
        }
        className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
          watched
            ? 'border-accent-violet bg-accent-violet/15 text-fg'
            : 'border-white/10 bg-surface text-fg hover:border-white/25'
        }`}
      >
        {watched ? '✓ Watched' : 'Mark watched'}
      </button>

      <button
        onClick={() =>
          saved ? lib.unsaveFromWatchlist.mutate(tmdbId) : lib.saveToWatchlist.mutate(tmdbId)
        }
        className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
          saved
            ? 'border-accent-coral bg-accent-coral/15 text-fg'
            : 'border-white/10 bg-surface text-fg hover:border-white/25'
        }`}
      >
        {saved ? '✓ In watchlist' : '+ Watchlist'}
      </button>
    </div>
  )
}
