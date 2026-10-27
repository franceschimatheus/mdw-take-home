import { WatchMovieCard } from '@/features/movies/components/WatchMovieCard';

type Props = {
  variant: 'react-query' | 'server-action';
  description: string;
};

export function MoviePage({ variant, description }: Props) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-4 text-center text-xs text-subtle-foreground">{description}</p>

        <WatchMovieCard variant={variant} />

        <p className="mt-4 text-center text-xs text-subtle-foreground">
          Movie data from OMDb · Emails sent with Resend · Orchestrated by Inngest
        </p>
      </div>
    </main>
  );
}
