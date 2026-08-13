import { getMovieDetails, discoverMovies } from '@/lib/tmdb'
import type { MovieDetails } from '@/types/movie'
import { extractFeatures, buildTasteVector, topIds } from './features'
import { rankCandidates, type Candidate, type NameLookup } from './score'
import type { Recommendation } from './types'

/**
 * Candidate generation: rather than scoring all of TMDB, gather a few hundred
 * plausible films — each seed's own "similar"/"recommendations" lists, plus a
 * discover sweep over the user's strongest genres.
 */
async function gatherCandidates(seedDetails: MovieDetails[], topGenreIds: number[]) {
  const candidates: Candidate[] = []
  const names: NameLookup = { genres: new Map(), keywords: new Map(), people: new Map() }

  for (const seed of seedDetails) {
    for (const g of seed.genres ?? []) names.genres.set(g.id, g.name)
    for (const k of seed.keywords?.keywords ?? []) names.keywords.set(k.id, k.name)
    for (const c of seed.credits?.cast?.slice(0, 8) ?? []) names.people.set(c.id, c.name)
    const crew = (seed.credits as { crew?: { id: number; name: string; job: string }[] } | undefined)?.crew
    for (const c of crew?.filter((m) => m.job === 'Director') ?? []) names.people.set(c.id, c.name)

    const pool = [...(seed.similar?.results ?? []), ...(seed.recommendations?.results ?? [])]
    for (const movie of pool) {
      candidates.push({ movie, genreIds: movie.genre_ids ?? [] })
    }
  }

  // Broaden the pool with a genre sweep so we're not limited to TMDB's own lists.
  const sweeps = await Promise.all(
    topGenreIds.slice(0, 2).map((genreId) =>
      discoverMovies({ genreId, minRating: 6, sortBy: 'popularity.desc' }).catch(() => null),
    ),
  )
  for (const sweep of sweeps) {
    for (const movie of sweep?.results ?? []) {
      candidates.push({ movie, genreIds: movie.genre_ids ?? [] })
    }
  }

  return { candidates, names }
}

/**
 * Enrich the strongest candidates with keywords/cast/crew, which the list
 * endpoints don't return. Only the top slice is enriched, to keep it fast.
 */
async function enrich(candidates: Candidate[], names: NameLookup, limit: number) {
  const slice = candidates.slice(0, limit)
  const detailed = await Promise.all(
    slice.map((c) => getMovieDetails(c.movie.id).catch(() => null)),
  )

  detailed.forEach((details, index) => {
    if (!details) return
    const candidate = slice[index]
    candidate.keywordIds = details.keywords?.keywords?.map((k) => k.id) ?? []
    candidate.castIds = details.credits?.cast?.slice(0, 8).map((c) => c.id) ?? []
    const crew = (details.credits as { crew?: { id: number; name: string; job: string }[] } | undefined)?.crew
    candidate.directorIds = crew?.filter((m) => m.job === 'Director').map((m) => m.id) ?? []

    for (const k of details.keywords?.keywords ?? []) names.keywords.set(k.id, k.name)
    for (const c of details.credits?.cast?.slice(0, 8) ?? []) names.people.set(c.id, c.name)
    for (const c of crew?.filter((m) => m.job === 'Director') ?? []) names.people.set(c.id, c.name)
    for (const g of details.genres ?? []) names.genres.set(g.id, g.name)
  })

  return slice
}

export interface RecommendInput {
  seedIds: number[]
  quizGenreIds?: number[]
}

/** Full pipeline: seeds -> taste vector -> candidates -> enrichment -> ranked recommendations. */
export async function getRecommendations({
  seedIds,
  quizGenreIds = [],
}: RecommendInput): Promise<Recommendation[]> {
  const seedDetails = (
    await Promise.all(seedIds.map((id) => getMovieDetails(id).catch(() => null)))
  ).filter((d): d is MovieDetails => d !== null)

  if (!seedDetails.length && !quizGenreIds.length) return []

  const taste = buildTasteVector(seedDetails.map(extractFeatures), quizGenreIds)
  const topGenres = topIds(taste.genres, 3)

  const { candidates, names } = await gatherCandidates(seedDetails, topGenres)

  // Pre-rank on the cheap signals, then enrich only the most promising films.
  const preRanked = rankCandidates(candidates, taste, names, 40)
  const enriched = await enrich(
    preRanked.map((r) => candidates.find((c) => c.movie.id === r.movie.id) as Candidate),
    names,
    30,
  )

  return rankCandidates(enriched, taste, names, 24)
}
