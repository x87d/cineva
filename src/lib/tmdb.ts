import type { Movie, MovieDetails, TmdbListResponse } from '@/types/movie'

/** Thin client for our own /api proxy. The TMDB key never reaches the browser. */
async function api<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // response had no JSON body; keep the generic message
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export function getTrending(): Promise<TmdbListResponse<Movie>> {
  return api<TmdbListResponse<Movie>>('/api/trending')
}

export function searchMovies(query: string, year?: number): Promise<TmdbListResponse<Movie>> {
  const suffix = year ? `&year=${year}` : ''
  return api<TmdbListResponse<Movie>>(`/api/search?q=${encodeURIComponent(query)}${suffix}`)
}

export function getMovieDetails(id: number | string): Promise<MovieDetails> {
  return api<MovieDetails>(`/api/movie?id=${id}`)
}

export interface GenreListResponse {
  genres: { id: number; name: string }[]
}

export function getGenres(): Promise<GenreListResponse> {
  return api<GenreListResponse>('/api/genres')
}

export interface DiscoverFilters {
  genreId?: number
  minRating?: number
  sortBy?: string
  page?: number
}

export function discoverMovies(filters: DiscoverFilters): Promise<TmdbListResponse<Movie>> {
  const params = new URLSearchParams()
  if (filters.genreId) params.set('with_genres', String(filters.genreId))
  if (filters.minRating) {
    params.set('vote_average.gte', String(filters.minRating))
    params.set('vote_count.gte', '50') // avoid tiny-sample films inflating the rating filter
  }
  params.set('sort_by', filters.sortBy ?? 'popularity.desc')
  params.set('page', String(filters.page ?? 1))
  return api<TmdbListResponse<Movie>>(`/api/discover?${params.toString()}`)
}
