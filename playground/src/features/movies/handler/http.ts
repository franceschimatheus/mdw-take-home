import 'server-only';

import { z } from 'zod';

import {
  type ApiErrorType,
  watchMovieRequestSchema,
  type WatchMovieResponseType,
} from '@/features/movies/handler/http.contract';
import { queueMovieRequest } from '@/features/movies/queue';

export async function handleWatchMovie(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON' } satisfies ApiErrorType, { status: 400 });
  }

  const parsed = watchMovieRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid input', fieldErrors: z.flattenError(parsed.error).fieldErrors } satisfies ApiErrorType,
      { status: 400 },
    );
  }

  try {
    const queued = await queueMovieRequest(parsed.data);
    return Response.json(queued satisfies WatchMovieResponseType, { status: 202 });
  } catch (err) {
    console.error('[watch-movie] failed to send event', err);
    return Response.json({ error: 'Could not queue your request. Please try again.' } satisfies ApiErrorType, {
      status: 502,
    });
  }
}
