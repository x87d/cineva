import { parseCsv, headerIndex } from './csv'
import { searchMovies } from '@/lib/tmdb'
import type { Movie } from '@/types/movie'

export type EntryKind = 'watched' | 'watchlist'

export interface LetterboxdRow {
  title: string
  year: number | null
  /** Letterboxd's 0.5–5 half-star value, when the film was rated. */
  rating: number | null
  kind: EntryKind
}

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none'

export interface MatchResult {
  row: LetterboxdRow
  movie: Movie | null
  confidence: MatchConfidence
  /** Pre-ticked for import; uncertain matches start unticked. */
  selected: boolean
}

/**
 * Letterboxd rates in half stars (0.5–5); Cineva stores 1–5 whole stars.
 * Rounding up means a 4.5 becomes a 5 — a slight lift for favourites, which
 * suits a taste engine, and it's stated plainly in the UI.
 */
export function toCinevaRating(letterboxdRating: number | null): number | null {
  if (letterboxdRating === null || Number.isNaN(letterboxdRating)) return null
  return Math.min(5, Math.max(1, Math.round(letterboxdRating)))
}

/** Strip articles, punctuation and accents so titles compare fairly. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(the|a|an)\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Reads one exported CSV. The filename tells us watchlist from watched. */
export function parseLetterboxdCsv(text: string, filename: string): LetterboxdRow[] {
  const rows = parseCsv(text)
  if (rows.length < 2) return []

  const index = headerIndex(rows[0])
  const nameCol = index.get('name') ?? index.get('film title') ?? index.get('title')
  const yearCol = index.get('year')
  const ratingCol = index.get('rating') ?? index.get('your rating')

  if (nameCol === undefined) return []

  const kind: EntryKind = /watchlist/i.test(filename) ? 'watchlist' : 'watched'

  const parsed: LetterboxdRow[] = []
  for (const row of rows.slice(1)) {
    const title = (row[nameCol] ?? '').trim()
    if (!title) continue

    const yearRaw = yearCol !== undefined ? Number(row[yearCol]) : NaN
    const ratingRaw = ratingCol !== undefined ? Number(row[ratingCol]) : NaN

    parsed.push({
      title,
      year: Number.isFinite(yearRaw) && yearRaw > 1870 ? yearRaw : null,
      rating: Number.isFinite(ratingRaw) && ratingRaw > 0 ? ratingRaw : null,
      kind,
    })
  }

  // A film can appear in both ratings.csv and diary.csv — keep the rated copy.
  const byKey = new Map<string, LetterboxdRow>()
  for (const row of parsed) {
    const key = `${row.kind}:${normalizeTitle(row.title)}:${row.year ?? ''}`
    const existing = byKey.get(key)
    if (!existing || (existing.rating === null && row.rating !== null)) byKey.set(key, row)
  }
  return [...byKey.values()]
}

/** Scores a TMDB result against the exported row. */
function judge(row: LetterboxdRow, candidate: Movie): MatchConfidence {
  const wanted = normalizeTitle(row.title)
  const found = normalizeTitle(candidate.title)
  const candidateYear = candidate.release_date ? Number(candidate.release_date.slice(0, 4)) : null

  const titleExact = wanted === found
  const yearGap =
    row.year && candidateYear ? Math.abs(row.year - candidateYear) : null

  if (titleExact && yearGap !== null && yearGap <= 1) return 'high'
  if (titleExact && yearGap === null) return 'medium'
  if (titleExact && yearGap !== null && yearGap <= 3) return 'medium'
  if (!titleExact && (found.includes(wanted) || wanted.includes(found))) {
    return yearGap !== null && yearGap <= 1 ? 'medium' : 'low'
  }
  return 'low'
}

export async function matchRow(row: LetterboxdRow): Promise<MatchResult> {
  try {
    const response = await searchMovies(row.title, row.year ?? undefined)
    const results = response.results ?? []
    if (!results.length) return { row, movie: null, confidence: 'none', selected: false }

    let best = results[0]
    let bestConfidence = judge(row, best)

    for (const candidate of results.slice(0, 6)) {
      const confidence = judge(row, candidate)
      const rank = { high: 3, medium: 2, low: 1, none: 0 }
      if (rank[confidence] > rank[bestConfidence]) {
        best = candidate
        bestConfidence = confidence
      }
    }

    return {
      row,
      movie: best,
      confidence: bestConfidence,
      // Only confident matches import automatically; the rest need a look.
      selected: bestConfidence === 'high' || bestConfidence === 'medium',
    }
  } catch {
    return { row, movie: null, confidence: 'none', selected: false }
  }
}

/** Runs matches a few at a time so we don't hammer TMDB. */
export async function matchAll(
  rows: LetterboxdRow[],
  onProgress: (done: number, total: number) => void,
  concurrency = 5,
): Promise<MatchResult[]> {
  const results: MatchResult[] = new Array(rows.length)
  let cursor = 0
  let completed = 0

  async function worker() {
    while (cursor < rows.length) {
      const index = cursor
      cursor += 1
      results[index] = await matchRow(rows[index])
      completed += 1
      onProgress(completed, rows.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker))
  return results
}
