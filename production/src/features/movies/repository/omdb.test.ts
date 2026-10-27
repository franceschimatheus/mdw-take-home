import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MovieNotFoundError, MovieProviderError } from '@/features/movies/domain/errors';
import { findMovieByTitle } from '@/features/movies/repository/omdb';

vi.mock('@/config/env', () => ({
  getEnv: () => ({ OMDB_API_KEY: 'test-key' }),
}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const omdbMatrix = {
  Response: 'True',
  Title: 'The Matrix',
  Year: '1999',
  Plot: 'A hacker learns the truth.',
  Poster: 'https://m.media-amazon.com/images/M/matrix.jpg',
  Runtime: '136 min',
  Genre: 'Action, Sci-Fi',
  Director: 'Lana Wachowski, Lilly Wachowski',
  imdbRating: '8.7',
};

async function lookupError(title = 'The Matrix'): Promise<unknown> {
  try {
    await findMovieByTitle(title);
  } catch (err) {
    return err;
  }
  throw new Error('Expected findMovieByTitle to throw');
}

describe('findMovieByTitle', () => {
  it('maps the OMDb payload to the domain movie and queries by exact title', async () => {
    fetchMock.mockResolvedValue(jsonResponse(omdbMatrix));

    await expect(findMovieByTitle('The Matrix')).resolves.toEqual({
      title: 'The Matrix',
      year: '1999',
      plot: 'A hacker learns the truth.',
      poster: 'https://m.media-amazon.com/images/M/matrix.jpg',
      runtime: '136 min',
      genre: 'Action, Sci-Fi',
      director: 'Lana Wachowski, Lilly Wachowski',
      imdbRating: '8.7',
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get('t')).toBe('The Matrix');
    expect(url.searchParams.get('apikey')).toBe('test-key');
    expect(url.searchParams.get('plot')).toBe('full');
  });

  it('keeps OMDb\'s "N/A" placeholder as is', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...omdbMatrix, Year: 'N/A', Plot: 'N/A', Poster: 'N/A' }));

    await expect(findMovieByTitle('The Matrix')).resolves.toMatchObject({
      year: 'N/A',
      plot: 'N/A',
      poster: 'N/A',
    });
  });

  it.each([
    {
      case: 'movie not found (200)',
      status: 200,
      error: 'Movie not found!',
      type: MovieNotFoundError,
      retryable: false,
    },
    {
      case: 'invalid API key (401)',
      status: 401,
      error: 'Invalid API key!',
      type: MovieProviderError,
      retryable: false,
    },
    {
      case: 'missing API key (401)',
      status: 401,
      error: 'No API key provided.',
      type: MovieProviderError,
      retryable: false,
    },
    {
      case: 'daily limit reached (401)',
      status: 401,
      error: 'Request limit reached!',
      type: MovieProviderError,
      retryable: true,
    },
  ])('maps $case by the body, not the status', async ({ status, error, type, retryable }) => {
    fetchMock.mockResolvedValue(jsonResponse({ Response: 'False', Error: error }, status));

    const err = await lookupError();
    expect(err).toBeInstanceOf(type);
    expect(err).toMatchObject({ retryable });
  });

  it('treats a non-JSON 5xx (e.g. proxy error page) as transient', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));

    const err = await lookupError();
    expect(err).toBeInstanceOf(MovieProviderError);
    expect(err).toMatchObject({ retryable: true, message: 'OMDb returned 502' });
  });

  it('treats timeouts and network failures as transient', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));

    const err = await lookupError();
    expect(err).toBeInstanceOf(MovieProviderError);
    expect(err).toMatchObject({ retryable: true });
  });

  it('rejects an unexpected payload as permanent', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ Response: 'True', Title: 'The Matrix' }));

    const err = await lookupError();
    expect(err).toBeInstanceOf(MovieProviderError);
    expect(err).toMatchObject({ retryable: false });
  });
});
