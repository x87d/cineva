import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { bulkImport } from '@/features/library/api'
import {
  parseLetterboxdCsv,
  matchAll,
  toCinevaRating,
  type LetterboxdRow,
  type MatchResult,
} from '@/features/import/letterboxd'
import { posterUrl, releaseYear } from '@/lib/format'

type Stage = 'pick' | 'matching' | 'review' | 'done'

const MAX_ROWS = 1200

const CONFIDENCE_STYLE = {
  high: 'border-accent-violet/40 bg-accent-violet/10 text-accent-violet',
  medium: 'border-white/15 bg-white/5 text-muted',
  low: 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral',
  none: 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral',
} as const

const CONFIDENCE_LABEL = {
  high: 'Confident',
  medium: 'Likely',
  low: 'Check this',
  none: 'No match',
} as const

export function ImportLetterboxd() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement | null>(null)

  const [stage, setStage] = useState<Stage>('pick')
  const [rows, setRows] = useState<LetterboxdRow[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState({ watched: 0, watchlist: 0 })

  async function handleFiles(files: FileList) {
    setError(null)
    const collected: LetterboxdRow[] = []

    for (const file of Array.from(files)) {
      if (!/\.csv$/i.test(file.name)) continue
      try {
        const text = await file.text()
        collected.push(...parseLetterboxdCsv(text, file.name))
      } catch {
        setError(`Could not read ${file.name}.`)
        return
      }
    }

    if (!collected.length) {
      setError(
        "No films found. Make sure you're uploading the CSV files from your Letterboxd export (ratings.csv, diary.csv, watched.csv or watchlist.csv) — not the zip itself.",
      )
      return
    }

    const capped = collected.slice(0, MAX_ROWS)
    setRows(capped)
    setStage('matching')
    setProgress({ done: 0, total: capped.length })

    const matched = await matchAll(capped, (done, total) => setProgress({ done, total }))
    setResults(matched)
    setStage('review')
  }

  function toggle(index: number) {
    setResults((current) =>
      current.map((result, i) =>
        i === index && result.movie ? { ...result, selected: !result.selected } : result,
      ),
    )
  }

  function setAll(selected: boolean) {
    setResults((current) =>
      current.map((result) => (result.movie ? { ...result, selected } : result)),
    )
  }

  async function confirmImport() {
    setError(null)
    const chosen = results.filter((r) => r.selected && r.movie)

    const watched = chosen
      .filter((r) => r.row.kind === 'watched')
      .map((r) => ({ tmdb_id: r.movie!.id, rating: toCinevaRating(r.row.rating) }))
    const watchlist = chosen
      .filter((r) => r.row.kind === 'watchlist')
      .map((r) => r.movie!.id)

    try {
      await bulkImport(user?.id ?? null, watched, watchlist)
      await queryClient.invalidateQueries()
      setSummary({ watched: watched.length, watchlist: watchlist.length })
      setStage('done')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const selectedCount = results.filter((r) => r.selected).length
  const unmatched = results.filter((r) => !r.movie)

  if (stage === 'done') {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">Import complete</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Added {summary.watched} watched film{summary.watched === 1 ? '' : 's'}
          {summary.watchlist ? ` and ${summary.watchlist} to your watchlist` : ''}. Your taste
          profile just got a lot richer.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={() => navigate('/feed')}
            className="rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            See your feed
          </button>
          <Link
            to="/my-taste"
            className="rounded-lg border border-white/10 bg-surface px-5 py-2.5 text-sm text-fg transition hover:border-white/25"
          >
            View your taste
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
          Import from Letterboxd
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Bring your watch history across and Cineva learns from hundreds of films instead of five.
          Everything stays yours — nothing is shared or published.
        </p>
      </div>

      {stage === 'pick' ? (
        <>
          <ol className="space-y-3 rounded-2xl border border-white/5 bg-surface p-6 text-sm text-muted">
            <li>
              <span className="mr-2 text-accent-violet">1.</span>
              On Letterboxd, go to <span className="text-fg">Settings → Data → Export Your Data</span>.
            </li>
            <li>
              <span className="mr-2 text-accent-violet">2.</span>
              Unzip the download. You'll see <span className="text-fg">ratings.csv</span>,{' '}
              <span className="text-fg">diary.csv</span>, <span className="text-fg">watched.csv</span>{' '}
              and <span className="text-fg">watchlist.csv</span>.
            </li>
            <li>
              <span className="mr-2 text-accent-violet">3.</span>
              Pick the CSVs below — <span className="text-fg">ratings.csv</span> gives the most
              useful signal. You can select several at once.
            </li>
          </ol>

          <div>
            <button
              onClick={() => fileInput.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-white/15 bg-surface/50 px-6 py-12 text-center transition hover:border-accent-violet/50"
            >
              <p className="font-display text-base font-medium text-fg">Choose your CSV files</p>
              <p className="mt-1 text-sm text-muted">ratings.csv, diary.csv, watchlist.csv…</p>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {!user ? (
            <p className="rounded-xl border border-white/10 bg-surface p-4 text-xs leading-relaxed text-muted">
              You're not signed in, so this will save to this browser only. Sign in first if you
              want it kept across devices — or import now and sign in later; it'll come with you.
            </p>
          ) : null}
        </>
      ) : null}

      {stage === 'matching' ? (
        <div className="rounded-2xl border border-white/5 bg-surface p-8 text-center">
          <p className="font-display text-base text-fg">Matching your films to TMDB…</p>
          <p className="mt-1 text-sm text-muted">
            {progress.done} of {progress.total}
          </p>
          <div className="mx-auto mt-5 h-2 w-full max-w-md overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-accent-violet transition-all duration-300"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : null}

      {stage === 'review' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-surface p-4">
            <p className="text-sm text-fg">
              <span className="font-medium">{selectedCount}</span> of {results.length} selected
              {unmatched.length ? ` · ${unmatched.length} couldn't be matched` : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAll(true)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-fg transition hover:border-white/25"
              >
                Select all
              </button>
              <button
                onClick={() => setAll(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-fg transition hover:border-white/25"
              >
                Clear all
              </button>
            </div>
          </div>

          <p className="text-xs text-muted">
            Uncertain matches are unticked — tick any that look right. Letterboxd's half-stars are
            rounded to the nearest whole star.
          </p>

          <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {results.map((result, index) => {
              const poster = result.movie ? posterUrl(result.movie.poster_path, 'w185') : null
              return (
                <li
                  key={`${result.row.title}-${index}`}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    result.selected ? 'border-accent-violet/40 bg-accent-violet/5' : 'border-white/5 bg-surface'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={result.selected}
                    disabled={!result.movie}
                    onChange={() => toggle(index)}
                    aria-label={`Import ${result.row.title}`}
                    className="h-4 w-4 shrink-0 accent-[#6C5CE7]"
                  />

                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-surface2">
                    {poster ? <img src={poster} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">
                      {result.movie?.title ?? result.row.title}
                      {result.movie ? (
                        <span className="ml-1.5 text-xs text-muted">
                          {releaseYear(result.movie.release_date)}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      from “{result.row.title}
                      {result.row.year ? ` (${result.row.year})` : ''}”
                      {result.row.rating ? ` · ${result.row.rating}★ → ${toCinevaRating(result.row.rating)}★` : ''}
                      {result.row.kind === 'watchlist' ? ' · watchlist' : ''}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${CONFIDENCE_STYLE[result.confidence]}`}
                  >
                    {CONFIDENCE_LABEL[result.confidence]}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-6">
            <button
              onClick={() => void confirmImport()}
              disabled={!selectedCount}
              className="rounded-lg bg-accent-violet px-6 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
            >
              Import {selectedCount} film{selectedCount === 1 ? '' : 's'}
            </button>
            <button
              onClick={() => {
                setStage('pick')
                setResults([])
                setRows([])
              }}
              className="text-sm text-muted transition hover:text-fg"
            >
              Start over
            </button>
          </div>
        </>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-accent-coral/30 bg-accent-coral/10 p-4 text-sm leading-relaxed text-accent-coral">
          {error}
        </p>
      ) : null}

      {rows.length >= MAX_ROWS ? (
        <p className="text-xs text-muted">
          Showing the first {MAX_ROWS} films — plenty for a taste profile. Import again for more.
        </p>
      ) : null}
    </div>
  )
}
