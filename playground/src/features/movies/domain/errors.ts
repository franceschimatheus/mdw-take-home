import { AppError } from '@/lib/errors';

export class MovieNotFoundError extends AppError {
  readonly retryable = false;

  constructor(title: string) {
    super(`Movie not found: "${title}"`);
    this.name = 'MovieNotFoundError';
  }
}

export class MovieProviderError extends AppError {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'MovieProviderError';
  }
}
