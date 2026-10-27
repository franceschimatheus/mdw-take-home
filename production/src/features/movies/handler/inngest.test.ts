import { InngestTestEngine } from '@inngest/test';
import { NonRetriableError } from 'inngest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MovieNotFoundError, MovieProviderError } from '@/features/movies/domain/errors';
import { movieWatched } from '@/features/movies/handler/inngest';
import { findMovieByTitle } from '@/features/movies/repository/omdb';
import { matrix } from '@/features/movies/testing/fixtures';
import { EmailSendError, sendEmail } from '@/lib/email/resend';

vi.mock('@/features/movies/repository/omdb', () => ({ findMovieByTitle: vi.fn() }));

vi.mock('@/lib/email/resend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/email/resend')>()),
  sendEmail: vi.fn(),
}));

const findMovie = vi.mocked(findMovieByTitle);
const send = vi.mocked(sendEmail);

beforeEach(() => {
  // The SDK logs every failed step; expected here.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.resetAllMocks();
});

const t = new InngestTestEngine({
  function: movieWatched,
  events: [
    {
      id: 'evt_1',
      name: 'meadow_api/movie.watched',
      data: { movie_title: 'The Matrix', recipient_email: 'peter@test.com' },
    },
  ],
});

describe('send-movie-plot-email', () => {
  it('fetches the movie, then emails the plot with an idempotency key tied to the event', async () => {
    findMovie.mockResolvedValue(matrix);
    send.mockResolvedValue({ id: 'email_123' });

    const { result, error, ctx } = await t.execute();

    expect(error).toBeUndefined();
    expect(result).toEqual({ emailId: 'email_123', movie: 'The Matrix' });
    expect(ctx.step.run).toHaveBeenNthCalledWith(1, 'fetch-movie', expect.any(Function));
    expect(ctx.step.run).toHaveBeenNthCalledWith(2, 'send-email', expect.any(Function));
    expect(findMovie).toHaveBeenCalledWith('The Matrix');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'peter@test.com', idempotencyKey: 'movie-plot/evt_1' }),
    );
  });

  it('fails without retries and sends nothing when the movie does not exist', async () => {
    findMovie.mockRejectedValue(new MovieNotFoundError('The Matrix'));

    const { error } = await t.execute();

    expect(error).toMatchObject({ name: NonRetriableError.name, message: 'Movie not found: "The Matrix"' });
    expect(send).not.toHaveBeenCalled();
  });

  it('leaves a transient OMDb failure for Inngest to retry', async () => {
    findMovie.mockRejectedValue(new MovieProviderError('OMDb returned 502', true));

    const { error } = await t.execute();

    expect(error).toMatchObject({ name: 'MovieProviderError', message: 'OMDb returned 502' });
    expect(send).not.toHaveBeenCalled();
  });

  it('fails without retries when Resend rejects the email permanently', async () => {
    findMovie.mockResolvedValue(matrix);
    send.mockRejectedValue(new EmailSendError('Resend validation_error: invalid recipient', false));

    const { error } = await t.execute();

    expect(error).toMatchObject({ name: NonRetriableError.name });
    expect(findMovie).toHaveBeenCalledTimes(1);
  });

  it('leaves a transient Resend failure for Inngest to retry, without fetching the movie again', async () => {
    findMovie.mockResolvedValue(matrix);
    send.mockRejectedValue(new EmailSendError('Resend rate_limit_exceeded: slow down', true));

    const { error } = await t.execute();

    expect(error).toMatchObject({ name: 'EmailSendError', message: 'Resend rate_limit_exceeded: slow down' });
    expect(findMovie).toHaveBeenCalledTimes(1);
  });
});
