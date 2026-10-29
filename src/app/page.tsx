import { WatchMovieCard } from '@/features/movies/components/WatchMovieCard';

export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <WatchMovieCard />

        <p className="mt-4 text-center text-xs text-subtle-foreground">
          Movie data from OMDb · Emails sent with Resend · Orchestrated by Inngest
        </p>
      </div>
    </main>
  );
}
