import { z } from 'zod';

import { movieWatchedSchema } from '@/features/movies/domain/movie';

export const watchMovieRequestSchema = movieWatchedSchema;

export type WatchMovieRequestType = z.infer<typeof watchMovieRequestSchema>;

export const watchMovieResponseSchema = z.object({
  eventId: z.string(),
});

export type WatchMovieResponseType = z.infer<typeof watchMovieResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()).optional(),
});

export type ApiErrorType = z.infer<typeof apiErrorSchema>;
