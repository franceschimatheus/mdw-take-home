import { NonRetriableError, RetryAfterError } from 'inngest';

import { isSimulatedFault, SIMULATED_RETRY_AFTER_MS, withFaults } from '@/features/movies/dev/faults';
import { devToolsEnabled } from '@/features/movies/dev/options';
import { MovieNotFoundError } from '@/features/movies/domain/errors';
import { movieRequestChannel } from '@/features/movies/realtime';
import { findMovieByTitle } from '@/features/movies/repository/omdb';
import { createMovieService } from '@/features/movies/service';
import { sendEmail } from '@/lib/email/resend';
import { inngest, movieWatchedEvent } from '@/lib/inngest/client';
import { markPermanentErrors } from '@/lib/inngest/errors';

const deps = { findMovieByTitle, sendEmail };

const RETRIES = 10;

// Playground wrapper around markPermanentErrors: before a retryable error goes
// back to Inngest, `onRetry` tells the browser, so it hears about it before the backoff.
async function runStep<T>(fn: () => Promise<T>, onRetry: () => Promise<unknown>): Promise<T> {
  try {
    return await markPermanentErrors(fn);
  } catch (err) {
    if (err instanceof NonRetriableError) throw err;
    // Progress is best effort: never let it replace the real error.
    await onRetry().catch((publishErr: unknown) => {
      console.error('[send-movie-plot-email] retry publish failed', publishErr);
    });
    // Dev fault injection: skip the real backoff so simulated outages recover quickly.
    if (isSimulatedFault(err)) {
      throw new RetryAfterError((err as Error).message, SIMULATED_RETRY_AFTER_MS, { cause: err });
    }
    throw err;
  }
}

export const movieWatched = inngest.createFunction(
  {
    id: 'send-movie-plot-email',
    triggers: [movieWatchedEvent],
    retries: RETRIES,
    throttle: { limit: 2, period: '1s' },
    onFailure: async ({ event, error }) => {
      const eventId = event.data.event.id;
      if (eventId) await inngest.realtime.publish(movieRequestChannel(eventId).status, { stage: 'failed' });
      console.error('[send-movie-plot-email] failed', {
        runId: event.data.run_id,
        data: event.data.event.data,
        error: error.message,
      });
    },
  },
  async ({ event, step, runId, attempt }) => {
    const { movie_title, recipient_email } = event.data;
    const dev = devToolsEnabled ? event.data.dev : undefined;
    const movieService = createMovieService(withFaults(deps, dev, attempt));

    // Progress updates for the browser; skipped if the event has no id to name the channel.
    const status = event.id ? movieRequestChannel(event.id).status : null;

    // Called from inside a failing step, where `attempt` is that step's
    // zero-based attempt. Silent on the last attempt: onFailure reports that.
    const retrying = (step: 'lookup' | 'email') => async () => {
      if (!status || attempt >= RETRIES) return;
      await inngest.realtime.publish(status, {
        stage: 'retrying',
        step,
        attempt: attempt + 2,
        maxAttempts: RETRIES + 1,
      });
    };

    // Dev aid: durable pause before each step, to watch progress in the UI.
    const delayMs = dev?.delayMs ?? 0;
    const delay = (id: string) => (delayMs > 0 ? step.sleep(id, delayMs) : undefined);

    await delay('delay-fetch-movie');

    // An unknown title is an expected outcome, not a failure: report it and stop.
    const movie = await step.run('fetch-movie', () =>
      runStep(
        () =>
          movieService.findMovie(movie_title).catch((err: unknown) => {
            if (err instanceof MovieNotFoundError) return null;
            throw err;
          }),
        retrying('lookup'),
      ),
    );

    if (!movie) {
      if (status) await step.realtime.publish('publish-not-found', status, { stage: 'not-found' });
      return { emailId: null, movie: null };
    }

    if (status) await step.realtime.publish('publish-sending', status, { stage: 'sending' });

    await delay('delay-send-email');

    const idempotencyKey = `movie-plot/${event.id ?? runId}`;

    const sent = await step.run('send-email', () =>
      runStep(() => movieService.sendPlotEmail(movie, recipient_email, idempotencyKey), retrying('email')),
    );

    if (status) await step.realtime.publish('publish-sent', status, { stage: 'sent' });

    return { emailId: sent.id, movie: movie.title };
  },
);
