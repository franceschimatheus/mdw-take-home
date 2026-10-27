'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleNotchIcon, EnvelopeSimpleIcon, FilmSlateIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';

import { FormAlert } from '@/components/FormAlert';
import { TextField } from '@/components/TextField';
import { WatchMovieRequestError } from '@/features/movies/api/watch-movie';
import { movieWatchedSchema, type MovieWatchedType } from '@/features/movies/domain/movie';
import { useWatchMovie } from '@/features/movies/hooks/useWatchMovie';

const INNGEST_DEV_URL = 'http://localhost:8288';

type Props = {
  lockedRecipient?: string;
};

function errorTitle(error: Error): string {
  if (error instanceof WatchMovieRequestError && error.kind === 'network') return "Couldn't reach the server";
  return "Couldn't queue your request";
}

export function WatchMovieForm({ lockedRecipient }: Props) {
  const watchMovie = useWatchMovie();
  const isPending = watchMovie.isPending;

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setFocus,
    formState: { errors },
  } = useForm<MovieWatchedType>({
    resolver: zodResolver(movieWatchedSchema),
    defaultValues: { movie_title: '', recipient_email: lockedRecipient ?? '' },
    mode: 'onTouched',
  });

  // The button stays enabled while pending (disabling it drops keyboard focus),
  // so double submits are blocked here instead.
  const handleFormSubmit = handleSubmit((values) => {
    if (isPending) return;

    watchMovie.mutate(values, {
      onSuccess: () => {
        // Don't wipe a title the user started typing while the request was in flight.
        if (getValues('movie_title') === values.movie_title) {
          reset({ movie_title: '', recipient_email: values.recipient_email });
        }
        setFocus('movie_title');
      },
    });
  });

  // Clears the result banner. The email (if any) still goes out; this only
  // tidies the screen.
  const handleDismiss = () => {
    watchMovie.reset();
    setFocus('movie_title');
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate aria-busy={isPending} className="flex flex-col gap-5">
      <TextField
        id="movie_title"
        label="Movie title"
        icon={FilmSlateIcon}
        placeholder="The Matrix"
        autoComplete="off"
        error={errors.movie_title?.message}
        {...register('movie_title')}
      />

      <TextField
        id="recipient_email"
        type="email"
        label="Email"
        icon={EnvelopeSimpleIcon}
        placeholder="you@example.com"
        autoComplete="email"
        readOnly={Boolean(lockedRecipient)}
        defaultValue={lockedRecipient}
        hint={lockedRecipient ? "Resend's test mode only delivers to the account owner." : undefined}
        error={errors.recipient_email?.message}
        {...register('recipient_email')}
      />

      <button
        type="submit"
        aria-disabled={isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none active:bg-primary-active aria-disabled:cursor-progress"
      >
        {isPending ? (
          <CircleNotchIcon aria-hidden size={18} className="motion-safe:animate-spin" />
        ) : (
          <PaperPlaneTiltIcon aria-hidden size={18} weight="bold" />
        )}
        Email me the plot
      </button>

      <div aria-live="polite" className="empty:hidden">
        {watchMovie.isSuccess && (
          <FormAlert variant="success" title="Request received" onDismiss={handleDismiss}>
            <p>
              We&apos;re looking up <strong>{watchMovie.variables.movie_title}</strong>. If we find it, the plot will
              land in {watchMovie.variables.recipient_email} within a minute.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <a
                href={INNGEST_DEV_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block font-medium underline underline-offset-2"
              >
                Follow the run in the Inngest Dev Server
              </a>
            )}
          </FormAlert>
        )}

        {watchMovie.isError && (
          <FormAlert variant="error" title={errorTitle(watchMovie.error)} onDismiss={handleDismiss}>
            <p>{watchMovie.error.message}</p>
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
  );
}
