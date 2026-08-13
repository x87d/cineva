import { Link } from 'react-router-dom'
import { useTasteProfile, type TasteTrait } from '@/features/taste/useTasteProfile'
import { posterUrl } from '@/lib/format'
import { EmptyState } from '@/components/states/EmptyState'

function TraitBars({ title, traits, accent }: { title: string; traits: TasteTrait[]; accent: 'violet' | 'coral' }) {
  if (!traits.length) return null
  const barColor = accent === 'violet' ? 'bg-accent-violet' : 'bg-accent-coral'
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {traits.map((trait) => (
          <li key={trait.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-fg">{trait.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted">{trait.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                style={{ width: `${Math.max(8, trait.strength * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MyTaste() {
  const taste = useTasteProfile()

  if (!taste.hasTaste) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">Nothing to read yet</h1>
        <p className="mt-2 text-sm text-muted">
          Take the taste test or rate a few films you've seen, and Cineva will show you exactly what
          it learned.
        </p>
        <Link
          to="/taste"
          className="mt-6 inline-block rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          Take the taste test
        </Link>
      </div>
    )
  }

  const topGenre = taste.genres[0]?.name
  const topKeyword = taste.keywords[0]?.name
  const topDirector = taste.directors.find((d) => d.count > 1)?.name

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Your taste</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {taste.fromLibrary
            ? 'Read from the films you rated highly — the same signals the recommender uses.'
            : 'Read from your taste test picks — the same signals the recommender uses.'}{' '}
          Rate more films and this sharpens.
        </p>

        {topGenre ? (
          <p className="mt-5 max-w-2xl rounded-xl border border-accent-violet/20 bg-accent-violet/5 p-4 text-sm leading-relaxed text-fg">
            You lean toward <span className="font-medium text-accent-violet">{topGenre}</span>
            {topKeyword ? (
              <>
                {' '}
                with a recurring thread of{' '}
                <span className="font-medium text-accent-violet">{topKeyword}</span>
              </>
            ) : null}
            {topDirector ? (
              <>
                , and you keep coming back to{' '}
                <span className="font-medium text-accent-violet">{topDirector}</span>
              </>
            ) : null}
            .
          </p>
        ) : null}
      </section>

      {taste.isLoading ? (
        <p className="text-sm text-muted">Reading your films…</p>
      ) : (
        <>
          <section className="grid gap-8 sm:grid-cols-2">
            <TraitBars title="Genres" traits={taste.genres} accent="violet" />
            <TraitBars title="Themes & keywords" traits={taste.keywords} accent="coral" />
            <TraitBars title="Directors" traits={taste.directors} accent="violet" />
            <TraitBars title="Actors you keep watching" traits={taste.actors} accent="coral" />
          </section>

          {taste.decades.length ? (
            <section>
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted">
                Eras
              </h3>
              <div className="flex items-end gap-3">
                {taste.decades.map((decade) => (
                  <div key={decade.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-24 w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-accent-violet/40 to-accent-violet transition-all duration-500"
                        style={{ height: `${Math.max(10, decade.strength * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{decade.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {taste.sourceMovies.length ? (
            <section>
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted">
                Built from these films
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {taste.sourceMovies.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/5 transition hover:ring-accent-violet/40"
                  >
                    <img
                      src={posterUrl(movie.poster_path, 'w185') ?? ''}
                      alt={movie.title}
                      className="w-full"
                    />
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <EmptyState title="No films to read yet." />
          )}

          <div className="flex flex-wrap gap-3 border-t border-white/5 pt-6">
            <Link
              to="/feed"
              className="rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              See your feed
            </Link>
            <Link
              to="/taste"
              className="rounded-lg border border-white/10 bg-surface px-5 py-2.5 text-sm text-fg transition hover:border-white/25"
            >
              Redo taste test
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
