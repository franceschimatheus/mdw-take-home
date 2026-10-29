// Every expected failure says whether retrying can help. Errors that don't
// extend AppError (bugs, unknown failures) are treated as retryable.
export abstract class AppError extends Error {
  abstract readonly retryable: boolean;
}

export function isPermanent(err: unknown): err is AppError {
  return err instanceof AppError && !err.retryable;
}
