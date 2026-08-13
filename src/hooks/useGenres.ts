import { useQuery } from '@tanstack/react-query'
import { getGenres } from '@/lib/tmdb'

/** Genre list rarely changes, so cache it for the session. */
export function useGenres() {
  const { data } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: Infinity,
  })
  return data?.genres ?? []
}
