const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export type PosterSize = 'w185' | 'w342' | 'w500' | 'original'
export type BackdropSize = 'w780' | 'w1280' | 'original'

export function posterUrl(path: string | null, size: PosterSize = 'w342'): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null
}

export function backdropUrl(path: string | null, size: BackdropSize = 'w1280'): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null
}

export function profileUrl(path: string | null): string | null {
  return path ? `${IMAGE_BASE}/w185${path}` : null
}

export function releaseYear(date: string | undefined): string {
  return date && date.length >= 4 ? date.slice(0, 4) : '—'
}

export function formatRating(value: number | undefined): string {
  return typeof value === 'number' && value > 0 ? value.toFixed(1) : '—'
}

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours ? `${hours}h ${mins}m` : `${mins}m`
}
