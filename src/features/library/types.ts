export interface WatchedEntry {
  tmdb_id: number
  rating: number | null
  watched_at: string
}

export interface WatchlistEntry {
  tmdb_id: number
  added_at: string
}
