export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
}

export interface TmdbListResponse<T = Movie> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface Genre {
  id: number
  name: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface Video {
  key: string
  site: string
  type: string
  name: string
}

export interface Keyword {
  id: number
  name: string
}

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

/** One country's availability, as returned by TMDB (sourced from JustWatch). */
export interface WatchProviderCountry {
  link?: string
  flatrate?: WatchProvider[]
  rent?: WatchProvider[]
  buy?: WatchProvider[]
  free?: WatchProvider[]
}

export interface MovieDetails extends Movie {
  runtime: number | null
  tagline?: string
  genres: Genre[]
  credits?: { cast: CastMember[] }
  videos?: { results: Video[] }
  keywords?: { keywords: Keyword[] }
  similar?: TmdbListResponse<Movie>
  recommendations?: TmdbListResponse<Movie>
  'watch/providers'?: { results: Record<string, WatchProviderCountry> }
}
