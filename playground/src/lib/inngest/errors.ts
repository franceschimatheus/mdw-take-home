import { NonRetriableError } from 'inngest';

import { isPermanent } from '@/lib/errors';

// Must run inside step.run: any other error thrown by a step is retried.
export async function markPermanentErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isPermanent(err)) throw new NonRetriableError(err.message, { cause: err });
    throw err;
  }
}
