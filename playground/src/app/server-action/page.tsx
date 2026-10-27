import { MoviePage } from '@/features/movies/components/MoviePage';

export default function ServerActionPage() {
  return (
    <MoviePage
      variant="server-action"
      description="<form action> calls a Server Action; validation runs only on the server, so it works without JS."
    />
  );
}
