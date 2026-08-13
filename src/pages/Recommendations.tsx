import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRecommendations } from '@/features/recommender/recommend'
import { RecommendationGrid } from '@/components/RecommendationGrid'
import { SkeletonGrid } from '@/components/states/SkeletonGrid'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { loadTaste } from '@/features/taste/storage'

function parseIds(value: string | null): number[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

export function Recommendations() {
  const [params] = useSearchParams()
  const stored = loadTaste()

  const seedIds = parseIds(params.get('seeds')) .length
    ? parseIds(params.get('seeds'))
    : (stored?.seedIds ?? [])
  const quizGenreIds = parseIds(params.get('genres')).length
    ? parseIds(params.get('genres'))
    : (stored?.quizGenreIds ?? [])

  const hasInput = seedIds.length > 0 || quizGenreIds.length > 0

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recommendations', seedIds, quizGenreIds],
    queryFn: () => getRecommendations({ seedIds, quizGenreIds }),
    enabled: hasInput,
    staleTime: 1000 * 60 * 10,
  })

  if (!hasInput) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">No taste on file yet</h1>
        <p className="mt-2 text-sm text-muted">
          Take the quick taste test and Cineva will build your recommendations.
        </p>
        <Link
          to="/taste"
          className="mt-6 inline-block rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          Start the taste test
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
            Recommended for you
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Built from {seedIds.length} film{seedIds.length === 1 ? '' : 's'} you picked
            {quizGenreIds.length ? ` and ${quizGenreIds.length} favourite genres` : ''}. Each chip
            shows why it matched.
          </p>
        </div>
        <Link
          to="/taste"
          className="shrink-0 rounded-lg border border-white/10 bg-surface px-4 py-2 text-sm text-fg transition hover:border-white/25"
        >
          Redo taste test
        </Link>
      </div>

      {isLoading ? (
        <>
          <p className="text-sm text-muted">Reading your taste and scoring candidates…</p>
          <SkeletonGrid count={10} />
        </>
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState
          title="Couldn't find strong matches."
          hint="Try picking a few different films in the taste test."
        />
      ) : (
        <RecommendationGrid items={data} />
      )}
    </div>
  )
}
