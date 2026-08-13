import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import {
  fetchWatched,
  fetchWatchlist,
  setWatched,
  removeWatched,
  addToWatchlist,
  removeFromWatchlist,
} from './api'

export function useLibrary() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()

  const watched = useQuery({
    queryKey: ['watched', userId],
    queryFn: () => fetchWatched(userId),
  })

  const watchlist = useQuery({
    queryKey: ['watchlist', userId],
    queryFn: () => fetchWatchlist(userId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['watched', userId] })
    void queryClient.invalidateQueries({ queryKey: ['watchlist', userId] })
    void queryClient.invalidateQueries({ queryKey: ['feed'] })
  }

  const rate = useMutation({
    mutationFn: ({ tmdbId, rating }: { tmdbId: number; rating: number | null }) =>
      setWatched(userId, tmdbId, rating),
    onSuccess: invalidate,
  })

  const unwatch = useMutation({
    mutationFn: (tmdbId: number) => removeWatched(userId, tmdbId),
    onSuccess: invalidate,
  })

  const saveToWatchlist = useMutation({
    mutationFn: (tmdbId: number) => addToWatchlist(userId, tmdbId),
    onSuccess: invalidate,
  })

  const unsaveFromWatchlist = useMutation({
    mutationFn: (tmdbId: number) => removeFromWatchlist(userId, tmdbId),
    onSuccess: invalidate,
  })

  return {
    watched: watched.data ?? [],
    watchlist: watchlist.data ?? [],
    isLoading: watched.isLoading || watchlist.isLoading,
    ratingOf: (tmdbId: number) =>
      watched.data?.find((w) => w.tmdb_id === tmdbId)?.rating ?? null,
    isWatched: (tmdbId: number) => Boolean(watched.data?.some((w) => w.tmdb_id === tmdbId)),
    isSaved: (tmdbId: number) => Boolean(watchlist.data?.some((w) => w.tmdb_id === tmdbId)),
    rate,
    unwatch,
    saveToWatchlist,
    unsaveFromWatchlist,
  }
}
