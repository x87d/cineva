import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchMovies } from '@/lib/tmdb'
import { PosterGrid } from '@/components/PosterGrid'
import { SkeletonGrid } from '@/components/states/SkeletonGrid'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { SearchBar } from '@/components/SearchBar'

export function Search() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMovies(query),
    enabled: query.length > 0,
  })
  const movies = data?.results ?? []

  return (
    <div className="space-y-8">
      <div className="sm:hidden">
        <SearchBar />
      </div>

      {query.length === 0 ? (
        <EmptyState title="Search for a film" hint="Type a title in the box above to find movies." />
      ) : (
        <section>
          <h1 className="mb-6 font-display text-xl font-semibold text-fg">
            Results for <span className="text-accent-coral">“{query}”</span>
          </h1>
          {isLoading ? (
            <SkeletonGrid />
          ) : isError ? (
            <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
          ) : movies.length === 0 ? (
            <EmptyState title={`No films found for “${query}”.`} hint="Try a different title or spelling." />
          ) : (
            <PosterGrid movies={movies} />
          )}
        </section>
      )}
    </div>
  )
}
