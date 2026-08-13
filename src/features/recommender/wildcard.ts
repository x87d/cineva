import { discoverMovies, getMovieDetails } from '@/lib/tmdb'
import type { Movie, MovieDetails } from '@/types/movie'

/** Broad genre spread so the Wild Card can reach well outside a usual rotation. */
const GENRE_POOL = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752, 37,
]

const MIN_RATING = 6.8
const MIN_VOTES = 300
const MAX_ATTEMPTS = 4

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export interface WildCardResult {
  movie: MovieDetails
  newGenre: string | null
  isOutsideTaste: boolean
}

export interface WildCardOptions {
  /** Genres the user already watches — the roll steers away from these. */
  familiarGenreIds?: number[]
  /** Films to never return: already watched, plus anything rolled this session. */
  excludeIds?: number[]
}

/**
 * A deliberate surprise, not noise: random genre + random page, gated on quality
 * so a stretch never means "obscure and bad". Films the user has already seen are
 * filtered out, and we re-roll if a whole page turns out to be exhausted.
 */
export async function getWildCard({
  familiarGenreIds = [],
  excludeIds = [],
}: WildCardOptions = {}): Promise<WildCardResult> {
  const exclude = new Set(excludeIds)
  const unfamiliar = GENRE_POOL.filter((id) => !familiarGenreIds.includes(id))

  let fresh: Movie[] = []
  let usedUnfamiliar = false

  for (let attempt = 0; attempt < MAX_ATTEMPTS && !fresh.length; attempt += 1) {
    // Mostly reach outside the comfort zone, but leave room for a familiar surprise.
    usedUnfamiliar = unfamiliar.length > 0 && Math.random() < 0.75
    const genreId = usedUnfamiliar ? pick(unfamiliar) : pick(GENRE_POOL)
    const page = 1 + Math.floor(Math.random() * 5)
    const sortBy = Math.random() < 0.5 ? 'vote_average.desc' : 'popularity.desc'

    try {
      const response = await discoverMovies({ genreId, minRating: MIN_RATING, sortBy, page })
      fresh = response.results.filter(
        (m) => m.vote_count >= MIN_VOTES && m.poster_path && !exclude.has(m.id),
      )
    } catch {
      fresh = []
    }
  }

  // Last resort: a wide acclaimed sweep, still skipping seen films.
  if (!fresh.length) {
    for (let page = 1; page <= 3 && !fresh.length; page += 1) {
      const fallback = await discoverMovies({ minRating: 7, sortBy: 'vote_average.desc', page })
      fresh = fallback.results.filter((m) => m.poster_path && !exclude.has(m.id))
    }
  }

  if (!fresh.length) {
    throw new Error("You've seen everything we rolled — try clearing a few watched films.")
  }

  const chosen = pick(fresh)
  const details = await getMovieDetails(chosen.id)
  const newGenre = details.genres?.find((g) => !familiarGenreIds.includes(g.id))?.name ?? null

  return { movie: details, newGenre, isOutsideTaste: usedUnfamiliar }
}
