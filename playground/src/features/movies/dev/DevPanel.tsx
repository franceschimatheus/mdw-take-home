import { WrenchIcon, XIcon } from '@phosphor-icons/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { DEFAULT_DEV_OPTIONS, type DevOptionsType, hasActiveDevOptions } from '@/features/movies/dev/options';

type Props = {
  value: DevOptionsType;
  onChange: (next: DevOptionsType) => void;
};

const delayChoices = [0, 1_000, 3_000, 5_000, 10_000];

const omdbChoices: Record<DevOptionsType['omdb'], string> = {
  ok: 'Real call',
  'not-found': 'Movie not found',
  transient: 'Fails, then recovers',
  permanent: 'Fails permanently',
};

const resendChoices: Record<DevOptionsType['resend'], string> = {
  ok: 'Real call',
  transient: 'Fails, then recovers',
  permanent: 'Fails permanently',
};

// Non-modal side sheet: the form stays usable while it's open, so you can
// change a fault and submit again without closing it.
export function DevPanel({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const active = hasActiveDevOptions(value);
  const usesTransient = value.omdb === 'transient' || value.resend === 'transient';

  function set<K extends keyof DevOptionsType>(key: K, next: DevOptionsType[K]) {
    onChange({ ...value, [key]: next });
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="dev-tools-sheet"
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed right-4 bottom-4 z-40 inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-input bg-surface px-3 text-sm font-medium text-muted-foreground shadow-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <WrenchIcon aria-hidden size={16} />
        Dev tools
        {active && (
          <>
            <span aria-hidden className="size-2 rounded-full bg-danger" />
            <span className="sr-only">(faults active)</span>
          </>
        )}
      </button>

      <aside
        ref={sheetRef}
        id="dev-tools-sheet"
        aria-label="Dev tools"
        tabIndex={-1}
        hidden={!open}
        className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col border-l border-border bg-surface text-sm shadow-xl outline-none motion-safe:animate-[sheet-in_150ms_ease-out]"
      >
        <header className="box-content flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <WrenchIcon aria-hidden size={16} className="text-muted-foreground" />
          <h2 className="font-semibold">Dev tools</h2>
          {active && (
            <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger-text">
              Faults active
            </span>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Close dev tools"
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <XIcon aria-hidden size={16} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Field id="dev-delay" label="Delay before each step">
            <select
              id="dev-delay"
              value={value.delayMs}
              onChange={(e) => set('delayMs', Number(e.target.value))}
              className={selectClass}
            >
              {delayChoices.map((ms) => (
                <option key={ms} value={ms}>
                  {ms === 0 ? 'None' : `${ms / 1000}s`}
                </option>
              ))}
            </select>
          </Field>

          <Field id="dev-omdb" label="OMDb lookup">
            <select
              id="dev-omdb"
              value={value.omdb}
              onChange={(e) => set('omdb', e.target.value as DevOptionsType['omdb'])}
              className={selectClass}
            >
              {Object.entries(omdbChoices).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="dev-resend" label="Resend email">
            <select
              id="dev-resend"
              value={value.resend}
              onChange={(e) => set('resend', e.target.value as DevOptionsType['resend'])}
              className={selectClass}
            >
              {Object.entries(resendChoices).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          {usesTransient && (
            <Field id="dev-fail-attempts" label="Failed attempts before recovering">
              <select
                id="dev-fail-attempts"
                value={value.failAttempts}
                onChange={(e) => set('failAttempts', Number(e.target.value))}
                className={selectClass}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <p className="text-xs text-subtle-foreground">
            Sent with each request and applied only in development. Simulated outages retry after 2s instead of
            Inngest&apos;s usual backoff.
          </p>
        </div>

        {active && (
          <footer className="border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => onChange(DEFAULT_DEV_OPTIONS)}
              className="font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Reset to defaults
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

const selectClass =
  'h-9 w-full rounded-md border border-input bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring';

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
