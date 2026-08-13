import type { WatchedEntry, WatchlistEntry } from './types'

/**
 * Guest storage. Visitors get the full logging experience without an account;
 * on sign-up these rows are migrated into Supabase (see migrateGuestLibrary).
 */
const WATCHED_KEY = 'cineva:v1:watched'
const WATCHLIST_KEY = 'cineva:v1:watchlist'

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, rows: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(rows))
  } catch {
    // private mode / quota — the session still works, it just won't persist
  }
}

export const localLibrary = {
  watched: () => read<WatchedEntry>(WATCHED_KEY),
  watchlist: () => read<WatchlistEntry>(WATCHLIST_KEY),

  setWatched(tmdbId: number, rating: number | null) {
    const rows = read<WatchedEntry>(WATCHED_KEY).filter((r) => r.tmdb_id !== tmdbId)
    rows.unshift({ tmdb_id: tmdbId, rating, watched_at: new Date().toISOString() })
    write(WATCHED_KEY, rows)
  },

  removeWatched(tmdbId: number) {
    write(
      WATCHED_KEY,
      read<WatchedEntry>(WATCHED_KEY).filter((r) => r.tmdb_id !== tmdbId),
    )
  },

  addWatchlist(tmdbId: number) {
    const rows = read<WatchlistEntry>(WATCHLIST_KEY).filter((r) => r.tmdb_id !== tmdbId)
    rows.unshift({ tmdb_id: tmdbId, added_at: new Date().toISOString() })
    write(WATCHLIST_KEY, rows)
  },

  removeWatchlist(tmdbId: number) {
    write(
      WATCHLIST_KEY,
      read<WatchlistEntry>(WATCHLIST_KEY).filter((r) => r.tmdb_id !== tmdbId),
    )
  },

  bulkAdd(watched: { tmdb_id: number; rating: number | null }[], watchlist: number[]) {
    if (watched.length) {
      const existing = read<WatchedEntry>(WATCHED_KEY)
      const incoming = new Set(watched.map((w) => w.tmdb_id))
      const merged = [
        ...watched.map((w) => ({
          tmdb_id: w.tmdb_id,
          rating: w.rating,
          watched_at: new Date().toISOString(),
        })),
        ...existing.filter((row) => !incoming.has(row.tmdb_id)),
      ]
      write(WATCHED_KEY, merged)
    }
    if (watchlist.length) {
      const existing = read<WatchlistEntry>(WATCHLIST_KEY)
      const incoming = new Set(watchlist)
      const merged = [
        ...watchlist.map((id) => ({ tmdb_id: id, added_at: new Date().toISOString() })),
        ...existing.filter((row) => !incoming.has(row.tmdb_id)),
      ]
      write(WATCHLIST_KEY, merged)
    }
  },

  clear() {
    write(WATCHED_KEY, [])
    write(WATCHLIST_KEY, [])
  },
}
