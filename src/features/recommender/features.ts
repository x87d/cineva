import type { MovieDetails } from '@/types/movie'
import type { MovieFeatures, TasteVector } from './types'

const TOP_CAST = 8

export function extractFeatures(details: MovieDetails): MovieFeatures {
  return {
    id: details.id,
    genres: new Set(details.genres?.map((g) => g.id) ?? []),
    keywords: new Set(details.keywords?.keywords?.map((k) => k.id) ?? []),
    cast: new Set(details.credits?.cast?.slice(0, TOP_CAST).map((c) => c.id) ?? []),
    directors: new Set(
      (details.credits as { crew?: { id: number; job: string }[] } | undefined)?.crew
        ?.filter((c) => c.job === 'Director')
        .map((c) => c.id) ?? [],
    ),
    year: details.release_date ? Number(details.release_date.slice(0, 4)) : null,
  }
}

function bump(map: Map<number, number>, key: number, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount)
}

/**
 * Merge several seed films into one taste vector. Each film contributes equally,
 * so a trait shared across seeds naturally outweighs a one-off.
 */
export function buildTasteVector(
  seeds: MovieFeatures[],
  quizGenreIds: number[] = [],
): TasteVector {
  const vector: TasteVector = {
    genres: new Map(),
    keywords: new Map(),
    cast: new Map(),
    directors: new Map(),
    years: [],
    seedIds: new Set(seeds.map((s) => s.id)),
  }

  for (const seed of seeds) {
    for (const id of seed.genres) bump(vector.genres, id, 1)
    for (const id of seed.keywords) bump(vector.keywords, id, 1)
    for (const id of seed.cast) bump(vector.cast, id, 1)
    for (const id of seed.directors) bump(vector.directors, id, 1)
    if (seed.year) vector.years.push(seed.year)
  }

  // Quiz answers are a softer signal than an actual film the user named.
  for (const id of quizGenreIds) bump(vector.genres, id, 0.6)

  return vector
}

/** Ids ordered by weight, strongest first. */
export function topIds(map: Map<number, number>, limit: number): number[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}

export function averageYear(vector: TasteVector): number | null {
  if (!vector.years.length) return null
  return Math.round(vector.years.reduce((a, b) => a + b, 0) / vector.years.length)
}
