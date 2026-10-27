import { z } from 'zod';

// Fault injection for local testing. Sent with each request and carried in the
// event, so every run keeps the options it was started with (retries included).
export const devOptionsSchema = z.object({
  delayMs: z.number().int().min(0).max(30_000),
  omdb: z.enum(['ok', 'not-found', 'transient', 'permanent']),
  resend: z.enum(['ok', 'transient', 'permanent']),
  // How many attempts a 'transient' fault fails before letting the call through.
  failAttempts: z.number().int().min(1).max(5),
});

export type DevOptionsType = z.infer<typeof devOptionsSchema>;

export const DEFAULT_DEV_OPTIONS: DevOptionsType = { delayMs: 0, omdb: 'ok', resend: 'ok', failAttempts: 2 };

// Inlined by Next at build time, so the browser bundle drops dev-only code in production.
export const devToolsEnabled = process.env.NODE_ENV === 'development';

export function hasActiveDevOptions(options: DevOptionsType): boolean {
  return options.delayMs > 0 || options.omdb !== 'ok' || options.resend !== 'ok';
}
