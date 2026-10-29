import 'server-only';

import { z } from 'zod';

const envSchema = z.object({
  OMDB_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  RESEND_OWNER_EMAIL: z
    .union([z.literal(''), z.email()])
    .optional()
    .transform((value) => value || undefined),
});

export type EnvType = z.infer<typeof envSchema>;

let cached: EnvType | null = null;

// Lazy, so `next build` works without credentials.
export function getEnv(): EnvType {
  if (!cached) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
      throw new Error(`Invalid environment variables: ${missing}. See .env.example.`);
    }
    cached = result.data;
  }
  return cached;
}
