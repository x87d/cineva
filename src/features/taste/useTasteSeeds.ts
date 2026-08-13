import { useMemo } from 'react'
import { useLibrary } from '@/features/library/hooks'
import { loadTaste } from './storage'

/**
 * Where the user's taste comes from, in priority order:
 * films they rated 4–5 stars, then their taste-test picks.
 * Logging a film you loved therefore sharpens the feed immediately.
 */
export function useTasteSeeds() {
  const { watched, isLoading } = useLibrary()

  return useMemo(() => {
    const stored = loadTaste()
    const loved = watched
      .filter((w) => (w.rating ?? 0) >= 4)
      .slice(0, 8)
      .map((w) => w.tmdb_id)

    const seedIds = loved.length ? loved : (stored?.seedIds ?? [])
    const quizGenreIds = stored?.quizGenreIds ?? []

    return {
      seedIds,
      quizGenreIds,
      hasTaste: seedIds.length > 0 || quizGenreIds.length > 0,
      fromLibrary: loved.length > 0,
      isLoading,
    }
  }, [watched, isLoading])
}
