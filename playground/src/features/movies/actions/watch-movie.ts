'use server';

import { z } from 'zod';

import type { MovieWatchedType } from '@/features/movies/domain/movie';
import { watchMovieRequestSchema, type WatchMovieResponseType } from '@/features/movies/handler/http.contract';
import { queueMovieRequest } from '@/features/movies/queue';
import { lockedRecipientError } from '@/features/movies/recipient-lock';

type FormValuesType = Pick<MovieWatchedType, 'movie_title' | 'recipient_email'>;

// `values` is echoed back so the form can refill its fields: React resets a
// form after its action runs.
export type WatchMovieActionStateType =
  | { status: 'idle'; values: FormValuesType }
  | { status: 'invalid'; values: FormValuesType; fieldErrors: Partial<Record<keyof FormValuesType, string[]>> }
  | { status: 'error'; values: FormValuesType; error: string }
  | { status: 'queued'; values: FormValuesType; request: WatchMovieResponseType; submitted: MovieWatchedType };

function parseDev(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== 'string' || raw === '') return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Called by <form action>, so it also works before JS loads. A Server Action is
// a public POST endpoint: it validates its input exactly like the HTTP route.
export async function watchMovieAction(
  _prev: WatchMovieActionStateType,
  formData: FormData,
): Promise<WatchMovieActionStateType> {
  const values = {
    movie_title: String(formData.get('movie_title') ?? ''),
    recipient_email: String(formData.get('recipient_email') ?? ''),
  };

  const parsed = watchMovieRequestSchema.safeParse({ ...values, dev: parseDev(formData.get('dev')) });
  if (!parsed.success) {
    return { status: 'invalid', values, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const recipientError = lockedRecipientError(parsed.data.recipient_email);
  if (recipientError) {
    return { status: 'invalid', values, fieldErrors: { recipient_email: [recipientError] } };
  }

  try {
    const request = await queueMovieRequest(parsed.data);
    const { movie_title, recipient_email } = parsed.data;
    // Clear the title for the next movie, keep the email.
    return {
      status: 'queued',
      values: { movie_title: '', recipient_email },
      request,
      submitted: { movie_title, recipient_email },
    };
  } catch (err) {
    console.error('[watch-movie] failed to send event', err);
    return { status: 'error', values, error: 'Could not queue your request. Please try again.' };
  }
}
