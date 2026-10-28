# Production

The version I'd ship. [`../playground`](../playground) is the same app with
extra tooling to visualize Inngest.

**Stack:** Next.js 16, TypeScript (strict), Inngest SDK v4, Resend, Zod 4,
React Hook Form, TanStack Query, Tailwind CSS 4, Vitest + `@inngest/test`, pnpm.

Next.js hosts both the Inngest endpoint (`/api/inngest`) and a small form that
sends the event. All OMDb/Resend calls run server-side. The form is an extra:
the event can be sent straight to Inngest.

## How it works

```
POST /api/watch-movie → inngest.send(movie.watched)       (202 Accepted)
Inngest → POST /api/inngest
  step "fetch-movie"  → OMDb   (result stored by Inngest)
  step "send-email"   → Resend (retried alone; OMDb isn't called again)
```

## Structure

```
src/features/movies/
├── domain/        # Movie + event schemas, errors, email content rules
├── repository/    # OMDb client, maps OMDb failures to domain errors
├── emails/        # React Email template
├── service.ts     # findMovie, sendPlotEmail (deps injected as functions)
├── handler/       # inngest.ts (the function), http.ts (form endpoint)
└── api/ hooks/ components/   # browser side
src/lib/
├── errors.ts                 # AppError: every expected failure declares `retryable`
├── inngest/errors.ts         # markPermanentErrors: AppError → NonRetriableError
└── email/resend.ts           # Resend client + EmailSendError
```

Inngest is only imported in `lib/inngest/` and `handler/`, and Resend only in `lib/email/resend.ts`.
One Zod schema validates the form, the HTTP body and the
Inngest trigger.

## Error handling & reliability

Expected errors extend `AppError` and declare `retryable`. Inside each step,
`markPermanentErrors` turns `retryable: false` into Inngest's
`NonRetriableError`; everything else, including unknown errors, is retried.

| Scenario                           | Outcome                                        |
| ---------------------------------- | ---------------------------------------------- |
| Invalid event payload              | rejected by the trigger schema, no retries     |
| Movie not found, OMDb invalid key  | fails immediately → `onFailure`                |
| OMDb 5xx / timeout / daily limit   | retries `fetch-movie` only                     |
| Resend 422 / 403                   | fails immediately → `onFailure`                |
| Resend 429 / 409 / 5xx / network   | retries `send-email` only                      |
| Resend succeeded but response lost | retry reuses the idempotency key, no duplicate |

| Config                  | Value                   | Why                                                        |
| ----------------------- | ----------------------- | ---------------------------------------------------------- |
| `retries`               | 10                      | survive longer outages (exponential backoff)               |
| `throttle`              | 2 / 1s                  | stay under Resend's rate limit; queues instead of dropping |
| Resend `idempotencyKey` | `movie-plot/<event.id>` | no duplicate email on retry                                |
| `onFailure`             | log                     | in production: alerting / dead-letter                      |

## Setup

Node ≥ 22.12 and pnpm (or `nix develop` at the repo root), plus OMDb and
Resend API keys.

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

Fill in `OMDB_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` and keep
`INNGEST_DEV=1` locally. Optional `RESEND_OWNER_EMAIL` locks the form's email
to the Resend account owner (the only address Resend delivers to without a
verified domain).

Run `task dev` from the repo root (or `pnpm dev` + `pnpm dev:inngest`), open
<http://localhost:3000>, and follow runs at <http://localhost:8288>. Or send
the event directly:

```bash
curl -X POST http://localhost:8288/e/dev -H 'Content-Type: application/json' -d '{"name":"meadow_api/movie.watched","data":{"movie_title":"The Matrix","recipient_email":"delivered@resend.dev"}}'
```

`delivered@resend.dev` is Resend's test inbox and accepts mail from any
account; swap in your Resend account's email to receive it yourself.

Checks: `pnpm type-check`, `pnpm test`, `pnpm build` (or `task check`).

Tests cover the OMDb and Resend error mapping, the email rules, the service,
the HTTP endpoint and the Inngest function itself (run with
[`@inngest/test`](https://www.npmjs.com/package/@inngest/test): step order,
idempotency key, and which failures stop retries).

Assumptions and recommendations for the exercise are in the
[root README](../README.md#assumptions).
