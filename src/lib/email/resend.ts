import 'server-only';

import { Resend } from 'resend';

import { getEnv } from '@/config/env';
import { AppError } from '@/lib/errors';

export type OutgoingEmailType = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export class EmailSendError extends AppError {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'EmailSendError';
  }
}

function isRetryable(statusCode: number | null): boolean {
  return statusCode === null || statusCode === 409 || statusCode === 429 || statusCode >= 500;
}

let client: Resend | null = null;

function getClient(): Resend {
  client ??= new Resend(getEnv().RESEND_API_KEY);
  return client;
}

export async function sendEmail({ idempotencyKey, ...email }: OutgoingEmailType): Promise<{ id: string }> {
  const { data, error } = await getClient().emails.send({ from: getEnv().EMAIL_FROM, ...email }, { idempotencyKey });

  if (error) {
    throw new EmailSendError(`Resend ${error.name}: ${error.message}`, isRetryable(error.statusCode));
  }
  return { id: data.id };
}
