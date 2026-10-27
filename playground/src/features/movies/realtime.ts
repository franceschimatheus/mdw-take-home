import { channel } from 'inngest/realtime';
import { z } from 'zod';

// Shared by the Inngest function (publisher) and the browser (subscriber).
export const movieRequestStatusSchema = z.union([
  z.object({
    stage: z.enum(['sending', 'sent', 'not-found', 'failed']),
  }),
  // A step failed with a retryable error and Inngest will run it again.
  // `attempt` is the 1-based attempt that comes next, out of `maxAttempts`.
  z.object({
    stage: z.literal('retrying'),
    step: z.enum(['lookup', 'email']),
    attempt: z.number().int().min(2),
    maxAttempts: z.number().int().min(2),
  }),
]);

export type MovieRequestStatusType = z.infer<typeof movieRequestStatusSchema>;

export const movieRequestChannel = channel({
  name: (eventId: string) => `movie-request:${eventId}`,
  topics: {
    status: { schema: movieRequestStatusSchema },
  },
});
