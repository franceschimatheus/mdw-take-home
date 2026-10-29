import { XIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/cn';

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
};

// Small ✕ that inherits its colour from the surface it sits on. The visible
// box is 32px; the pseudo-element pads the hit area to 44px for touch.
export function DismissButton({ label, onClick, className }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'relative -m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md opacity-70 transition-[opacity,background-color] duration-150 after:absolute after:-inset-1.5 hover:bg-current/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      <XIcon aria-hidden size={16} weight="bold" />
    </button>
  );
}
