import 'server-only';

import type { DevOptionsType } from '@/features/movies/dev/options';
import { MovieNotFoundError, MovieProviderError } from '@/features/movies/domain/errors';
import type { MovieServiceDepsType } from '@/features/movies/service';
import { EmailSendError } from '@/lib/email/resend';

// Simulated outages retry after this instead of Inngest's backoff (15s and up),
// so testing a recovering fault takes seconds, not minutes.
export const SIMULATED_RETRY_AFTER_MS = 2_000;

const simulated = new WeakSet<Error>();

// True for errors thrown by withFaults, as opposed to the real providers.
export function isSimulatedFault(err: unknown): boolean {
  return err instanceof Error && simulated.has(err);
}

function simulate<E extends Error>(err: E): E {
  simulated.add(err);
  return err;
}

// Wraps the real deps so the chosen faults throw the same errors the real
// providers would. `attempt` is Inngest's zero-based retry count for the current step.
export function withFaults(
  deps: MovieServiceDepsType,
  dev: DevOptionsType | undefined,
  attempt: number,
): MovieServiceDepsType {
  if (!dev) return deps;

  const failsThisAttempt = attempt < dev.failAttempts;

  return {
    async findMovieByTitle(title) {
      switch (dev.omdb) {
        case 'not-found':
          throw simulate(new MovieNotFoundError(title));
        case 'transient':
          if (failsThisAttempt) {
            throw simulate(new MovieProviderError(`[dev] simulated OMDb outage (attempt ${attempt + 1})`, true));
          }
          break;
        case 'permanent':
          throw simulate(new MovieProviderError('[dev] simulated OMDb rejection', false));
      }
      return deps.findMovieByTitle(title);
    },

    async sendEmail(email) {
      switch (dev.resend) {
        case 'transient':
          if (failsThisAttempt) {
            throw simulate(new EmailSendError(`[dev] simulated Resend outage (attempt ${attempt + 1})`, true));
          }
          break;
        case 'permanent':
          throw simulate(new EmailSendError('[dev] simulated Resend rejection', false));
      }
      return deps.sendEmail(email);
    },
  };
}
