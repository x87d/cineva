import { useGenres } from '@/hooks/useGenres'

export interface Filters {
  genreId?: number
  sortBy: string
  minRating: number
}

const SORTS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'vote_average.desc', label: 'Top rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
]

const RATINGS = [
  { value: 0, label: 'Any rating' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
]

const selectClass =
  'rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-fg focus:border-accent-violet focus:outline-none'

export function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const genres = useGenres()

  return (
    <div className="flex flex-wrap gap-3">
      <select
        aria-label="Genre"
        className={selectClass}
        value={filters.genreId ?? ''}
        onChange={(e) => onChange({ ...filters, genreId: e.target.value ? Number(e.target.value) : undefined })}
      >
        <option value="">All genres</option>
        {genres.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort by"
        className={selectClass}
        value={filters.sortBy}
        onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Minimum rating"
        className={selectClass}
        value={filters.minRating}
        onChange={(e) => onChange({ ...filters, minRating: Number(e.target.value) })}
      >
        {RATINGS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  )
}
