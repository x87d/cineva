import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getMovieDetails } from '@/lib/tmdb'
import type { MovieDetails } from '@/types/movie'
import { useTasteSeeds } from './useTasteSeeds'
import { useLibrary } from '@/features/library/hooks'

export interface TasteTrait {
  id: number
  name: string
  /** How many of the user's films share this trait. */
  count: number
  /** 0–1, relative to the strongest trait in the same category. */
  strength: number
}

export interface TasteProfileData {
  genres: TasteTrait[]
  keywords: TasteTrait[]
  directors: TasteTrait[]
  actors: TasteTrait[]
  decades: { label: string; count: number; strength: number }[]
  sourceMovies: MovieDetails[]
  isLoading: boolean
  hasTaste: boolean
  fromLibrary: boolean
}

interface Tally {
  name: string
  count: number
}

function rank(tally: Map<number, Tally>, limit: number): TasteTrait[] {
  const rows = [...tally.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, limit)
  const max = rows[0]?.[1].count ?? 1
  return rows.map(([id, entry]) => ({
    id,
    name: entry.name,
    count: entry.count,
    strength: entry.count / max,
  }))
}

function bump(tally: Map<number, Tally>, id: number, name: string) {
  const existing = tally.get(id)
  if (existing) existing.count += 1
  else tally.set(id, { name, count: 1 })
}

/**
 * The taste profile, made visible: aggregates the traits shared across the films
 * the user rated highly (or picked in the taste test) so they can see what the
 * recommender actually learned about them.
 */
export function useTasteProfile(): TasteProfileData {
  const { seedIds, hasTaste, fromLibrary } = useTasteSeeds()
  const { watched } = useLibrary()

  // Weight by rating: a 5★ film speaks louder than a 4★ one.
  const ratingOf = useMemo(() => {
    const map = new Map<number, number>()
    for (const row of watched) if (row.rating) map.set(row.tmdb_id, row.rating)
    return map
  }, [watched])

  const queries = useQueries({
    queries: seedIds.slice(0, 12).map((id) => ({
      queryKey: ['movie', String(id)],
      queryFn: () => getMovieDetails(id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const movies = useMemo(
    () => queries.map((q) => q.data).filter((d): d is MovieDetails => Boolean(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queries.map((q) => q.data?.id).join(',')],
  )

  return useMemo(() => {
    const genres = new Map<number, Tally>()
    const keywords = new Map<number, Tally>()
    const directors = new Map<number, Tally>()
    const actors = new Map<number, Tally>()
    const decades = new Map<number, number>()

    for (const movie of movies) {
      // A 5★ film contributes twice; everything else once.
      const weight = (ratingOf.get(movie.id) ?? 0) >= 5 ? 2 : 1

      for (let i = 0; i < weight; i += 1) {
        for (const g of movie.genres ?? []) bump(genres, g.id, g.name)
        for (const k of movie.keywords?.keywords ?? []) bump(keywords, k.id, k.name)
        for (const c of movie.credits?.cast?.slice(0, 6) ?? []) bump(actors, c.id, c.name)
        const crew = (movie.credits as { crew?: { id: number; name: string; job: string }[] } | undefined)?.crew
        for (const d of crew?.filter((m) => m.job === 'Director') ?? []) bump(directors, d.id, d.name)
      }

      const year = Number(movie.release_date?.slice(0, 4))
      if (Number.isFinite(year)) {
        const decade = Math.floor(year / 10) * 10
        decades.set(decade, (decades.get(decade) ?? 0) + 1)
      }
    }

    const decadeRows = [...decades.entries()].sort((a, b) => a[0] - b[0])
    const decadeMax = Math.max(1, ...decadeRows.map(([, count]) => count))

    return {
      genres: rank(genres, 8),
      keywords: rank(keywords, 12),
      directors: rank(directors, 6),
      actors: rank(actors, 8),
      decades: decadeRows.map(([decade, count]) => ({
        label: `${decade}s`,
        count,
        strength: count / decadeMax,
      })),
      sourceMovies: movies,
      isLoading,
      hasTaste,
      fromLibrary,
    }
  }, [movies, ratingOf, isLoading, hasTaste, fromLibrary])
}
