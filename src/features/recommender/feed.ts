import { discoverMovies } from '@/lib/tmdb'
import { getRecommendations } from './recommend'
import type { Recommendation } from './types'

export interface FeedInput {
  page: number
  seedIds: number[]
  quizGenreIds: number[]
  topGenreIds: number[]
  /** Films already watched — filtered out so the feed stays forward-looking. */
  excludeIds?: number[]
}

/**
 * The endless feed. Page 1 is the real scored recommendation set (with reasons);
 * later pages widen into the user's top genres so scrolling never dead-ends.
 */
export async function getFeedPage({
  page,
  seedIds,
  quizGenreIds,
  topGenreIds,
  excludeIds = [],
}: FeedInput): Promise<Recommendation[]> {
  const exclude = new Set([...excludeIds, ...seedIds])

  if (page === 1) {
    const recs = await getRecommendations({ seedIds, quizGenreIds })
    const filtered = recs.filter((r) => !exclude.has(r.movie.id))
    if (filtered.length) return filtered
  }

  const genreId = topGenreIds.length ? topGenreIds[(page - 1) % topGenreIds.length] : undefined

  const response = await discoverMovies({
    genreId,
    minRating: 6,
    sortBy: 'popularity.desc',
    page: page + 1,
  })

  return response.results
    .filter((movie) => movie.poster_path && !exclude.has(movie.id))
    .map((movie) => ({ movie, score: 0, reasons: [] }))
}
