import { findMovieByTitle } from '@/features/movies/repository/omdb';
import { createMovieService } from '@/features/movies/service';
import { sendEmail } from '@/lib/email/resend';
import { inngest, movieWatchedEvent } from '@/lib/inngest/client';
import { markPermanentErrors } from '@/lib/inngest/errors';

const movieService = createMovieService({ findMovieByTitle, sendEmail });

export const movieWatched = inngest.createFunction(
  {
    id: 'send-movie-plot-email',
    triggers: [movieWatchedEvent],
    retries: 10,
    throttle: { limit: 2, period: '1s' },
    onFailure: async ({ event, error }) => {
      console.error('[send-movie-plot-email] failed', {
        runId: event.data.run_id,
        data: event.data.event.data,
        error: error.message,
      });
    },
  },
  async ({ event, step, runId }) => {
    const { movie_title, recipient_email } = event.data;

    const movie = await step.run('fetch-movie', () => markPermanentErrors(() => movieService.findMovie(movie_title)));

    const idempotencyKey = `movie-plot/${event.id ?? runId}`;

    const sent = await step.run('send-email', () =>
      markPermanentErrors(() => movieService.sendPlotEmail(movie, recipient_email, idempotencyKey)),
    );

    return { emailId: sent.id, movie: movie.title };
  },
);
