import { afterEach, describe, expect, it, vi } from 'vitest';

import { handleWatchMovie } from '@/features/movies/handler/http';
import { inngest } from '@/lib/inngest/client';

const send = vi.spyOn(inngest, 'send');
const consoleError = vi.spyOn(console, 'error');

afterEach(() => {
  send.mockReset();
  consoleError.mockReset();
});

function post(body: unknown): Request {
  return new Request('http://localhost/api/watch-movie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const valid = { movie_title: 'The Matrix', recipient_email: 'peter@test.com' };

describe('handleWatchMovie', () => {
  it('publishes the event and answers 202 with its id', async () => {
    send.mockResolvedValue({ ids: ['evt_1'] });

    const response = await handleWatchMovie(post(valid));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ eventId: 'evt_1' });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ name: 'meadow_api/movie.watched', data: valid }));
  });

  it('trims the title before publishing', async () => {
    send.mockResolvedValue({ ids: ['evt_1'] });

    await handleWatchMovie(post({ ...valid, movie_title: '  The Matrix  ' }));

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ data: valid }));
  });

  it('rejects a body that is not JSON with 400', async () => {
    const response = await handleWatchMovie(post('not json'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Request body must be valid JSON' });
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects invalid fields with 400 and per-field messages', async () => {
    const response = await handleWatchMovie(post({ movie_title: ' ', recipient_email: 'nope' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid input',
      fieldErrors: {
        movie_title: ['Enter a movie title'],
        recipient_email: ['Enter a valid email address'],
      },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('answers 502 when the event cannot be published', async () => {
    send.mockRejectedValue(new Error('Inngest unreachable'));
    consoleError.mockImplementation(() => {});

    const response = await handleWatchMovie(post(valid));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Could not queue your request. Please try again.' });
    expect(consoleError).toHaveBeenCalledWith('[watch-movie] failed to send event', expect.any(Error));
  });
});
