import { Link } from 'react-router-dom'
import { useTasteProfile } from '@/features/taste/useTasteProfile'
import type { MovieDetails } from '@/types/movie'

interface Overlap {
  kind: string
  items: string[]
}

/**
 * Extends the recommendation explanation onto the details page: recomputes what
 * this film shares with the user's taste, so the "why" survives the click-through
 * (and works on a direct visit too).
 */
export function WhyRecommended({ movie }: { movie: MovieDetails }) {
  const taste = useTasteProfile()

  if (!taste.hasTaste || taste.isLoading) return null
  // Don't explain a film back to the user using itself.
  if (taste.sourceMovies.some((m) => m.id === movie.id)) return null

  const genreIds = new Set(movie.genres?.map((g) => g.id) ?? [])
  const keywordIds = new Set(movie.keywords?.keywords?.map((k) => k.id) ?? [])
  const castIds = new Set(movie.credits?.cast?.slice(0, 10).map((c) => c.id) ?? [])
  const crew = (movie.credits as { crew?: { id: number; job: string }[] } | undefined)?.crew
  const directorIds = new Set(crew?.filter((m) => m.job === 'Director').map((m) => m.id) ?? [])

  const overlaps: Overlap[] = []

  const sharedDirectors = taste.directors.filter((d) => directorIds.has(d.id)).map((d) => d.name)
  if (sharedDirectors.length) overlaps.push({ kind: 'Directed by someone you follow', items: sharedDirectors })

  const sharedKeywords = taste.keywords.filter((k) => keywordIds.has(k.id)).map((k) => k.name)
  if (sharedKeywords.length) overlaps.push({ kind: 'Themes you gravitate to', items: sharedKeywords.slice(0, 5) })

  const sharedActors = taste.actors.filter((a) => castIds.has(a.id)).map((a) => a.name)
  if (sharedActors.length) overlaps.push({ kind: 'Actors you keep watching', items: sharedActors.slice(0, 4) })

  const sharedGenres = taste.genres.filter((g) => genreIds.has(g.id)).map((g) => g.name)
  if (sharedGenres.length) overlaps.push({ kind: 'Genres you favour', items: sharedGenres.slice(0, 4) })

  if (!overlaps.length) {
    return (
      <section className="rounded-2xl border border-white/5 bg-surface p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-fg">Why this?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This one sits outside your usual patterns — no shared themes, people, or genres with the
          films you've rated. That's not a bad thing: it might be a stretch worth taking.
        </p>
      </section>
    )
  }

  const strength = overlaps.reduce((sum, o) => sum + o.items.length, 0)
  const verdict =
    strength >= 6
      ? 'A strong match for your taste.'
      : strength >= 3
        ? 'A solid match for your taste.'
        : 'A loose match — related, but a little outside your usual.'

  return (
    <section className="rounded-2xl border border-accent-violet/20 bg-accent-violet/5 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-fg">Why this?</h2>
        <Link to="/my-taste" className="text-xs text-accent-violet hover:underline">
          See your taste →
        </Link>
      </div>
      <p className="mt-1.5 text-sm text-muted">{verdict}</p>

      <div className="mt-4 space-y-3">
        {overlaps.map((overlap) => (
          <div key={overlap.kind}>
            <p className="text-xs uppercase tracking-wider text-muted">{overlap.kind}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {overlap.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-1 text-xs text-accent-violet"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
