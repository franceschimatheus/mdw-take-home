import { type Icon, LockSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

type Props = ComponentProps<'input'> & {
  id: string;
  label: string;
  icon: Icon;
  error?: string;
  hint?: string;
};

export function TextField({ id, label, icon: FieldIcon, error, hint, readOnly, className, ...inputProps }: Props) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <FieldIcon
          aria-hidden
          size={18}
          className={cn(
            'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2',
            error ? 'text-danger' : 'text-placeholder',
          )}
        />
        <input
          id={id}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-lg border bg-surface pl-10 text-base text-foreground shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-placeholder read-only:cursor-not-allowed read-only:bg-muted read-only:text-muted-foreground read-only:shadow-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm',
            readOnly ? 'pr-10' : 'pr-3',
            error
              ? 'border-danger-input focus-visible:border-danger focus-visible:ring-danger'
              : 'border-input focus-visible:border-ring focus-visible:ring-ring',
            className,
          )}
          {...inputProps}
        />
        {readOnly && (
          <LockSimpleIcon
            aria-hidden
            size={16}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-placeholder"
          />
        )}
      </div>

      {error ? (
        <p id={errorId} className="flex items-center gap-1 text-sm text-danger-text">
          <WarningCircleIcon aria-hidden size={14} weight="fill" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-subtle-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
