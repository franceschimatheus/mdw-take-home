import { MoviePage } from '@/features/movies/components/MoviePage';

export default function HomePage() {
  return (
    <MoviePage
      variant="react-query"
      description="POST /api/watch-movie with react-query; react-hook-form validates on the client."
    />
  );
}
