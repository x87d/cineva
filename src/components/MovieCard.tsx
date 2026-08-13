import { Link } from 'react-router-dom'
import { posterUrl, releaseYear, formatRating } from '@/lib/format'
import type { Movie } from '@/types/movie'

export function MovieCard({ movie }: { movie: Movie }) {
  const poster = posterUrl(movie.poster_path, 'w500')

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group relative block overflow-hidden rounded-xl bg-surface ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1.5 hover:ring-accent-violet/40 hover:shadow-[0_16px_50px_-16px_rgba(108,92,231,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-violet"
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-base via-base/70 to-transparent p-3.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <h3 className="line-clamp-2 text-sm font-medium text-fg">{movie.title}</h3>
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <span className="text-muted">{releaseYear(movie.release_date)}</span>
          <span className="rounded-md bg-accent-coral/15 px-1.5 py-0.5 font-medium tabular-nums text-accent-coral">
            {formatRating(movie.vote_average)}
          </span>
        </div>
      </div>
    </Link>
  )
}
