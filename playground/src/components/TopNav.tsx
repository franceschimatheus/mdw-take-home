'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

const links = [
  { href: '/', label: 'React Query + RHF' },
  { href: '/server-action', label: 'Server Action' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <nav aria-label="Form variants" className="mx-auto flex h-14 max-w-md items-center gap-1 px-4">
        {links.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
