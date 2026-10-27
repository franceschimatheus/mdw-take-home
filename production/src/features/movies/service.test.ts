import { describe, expect, it, vi } from 'vitest';

import { MovieNotFoundError } from '@/features/movies/domain/errors';
import { createMovieService, type MovieServiceDepsType } from '@/features/movies/service';
import { matrix } from '@/features/movies/testing/fixtures';

function setup(overrides: Partial<MovieServiceDepsType> = {}) {
  const deps: MovieServiceDepsType = {
    findMovieByTitle: vi.fn(async () => matrix),
    sendEmail: vi.fn(async () => ({ id: 'email_123' })),
    ...overrides,
  };
  return { deps, service: createMovieService(deps) };
}

describe('findMovie', () => {
  it('looks the movie up by trimmed title', async () => {
    const { deps, service } = setup();

    await expect(service.findMovie('  The Matrix ')).resolves.toEqual(matrix);
    expect(deps.findMovieByTitle).toHaveBeenCalledWith('The Matrix');
  });

  it('propagates domain errors untouched', async () => {
    const { service } = setup({
      findMovieByTitle: async (title) => {
        throw new MovieNotFoundError(title);
      },
    });

    await expect(service.findMovie('Nope')).rejects.toMatchObject({
      name: 'MovieNotFoundError',
      retryable: false,
    });
  });
});

describe('sendPlotEmail', () => {
  it('sends the rendered plot email to the recipient with the idempotency key', async () => {
    const { deps, service } = setup();

    await expect(service.sendPlotEmail(matrix, 'peter@test.com', 'movie-plot/evt_1')).resolves.toEqual({
      id: 'email_123',
    });
    expect(deps.sendEmail).toHaveBeenCalledWith({
      to: 'peter@test.com',
      idempotencyKey: 'movie-plot/evt_1',
      subject: 'Plot summary: The Matrix (1999)',
      html: expect.stringContaining('A computer hacker learns about the true nature of reality.'),
      text: expect.stringContaining('A computer hacker learns about the true nature of reality.'),
    });
  });

  it('renders the poster with alt text', async () => {
    const { deps, service } = setup();

    await service.sendPlotEmail(matrix, 'peter@test.com', 'key');
    const [{ html }] = vi.mocked(deps.sendEmail).mock.calls[0]!;
    expect(html).toContain('src="https://m.media-amazon.com/images/M/matrix.jpg"');
    expect(html).toContain('alt="The Matrix poster"');
  });
});
