import { afterEach, describe, expect, it, vi } from 'vitest';

import { EmailSendError, sendEmail } from '@/lib/email/resend';

const send = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

vi.mock('@/config/env', () => ({
  getEnv: () => ({ RESEND_API_KEY: 're_test', EMAIL_FROM: 'Meadow <onboarding@resend.dev>' }),
}));

afterEach(() => {
  send.mockReset();
});

const email = {
  to: 'peter@test.com',
  subject: 'Plot summary: The Matrix (1999)',
  html: '<p>plot</p>',
  text: 'plot',
  idempotencyKey: 'movie-plot/evt_1',
};

function resendError(statusCode: number | null, name = 'application_error') {
  return { data: null, error: { name, message: 'nope', statusCode } };
}

async function sendError(): Promise<unknown> {
  return sendEmail(email).catch((err: unknown) => err);
}

describe('sendEmail', () => {
  it('sends from EMAIL_FROM and passes the idempotency key as an option, not in the payload', async () => {
    send.mockResolvedValue({ data: { id: 'email_123' }, error: null });

    await expect(sendEmail(email)).resolves.toEqual({ id: 'email_123' });
    expect(send).toHaveBeenCalledWith(
      {
        from: 'Meadow <onboarding@resend.dev>',
        to: 'peter@test.com',
        subject: email.subject,
        html: email.html,
        text: email.text,
      },
      { idempotencyKey: 'movie-plot/evt_1' },
    );
  });

  it.each([
    { case: 'invalid recipient (422)', statusCode: 422, retryable: false },
    { case: 'unverified domain (403)', statusCode: 403, retryable: false },
    { case: 'idempotent request in flight (409)', statusCode: 409, retryable: true },
    { case: 'rate limited (429)', statusCode: 429, retryable: true },
    { case: 'server error (500)', statusCode: 500, retryable: true },
    { case: 'network failure (no status)', statusCode: null, retryable: true },
  ])('maps $case to retryable: $retryable', async ({ statusCode, retryable }) => {
    send.mockResolvedValue(resendError(statusCode));

    const err = await sendError();
    expect(err).toBeInstanceOf(EmailSendError);
    expect(err).toMatchObject({ retryable });
  });

  it('keeps the Resend error name and message for the logs', async () => {
    send.mockResolvedValue(resendError(422, 'validation_error'));

    await expect(sendError()).resolves.toMatchObject({ message: 'Resend validation_error: nope' });
  });
});
