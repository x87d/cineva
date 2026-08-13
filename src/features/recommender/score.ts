import type { Movie } from '@/types/movie'
import type { Reason, Recommendation, TasteVector } from './types'
import { averageYear } from './features'

/** Relative importance of each signal. Keywords carry the most meaning about *what a film is like*. */
const WEIGHTS = {
  keyword: 3.0,
  genre: 1.4,
  cast: 1.6,
  director: 2.2,
  era: 0.8,
  quality: 0.5,
}

const MAX_REASONS = 3

export interface Candidate {
  movie: Movie
  genreIds: number[]
  keywordIds?: number[]
  castIds?: number[]
  directorIds?: number[]
}

export interface NameLookup {
  genres: Map<number, string>
  keywords: Map<number, string>
  people: Map<number, string>
}

/**
 * Score one candidate against the taste vector.
 * Each matched trait adds its weight *times how strongly the user shows that trait*,
 * which is what makes the result explainable: every point has a named source.
 */
export function scoreCandidate(
  candidate: Candidate,
  taste: TasteVector,
  names: NameLookup,
): Recommendation {
  const reasons: Reason[] = []
  let score = 0

  const addMatches = (
    ids: number[] | undefined,
    tasteMap: Map<number, number>,
    weight: number,
    kind: Reason['kind'],
    nameMap: Map<number, string>,
  ) => {
    if (!ids?.length) return
    for (const id of ids) {
      const affinity = tasteMap.get(id)
      if (!affinity) continue
      const points = weight * affinity
      score += points
      const label = nameMap.get(id)
      if (label) reasons.push({ kind, label, weight: points })
    }
  }

  addMatches(candidate.keywordIds, taste.keywords, WEIGHTS.keyword, 'keyword', names.keywords)
  addMatches(candidate.genreIds, taste.genres, WEIGHTS.genre, 'genre', names.genres)
  addMatches(candidate.castIds, taste.cast, WEIGHTS.cast, 'cast', names.people)
  addMatches(candidate.directorIds, taste.directors, WEIGHTS.director, 'director', names.people)

  // Era proximity: films from around the same period as the seeds feel related.
  const target = averageYear(taste)
  const year = candidate.movie.release_date
    ? Number(candidate.movie.release_date.slice(0, 4))
    : null
  if (target && year) {
    const distance = Math.abs(target - year)
    if (distance <= 12) {
      const points = WEIGHTS.era * (1 - distance / 12)
      score += points
      if (distance <= 6) {
        reasons.push({ kind: 'era', label: `${year}`, weight: points })
      }
    }
  }

  // A gentle nudge toward well-regarded films, so ties break sensibly.
  if (candidate.movie.vote_count > 200) {
    score += WEIGHTS.quality * (candidate.movie.vote_average / 10)
  }

  const top = reasons.sort((a, b) => b.weight - a.weight).slice(0, MAX_REASONS)
  return { movie: candidate.movie, score, reasons: top }
}

export function rankCandidates(
  candidates: Candidate[],
  taste: TasteVector,
  names: NameLookup,
  limit = 24,
): Recommendation[] {
  const seen = new Set<number>()
  return candidates
    .filter((c) => {
      if (taste.seedIds.has(c.movie.id) || seen.has(c.movie.id)) return false
      seen.add(c.movie.id)
      return true
    })
    .map((c) => scoreCandidate(c, taste, names))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Turn the top reasons into human-readable chips. */
export function reasonText(reason: Reason): string {
  switch (reason.kind) {
    case 'keyword':
      return reason.label
    case 'genre':
      return reason.label
    case 'cast':
      return `with ${reason.label}`
    case 'director':
      return `dir. ${reason.label}`
    case 'era':
      return reason.label
  }
}
