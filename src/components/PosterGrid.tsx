import type { Movie } from '@/types/movie'
import { MovieCard } from './MovieCard'

export function PosterGrid({ movies }: { movies: Movie[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}
