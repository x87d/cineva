import { supabase } from '@/lib/supabase'
import { localLibrary } from './local'
import type { WatchedEntry, WatchlistEntry } from './types'

/**
 * One library API over two backends: Supabase when signed in (synced across
 * devices), localStorage when not (so visitors lose nothing by staying anonymous).
 */
export async function fetchWatched(userId: string | null): Promise<WatchedEntry[]> {
  if (!userId || !supabase) return localLibrary.watched()
  const { data, error } = await supabase
    .from('watched')
    .select('tmdb_id, rating, watched_at')
    .order('watched_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchWatchlist(userId: string | null): Promise<WatchlistEntry[]> {
  if (!userId || !supabase) return localLibrary.watchlist()
  const { data, error } = await supabase
    .from('watchlist')
    .select('tmdb_id, added_at')
    .order('added_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function setWatched(
  userId: string | null,
  tmdbId: number,
  rating: number | null,
): Promise<void> {
  if (!userId || !supabase) return localLibrary.setWatched(tmdbId, rating)
  const { error } = await supabase
    .from('watched')
    .upsert({ user_id: userId, tmdb_id: tmdbId, rating }, { onConflict: 'user_id,tmdb_id' })
  if (error) throw new Error(error.message)
}

export async function removeWatched(userId: string | null, tmdbId: number): Promise<void> {
  if (!userId || !supabase) return localLibrary.removeWatched(tmdbId)
  const { error } = await supabase.from('watched').delete().eq('tmdb_id', tmdbId)
  if (error) throw new Error(error.message)
}

export async function addToWatchlist(userId: string | null, tmdbId: number): Promise<void> {
  if (!userId || !supabase) return localLibrary.addWatchlist(tmdbId)
  const { error } = await supabase
    .from('watchlist')
    .upsert({ user_id: userId, tmdb_id: tmdbId }, { onConflict: 'user_id,tmdb_id' })
  if (error) throw new Error(error.message)
}

export async function removeFromWatchlist(userId: string | null, tmdbId: number): Promise<void> {
  if (!userId || !supabase) return localLibrary.removeWatchlist(tmdbId)
  const { error } = await supabase.from('watchlist').delete().eq('tmdb_id', tmdbId)
  if (error) throw new Error(error.message)
}

/** On first sign-in, carry a guest's logged films into their new account. */
export async function migrateGuestLibrary(userId: string): Promise<number> {
  if (!supabase) return 0
  const watched = localLibrary.watched()
  const watchlist = localLibrary.watchlist()
  if (!watched.length && !watchlist.length) return 0

  if (watched.length) {
    await supabase.from('watched').upsert(
      watched.map((w) => ({ user_id: userId, tmdb_id: w.tmdb_id, rating: w.rating })),
      { onConflict: 'user_id,tmdb_id' },
    )
  }
  if (watchlist.length) {
    await supabase.from('watchlist').upsert(
      watchlist.map((w) => ({ user_id: userId, tmdb_id: w.tmdb_id })),
      { onConflict: 'user_id,tmdb_id' },
    )
  }
  localLibrary.clear()
  return watched.length + watchlist.length
}

/** Writes a whole imported list at once, in chunks Supabase is happy with. */
export async function bulkImport(
  userId: string | null,
  watched: { tmdb_id: number; rating: number | null }[],
  watchlist: number[],
): Promise<void> {
  if (!userId || !supabase) {
    localLibrary.bulkAdd(watched, watchlist)
    return
  }

  const CHUNK = 400

  for (let i = 0; i < watched.length; i += CHUNK) {
    const rows = watched.slice(i, i + CHUNK).map((w) => ({
      user_id: userId,
      tmdb_id: w.tmdb_id,
      rating: w.rating,
      source: 'letterboxd',
    }))
    const { error } = await supabase.from('watched').upsert(rows, { onConflict: 'user_id,tmdb_id' })
    if (error) throw new Error(error.message)
  }

  for (let i = 0; i < watchlist.length; i += CHUNK) {
    const rows = watchlist.slice(i, i + CHUNK).map((id) => ({ user_id: userId, tmdb_id: id }))
    const { error } = await supabase
      .from('watchlist')
      .upsert(rows, { onConflict: 'user_id,tmdb_id' })
    if (error) throw new Error(error.message)
  }
}
