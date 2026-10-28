import 'server-only';

import { getEnv } from '@/config/env';

// The form only makes the field read-only; the HTTP route and the Server Action
// both enforce the lock so neither can be used to email arbitrary addresses.
// Returns the field error, or undefined when the recipient is allowed.
export function lockedRecipientError(recipientEmail: string): string | undefined {
  const { RESEND_OWNER_EMAIL: lockedRecipient } = getEnv();
  if (!lockedRecipient || recipientEmail.toLowerCase() === lockedRecipient.toLowerCase()) return undefined;
  return `Only ${lockedRecipient} can receive emails`;
}
