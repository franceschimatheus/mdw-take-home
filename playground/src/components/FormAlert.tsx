import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

import { DismissButton } from '@/components/DismissButton';
import { cn } from '@/lib/cn';

// Announced by the caller's persistent aria-live region; a live role created
// together with its content is often not read out.
type Props = {
  variant: 'success' | 'error';
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
};

const styles = {
  success: {
    container: 'border-success-border bg-success-soft text-success-foreground',
    icon: 'text-success-icon',
    Icon: CheckCircleIcon,
  },
  error: {
    container: 'border-danger-border bg-danger-soft text-danger-foreground',
    icon: 'text-danger-icon',
    Icon: WarningCircleIcon,
  },
} as const;

export function FormAlert({ variant, title, children, onDismiss }: Props) {
  const { container, icon, Icon } = styles[variant];

  return (
    <div className={cn('flex gap-3 rounded-lg border p-3 text-sm', container)}>
      <Icon aria-hidden size={20} weight="fill" className={cn('mt-px shrink-0', icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        {children && <div className="opacity-90">{children}</div>}
      </div>
      {onDismiss && <DismissButton label="Dismiss" onClick={onDismiss} />}
    </div>
  );
}
