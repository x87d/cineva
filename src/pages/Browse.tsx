import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { discoverMovies } from '@/lib/tmdb'
import { PosterGrid } from '@/components/PosterGrid'
import { SkeletonGrid } from '@/components/states/SkeletonGrid'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { FilterBar, type Filters } from '@/components/FilterBar'

export function Browse() {
  const [params] = useSearchParams()
  const genreParam = params.get('genre')

  const [filters, setFilters] = useState<Filters>({
    genreId: genreParam ? Number(genreParam) : undefined,
    sortBy: 'popularity.desc',
    minRating: 0,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    useInfiniteQuery({
      queryKey: ['discover', filters],
      queryFn: ({ pageParam }) =>
        discoverMovies({
          genreId: filters.genreId,
          minRating: filters.minRating || undefined,
          sortBy: filters.sortBy,
          page: pageParam,
        }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    })

  const movies = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-xl font-semibold text-fg">Browse</h1>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : movies.length === 0 ? (
        <EmptyState title="No films match those filters." hint="Try widening them." />
      ) : (
        <>
          <PosterGrid movies={movies} />
          {hasNextPage ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-lg border border-white/10 bg-surface px-5 py-2.5 text-sm font-medium text-fg transition hover:border-white/20 disabled:opacity-60"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
