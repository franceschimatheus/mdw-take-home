import { FormAlert } from '@/components/FormAlert';
import { RequestProgress } from '@/features/movies/components/RequestProgress';
import type { MovieWatchedType } from '@/features/movies/domain/movie';
import type { WatchMovieResponseType } from '@/features/movies/handler/http.contract';
import { useMovieRequestStatus } from '@/features/movies/hooks/useMovieRequestStatus';

const INNGEST_DEV_URL = 'http://localhost:8288';

type Props = {
  request: WatchMovieResponseType;
  submitted: MovieWatchedType;
  onDismiss: () => void;
};

// Live progress for a queued request, shared by both form variants.
export function RequestStatusAlert({ request, submitted, onDismiss }: Props) {
  const updates = useMovieRequestStatus(request);

  const devLink = process.env.NODE_ENV === 'development' && (
    <a
      href={INNGEST_DEV_URL}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-block font-medium underline underline-offset-2"
    >
      Follow the run in the Inngest Dev Server
    </a>
  );

  // No live updates available: fall back to copy that doesn't over-promise.
  if (!updates) {
    return (
      <FormAlert variant="success" title="Request received" onDismiss={onDismiss}>
        <p>
          We&apos;re looking up <strong>{submitted.movie_title}</strong>. If we find it, the plot will land in{' '}
          {submitted.recipient_email} within a minute.
        </p>
        {devLink}
      </FormAlert>
    );
  }

  return (
    <RequestProgress
      updates={updates}
      submitted={submitted}
      onDismiss={onDismiss}
      footer={devLink && <span className="text-muted-foreground">{devLink}</span>}
    />
  );
}
