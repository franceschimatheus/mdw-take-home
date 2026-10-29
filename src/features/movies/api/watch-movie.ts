import {
  apiErrorSchema,
  type WatchMovieRequestType,
  watchMovieResponseSchema,
  type WatchMovieResponseType,
} from '@/features/movies/handler/http.contract';

const WATCH_MOVIE_URL = '/api/watch-movie';

export class WatchMovieRequestError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'rejected',
  ) {
    super(message);
    this.name = 'WatchMovieRequestError';
  }
}

export async function postWatchMovie(input: WatchMovieRequestType): Promise<WatchMovieResponseType> {
  let response: Response;
  try {
    response = await fetch(WATCH_MOVIE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new WatchMovieRequestError('Check your connection and try again.', 'network');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = apiErrorSchema.safeParse(body);
    throw new WatchMovieRequestError(
      apiError.success ? apiError.data.error : `The server responded with ${response.status}. Please try again.`,
      'rejected',
    );
  }

  return watchMovieResponseSchema.parse(body);
}
