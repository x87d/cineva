import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchMovies } from '@/lib/tmdb'
import { useGenres } from '@/hooks/useGenres'
import { posterUrl, releaseYear } from '@/lib/format'
import { saveTaste } from '@/features/taste/storage'
import type { Movie } from '@/types/movie'

const MIN_PICKS = 3
const MAX_PICKS = 5

export function TasteTest() {
  const navigate = useNavigate()
  const genres = useGenres()
  const [step, setStep] = useState<1 | 2>(1)
  const [picks, setPicks] = useState<Movie[]>([])
  const [query, setQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])

  const { data, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMovies(query),
    enabled: query.trim().length > 1,
  })
  const results = (data?.results ?? []).slice(0, 12)

  function togglePick(movie: Movie) {
    setPicks((current) => {
      if (current.some((m) => m.id === movie.id)) return current.filter((m) => m.id !== movie.id)
      if (current.length >= MAX_PICKS) return current
      return [...current, movie]
    })
  }

  function toggleGenre(id: number) {
    setSelectedGenres((current) =>
      current.includes(id) ? current.filter((g) => g !== id) : [...current, id],
    )
  }

  function finish() {
    saveTaste(picks.map((m) => m.id), selectedGenres)
    const params = new URLSearchParams()
    params.set('seeds', picks.map((m) => m.id).join(','))
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','))
    navigate(`/recommendations?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-accent-violet">
          Step {step} of 2
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-fg">
          {step === 1 ? 'Pick films you love' : 'What are you in the mood for?'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {step === 1
            ? `Choose ${MIN_PICKS}–${MAX_PICKS} favourites. They tell Cineva what you're drawn to.`
            : 'Optional — pick any genres you enjoy to sharpen the results.'}
        </p>
      </div>

      {step === 1 ? (
        <>
          {picks.length ? (
            <div className="flex flex-wrap gap-2">
              {picks.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => togglePick(movie)}
                  className="flex items-center gap-2 rounded-full border border-accent-violet/40 bg-accent-violet/10 py-1 pl-3 pr-2 text-sm text-fg"
                >
                  {movie.title}
                  <span className="text-accent-violet" aria-label={`Remove ${movie.title}`}>✕</span>
                </button>
              ))}
            </div>
          ) : null}

          <Link
            to="/import"
            className="flex items-center justify-between gap-3 rounded-xl border border-accent-violet/30 bg-accent-violet/5 px-4 py-3 transition hover:border-accent-violet/60"
          >
            <span className="text-sm text-fg">
              Already on Letterboxd?{' '}
              <span className="text-muted">Import your history for far better recommendations.</span>
            </span>
            <span className="shrink-0 text-sm text-accent-violet">Import →</span>
          </Link>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a film you love…"
            aria-label="Search films"
            className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-fg placeholder:text-muted/70 focus:border-accent-violet focus:outline-none"
          />

          {isFetching ? (
            <p className="text-sm text-muted">Searching…</p>
          ) : results.length ? (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {results.map((movie) => {
                const selected = picks.some((m) => m.id === movie.id)
                const poster = posterUrl(movie.poster_path, 'w342')
                return (
                  <button
                    key={movie.id}
                    onClick={() => togglePick(movie)}
                    aria-pressed={selected}
                    className={`overflow-hidden rounded-lg bg-surface text-left ring-2 transition ${
                      selected ? 'ring-accent-violet' : 'ring-transparent hover:ring-white/20'
                    }`}
                  >
                    <div className="aspect-[2/3] w-full bg-surface2">
                      {poster ? (
                        <img src={poster} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-[11px] text-muted">
                          {movie.title}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-xs font-medium text-fg">{movie.title}</p>
                      <p className="text-[11px] text-muted">{releaseYear(movie.release_date)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : query.trim().length > 1 ? (
            <p className="text-sm text-muted">No films found. Try another title.</p>
          ) : null}

          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            <span className="text-sm text-muted">
              {picks.length} of {MAX_PICKS} selected
            </span>
            <button
              disabled={picks.length < MIN_PICKS}
              onClick={() => setStep(2)}
              className="rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {picks.length < MIN_PICKS ? `Pick ${MIN_PICKS - picks.length} more` : 'Continue'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const selected = selectedGenres.includes(genre.id)
              return (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  aria-pressed={selected}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selected
                      ? 'border-accent-violet bg-accent-violet/15 text-fg'
                      : 'border-white/10 text-muted hover:border-white/25 hover:text-fg'
                  }`}
                >
                  {genre.name}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            <button onClick={() => setStep(1)} className="text-sm text-muted transition hover:text-fg">
              ← Back
            </button>
            <button
              onClick={finish}
              className="rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              Get my recommendations
            </button>
          </div>
        </>
      )}
    </div>
  )
}
