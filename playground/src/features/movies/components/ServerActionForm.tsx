'use client';

import { CircleNotchIcon, EnvelopeSimpleIcon, FilmSlateIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { useActionState, useEffect, useRef, useState } from 'react';

import { FormAlert } from '@/components/FormAlert';
import { TextField } from '@/components/TextField';
import { watchMovieAction, type WatchMovieActionStateType } from '@/features/movies/actions/watch-movie';
import { RequestStatusAlert } from '@/features/movies/components/RequestStatusAlert';
import { DevPanel } from '@/features/movies/dev/DevPanel';
import { devToolsEnabled, hasActiveDevOptions } from '@/features/movies/dev/options';
import { useDevOptions } from '@/features/movies/dev/useDevOptions';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';

type Props = {
  lockedRecipient?: string;
};

// Same flow as WatchMovieForm, built on a Server Action instead of an HTTP
// route + react-query + react-hook-form. No client-side validation: the action
// validates and returns field errors, so the form also works before JS loads.
export function ServerActionForm({ lockedRecipient }: Props) {
  const [state, formAction, isPending] = useActionState<WatchMovieActionStateType, FormData>(watchMovieAction, {
    status: 'idle',
    values: { movie_title: '', recipient_email: lockedRecipient ?? '' },
  });
  const showSpinner = useDelayedFlag(isPending);
  const [devOptions, setDevOptions] = useDevOptions();
  const titleRef = useRef<HTMLInputElement>(null);

  // useActionState has no reset(): remember which result was dismissed instead.
  const [dismissed, setDismissed] = useState<WatchMovieActionStateType | null>(null);
  const result = state === dismissed ? null : state;

  useEffect(() => {
    if (state.status === 'queued') titleRef.current?.focus();
  }, [state]);

  const fieldErrors = state.status === 'invalid' ? state.fieldErrors : {};
  const dev = devToolsEnabled && hasActiveDevOptions(devOptions) ? JSON.stringify(devOptions) : '';

  const handleDismiss = () => {
    setDismissed(state);
    titleRef.current?.focus();
  };

  return (
    <>
      <form
        action={formAction}
        // React queues every submit while an action runs, so a double click
        // would publish two events. Cancel the submit instead.
        onSubmit={(e) => {
          if (isPending) e.preventDefault();
        }}
        noValidate
        aria-busy={isPending}
        className="flex flex-col gap-5"
      >
        <TextField
          ref={titleRef}
          id="movie_title"
          name="movie_title"
          label="Movie title"
          icon={FilmSlateIcon}
          placeholder="The Matrix"
          autoComplete="off"
          defaultValue={state.values.movie_title}
          error={fieldErrors.movie_title?.[0]}
        />

        <TextField
          id="recipient_email"
          name="recipient_email"
          type="email"
          label="Email"
          icon={EnvelopeSimpleIcon}
          placeholder="you@example.com"
          autoComplete="email"
          readOnly={Boolean(lockedRecipient)}
          defaultValue={lockedRecipient ?? state.values.recipient_email}
          hint={lockedRecipient ? "Resend's test mode only delivers to the account owner." : undefined}
          error={fieldErrors.recipient_email?.[0]}
        />

        {dev && <input type="hidden" name="dev" value={dev} />}

        <button
          type="submit"
          aria-disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none active:bg-primary-active aria-disabled:cursor-progress"
        >
          {showSpinner ? (
            <CircleNotchIcon aria-hidden size={18} className="motion-safe:animate-spin" />
          ) : (
            <PaperPlaneTiltIcon aria-hidden size={18} weight="bold" />
          )}
          Email me the plot
        </button>

        <div aria-live="polite" className="empty:hidden">
          {result?.status === 'queued' && (
            <RequestStatusAlert request={result.request} submitted={result.submitted} onDismiss={handleDismiss} />
          )}

          {result?.status === 'error' && (
            <FormAlert variant="error" title="Couldn't queue your request" onDismiss={handleDismiss}>
              <p>{result.error}</p>
              <button
                type="submit"
                className="mt-1 font-medium underline underline-offset-2 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Try again
              </button>
            </FormAlert>
          )}
        </div>
      </form>

      {devToolsEnabled && <DevPanel value={devOptions} onChange={setDevOptions} />}
    </>
  );
}
