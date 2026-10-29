import { NonRetriableError } from 'inngest';
import { describe, expect, it } from 'vitest';

import { AppError } from '@/lib/errors';
import { markPermanentErrors } from '@/lib/inngest/errors';

class TestError extends AppError {
  constructor(readonly retryable: boolean) {
    super(retryable ? 'transient' : 'permanent');
  }
}

async function failWith(err: Error): Promise<unknown> {
  return markPermanentErrors(async () => {
    throw err;
  }).catch((thrown: unknown) => thrown);
}

describe('markPermanentErrors', () => {
  it('returns the result when nothing fails', async () => {
    await expect(markPermanentErrors(async () => 42)).resolves.toBe(42);
  });

  it('turns non-retryable errors into NonRetriableError, keeping the cause', async () => {
    const err = new TestError(false);
    const thrown = await failWith(err);

    expect(thrown).toBeInstanceOf(NonRetriableError);
    expect(thrown).toMatchObject({ message: err.message, cause: err });
  });

  it('rethrows retryable errors untouched', async () => {
    const err = new TestError(true);
    expect(await failWith(err)).toBe(err);
  });

  it('rethrows unknown errors untouched, so Inngest retries them', async () => {
    const err = new TypeError('boom');
    expect(await failWith(err)).toBe(err);
  });
});
