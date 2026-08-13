import type { Movie } from '@/types/movie'

/** A compact content fingerprint of one film, used for similarity scoring. */
export interface MovieFeatures {
  id: number
  genres: Set<number>
  keywords: Set<number>
  cast: Set<number>
  directors: Set<number>
  year: number | null
}

/** What the user likes, aggregated from seed films and/or quiz answers. */
export interface TasteVector {
  genres: Map<number, number>
  keywords: Map<number, number>
  cast: Map<number, number>
  directors: Map<number, number>
  years: number[]
  seedIds: Set<number>
}

export interface Reason {
  kind: 'genre' | 'keyword' | 'cast' | 'director' | 'era'
  label: string
  weight: number
}

export interface Recommendation {
  movie: Movie
  score: number
  reasons: Reason[]
}
