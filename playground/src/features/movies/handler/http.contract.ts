import { z } from 'zod';

import { devOptionsSchema } from '@/features/movies/dev/options';
import { movieWatchedSchema } from '@/features/movies/domain/movie';

// `dev` is ignored outside development; see handleWatchMovie.
export const watchMovieRequestSchema = movieWatchedSchema.extend({
  dev: devOptionsSchema.optional(),
});

export type WatchMovieRequestType = z.infer<typeof watchMovieRequestSchema>;

export const watchMovieResponseSchema = z.object({
  eventId: z.string(),
  // Subscription token for live progress; null when it couldn't be issued.
  realtimeToken: z.object({ key: z.string(), apiBaseUrl: z.string().optional() }).nullable(),
});

export type WatchMovieResponseType = z.infer<typeof watchMovieResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()).optional(),
});

export type ApiErrorType = z.infer<typeof apiErrorSchema>;
