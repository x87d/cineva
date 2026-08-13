import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeedPage } from '@/features/recommender/feed'
import { useTasteSeeds } from '@/features/taste/useTasteSeeds'
import { useLibrary } from '@/features/library/hooks'
import { FeedCard } from '@/components/FeedCard'
import { SkeletonGrid } from '@/components/states/SkeletonGrid'
import { ErrorState } from '@/components/states/ErrorState'

export function Feed() {
  const { seedIds, quizGenreIds, hasTaste, fromLibrary } = useTasteSeeds()
  const { watched, isLoading: libraryLoading } = useLibrary()
  const sentinel = useRef<HTMLDivElement | null>(null)

  // Don't recommend films the user has already logged.
  const watchedIds = useMemo(() => watched.map((w) => w.tmdb_id), [watched])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    useInfiniteQuery({
      queryKey: ['feed', seedIds, quizGenreIds, watchedIds],
      queryFn: ({ pageParam }) =>
        getFeedPage({
          page: pageParam,
          seedIds,
          quizGenreIds,
          topGenreIds: quizGenreIds,
          excludeIds: watchedIds,
        }),
      initialPageParam: 1,
      getNextPageParam: (last, all) => (last.length ? all.length + 1 : undefined),
      enabled: hasTaste && !libraryLoading,
      staleTime: 1000 * 60 * 10,
    })

  // Infinite scroll: load the next page as the sentinel enters view.
  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '600px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!hasTaste) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">Your feed is waiting</h1>
        <p className="mt-2 text-sm text-muted">
          Take the taste test — or rate a few films you've seen — and Cineva will fill this with
          picks made for you.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/taste"
            className="rounded-lg bg-accent-violet px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            Take the taste test
          </Link>
          <Link
            to="/wildcard"
            className="rounded-lg border border-white/10 bg-surface px-5 py-2.5 text-sm font-medium text-fg transition hover:border-white/25"
          >
            Try a Wild Card
          </Link>
        </div>
      </div>
    )
  }

  const items = data?.pages.flat() ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">For you</h1>
          <p className="mt-1 text-sm text-muted">
            {fromLibrary
              ? 'Built from the films you rated highly. Keep rating to sharpen it.'
              : 'Built from your taste test. Rate films you watch to sharpen it.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/my-taste"
            className="rounded-lg border border-white/10 bg-surface px-4 py-2 text-sm text-fg transition hover:border-white/25"
          >
            My Taste
          </Link>
          <Link
            to="/wildcard"
            className="rounded-lg border border-accent-coral/40 bg-accent-coral/10 px-4 py-2 text-sm font-medium text-accent-coral transition hover:bg-accent-coral/20"
          >
            🎲 Wild Card
          </Link>
        </div>
      </div>

      {isLoading || libraryLoading ? (
        <SkeletonGrid count={10} />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="columns-2 gap-5 sm:columns-3 lg:columns-4 xl:columns-5">
            {items.map((item, index) => (
              <FeedCard key={`${item.movie.id}-${index}`} item={item} />
            ))}
          </div>
          <div ref={sentinel} className="h-10" />
          {isFetchingNextPage ? (
            <p className="py-4 text-center text-sm text-muted">Loading more…</p>
          ) : null}
        </>
      )}
    </div>
  )
}
