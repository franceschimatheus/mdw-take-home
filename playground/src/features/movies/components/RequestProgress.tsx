import { CheckIcon, CircleNotchIcon, XIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

import { DismissButton } from '@/components/DismissButton';
import type { MovieWatchedType } from '@/features/movies/domain/movie';
import type { MovieRequestStatusType } from '@/features/movies/realtime';
import { cn } from '@/lib/cn';

type StepStateType = 'done' | 'active' | 'pending' | 'failed';

type StepType = {
  label: string;
  state: StepStateType;
  detail: ReactNode;
};

const stateLabel: Record<StepStateType, string> = {
  done: 'Completed',
  active: 'In progress',
  pending: 'Not started',
  failed: 'Failed',
};

// Maps the published updates onto the lookup and email steps. A generic
// failure lands on whichever step was running when it happened.
function deriveStates(updates: MovieRequestStatusType[]): [lookup: StepStateType, email: StepStateType] {
  const stages = updates.map((update) => update.stage);
  const latest = stages.at(-1);
  const found = stages.includes('sending') || stages.includes('sent');

  if (latest === 'sent') return ['done', 'done'];
  if (latest === 'not-found') return ['failed', 'pending'];
  if (latest === 'failed') return found ? ['done', 'failed'] : ['failed', 'pending'];
  if (found) return ['done', 'active'];
  return ['active', 'pending'];
}

// The latest retry notice for a step, while that step is still the latest news.
function latestRetry(updates: MovieRequestStatusType[], step: 'lookup' | 'email') {
  const latest = updates.at(-1);
  return latest?.stage === 'retrying' && latest.step === step ? latest : null;
}

function retryDetail(provider: string, retry: { attempt: number; maxAttempts: number }) {
  return (
    <>
      {provider} isn&apos;t responding. Retrying (attempt {retry.attempt} of {retry.maxAttempts})…
    </>
  );
}

type Props = {
  updates: MovieRequestStatusType[];
  submitted: MovieWatchedType;
  footer?: ReactNode;
  onDismiss?: () => void;
};

export function RequestProgress({ updates, submitted, footer, onDismiss }: Props) {
  const [lookup, email] = deriveStates(updates);
  const lookupRetry = latestRetry(updates, 'lookup');
  const emailRetry = latestRetry(updates, 'email');
  const title = <strong className="font-medium text-foreground">{submitted.movie_title}</strong>;
  const to = submitted.recipient_email;
  const failedOnOurSide = 'Something went wrong on our side. Try again in a minute.';

  const steps: StepType[] = [
    { label: 'Request queued', state: 'done', detail: 'Handed off to the background worker.' },
    {
      label: 'Look up movie',
      state: lookup,
      detail: {
        done: <>Found {title} on OMDb.</>,
        active: lookupRetry ? retryDetail('OMDb', lookupRetry) : <>Searching OMDb for {title}…</>,
        pending: <>Search OMDb for {title}.</>,
        failed: updates.some((update) => update.stage === 'not-found') ? (
          <>No match for {title} on OMDb. Check the spelling and try again.</>
        ) : (
          failedOnOurSide
        ),
      }[lookup],
    },
    {
      label: 'Email the plot',
      state: email,
      detail: {
        done: <>Sent to {to}. Check your inbox.</>,
        active: emailRetry ? retryDetail('Our email provider', emailRetry) : <>Sending to {to}…</>,
        pending: <>Send to {to}.</>,
        failed: failedOnOurSide,
      }[email],
    },
  ];

  return (
    <div className="relative rounded-lg border border-border p-4">
      {onDismiss && (
        <DismissButton
          label="Clear progress"
          onClick={onDismiss}
          className="absolute top-3 right-3 m-0 text-muted-foreground"
        />
      )}
      <ol aria-label="Request progress" className={cn('flex flex-col', onDismiss && 'pr-8')}>
        {steps.map((step, index) => (
          <StepItem key={step.label} step={step} isLast={index === steps.length - 1} />
        ))}
      </ol>
      {footer && <div className="mt-3 border-t border-border pt-3 text-sm">{footer}</div>}
    </div>
  );
}

function StepItem({ step, isLast }: { step: StepType; isLast: boolean }) {
  const { label, state, detail } = step;

  return (
    <li aria-current={state === 'active' ? 'step' : undefined} className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className={cn(
            'absolute top-7 bottom-1 left-3 w-px -translate-x-1/2 transition-colors duration-150',
            state === 'done' ? 'bg-success-icon' : 'bg-border',
          )}
        />
      )}

      <StepMarker state={state} />

      <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <p
          className={cn(
            'text-sm font-medium',
            state === 'pending' && 'text-muted-foreground',
            state === 'failed' && 'text-danger-text',
          )}
        >
          {label}
          <span className="sr-only"> ({stateLabel[state]})</span>
        </p>
        <p className="text-sm break-words text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

function StepMarker({ state }: { state: StepStateType }) {
  const base =
    'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-150';

  switch (state) {
    case 'done':
      return (
        <span className={cn(base, 'border-success-icon bg-success-icon text-surface')}>
          <CheckIcon aria-hidden size={14} weight="bold" />
        </span>
      );
    case 'active':
      return (
        <span className={cn(base, 'border-primary bg-surface text-primary')}>
          <CircleNotchIcon aria-hidden size={14} weight="bold" className="motion-safe:animate-spin" />
        </span>
      );
    case 'failed':
      return (
        <span className={cn(base, 'border-danger bg-danger text-surface')}>
          <XIcon aria-hidden size={14} weight="bold" />
        </span>
      );
    case 'pending':
      return <span className={cn(base, 'border-input bg-surface')} />;
  }
}
