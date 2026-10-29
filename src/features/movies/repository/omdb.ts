import 'server-only';

import { z } from 'zod';

import { getEnv } from '@/config/env';
import { MovieNotFoundError, MovieProviderError } from '@/features/movies/domain/errors';
import type { MovieType } from '@/features/movies/domain/movie';

const OMDB_URL = 'https://www.omdbapi.com/';
const TIMEOUT_MS = 10_000;

const omdbErrorSchema = z.object({
  Response: z.literal('False'),
  Error: z.string(),
});

const omdbMovieSchema = z.object({
  Title: z.string(),
  Year: z.string(),
  Plot: z.string(),
  Poster: z.string(),
  Runtime: z.string(),
  Genre: z.string(),
  Director: z.string(),
  imdbRating: z.string(),
});

function toMovie(omdb: z.infer<typeof omdbMovieSchema>): MovieType {
  return {
    title: omdb.Title,
    year: omdb.Year,
    plot: omdb.Plot,
    poster: omdb.Poster,
    runtime: omdb.Runtime,
    genre: omdb.Genre,
    director: omdb.Director,
    imdbRating: omdb.imdbRating,
  };
}

export async function findMovieByTitle(title: string): Promise<MovieType> {
  const url = new URL(OMDB_URL);
  url.searchParams.set('apikey', getEnv().OMDB_API_KEY);
  url.searchParams.set('t', title);
  url.searchParams.set('plot', 'full');

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new MovieProviderError(`OMDb request failed: ${err instanceof Error ? err.message : String(err)}`, true);
  }

  // Body before status: OMDb sends "Movie not found!" with 200 and its rate limit with 401.
  const body: unknown = await response.json().catch(() => null);

  const omdbError = omdbErrorSchema.safeParse(body);
  if (omdbError.success) {
    switch (omdbError.data.Error) {
      case 'Movie not found!':
        throw new MovieNotFoundError(title);
      case 'Request limit reached!':
        throw new MovieProviderError('OMDb request limit reached', true);
      default:
        throw new MovieProviderError(`OMDb error: ${omdbError.data.Error}`, false);
    }
  }

  if (!response.ok) {
    throw new MovieProviderError(`OMDb returned ${response.status}`, true);
  }

  const omdbMovie = omdbMovieSchema.safeParse(body);
  if (!omdbMovie.success) {
    throw new MovieProviderError('OMDb returned an unexpected payload', false);
  }
  return toMovie(omdbMovie.data);
}
