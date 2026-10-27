import { connection } from 'next/server';

import { getEnv } from '@/config/env';
import { ServerActionForm } from '@/features/movies/components/ServerActionForm';
import { WatchMovieForm } from '@/features/movies/components/WatchMovieForm';

type Props = {
  variant: 'react-query' | 'server-action';
};

export async function WatchMovieCard({ variant }: Props) {
  await connection();
  const { RESEND_OWNER_EMAIL: lockedRecipient } = getEnv();
  const Form = variant === 'server-action' ? ServerActionForm : WatchMovieForm;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <header className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Just watched a movie?</h1>
        <p className="text-sm text-muted-foreground">Tell us the title and we&apos;ll email you its plot summary.</p>
      </header>

      <Form lockedRecipient={lockedRecipient} />
    </div>
  );
}
