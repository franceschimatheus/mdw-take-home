# Architecture

How the app is built and why. To run it, see the [README](../README.md).

## How the data flows

```
form (browser)
  └─ POST /api/watch-movie          handler/http.ts: validates the body (Zod), returns 202
       └─ inngest.send(movie.watched)
            Inngest ─ POST /api/inngest
              └─ send-movie-plot-email           handler/inngest.ts
                   ├─ step "fetch-movie"  → OMDb   repository/omdb.ts   (result saved by Inngest)
                   └─ step "send-email"   → Resend lib/email/resend.ts  (retried alone, OMDb not called again)
```

1. **Event in.** `movie_title` + `recipient_email` arrive either from the form
   (via `/api/watch-movie`) or straight from Inngest. One Zod schema
   (`domain/movie.ts`) validates the form, the HTTP body and the Inngest
   trigger, so an invalid payload never starts a run.
2. **`fetch-movie`.** `service.findMovie` calls the OMDb repository, which
   turns OMDb's responses into a `Movie` or a typed error (not found, invalid
   key, rate limit, 5xx…).
3. **`send-email`.** `service.sendPlotEmail` builds the content
   (`domain/rules.ts`), renders the React Email template and sends it through
   Resend with an idempotency key tied to the event id.
4. **Failures.** Each error says whether it's `retryable`. Permanent ones stop
   immediately; the rest are retried by Inngest, only the failing step. After
   the last retry, `onFailure` logs the run.

## Structure

```
src/
├── app/api/
│   ├── inngest/route.ts       # Inngest endpoint (serve)
│   └── watch-movie/route.ts   # form endpoint
├── features/movies/
│   ├── domain/        # Movie + event schemas, errors, email content rules
│   ├── repository/    # OMDb client, maps OMDb failures to domain errors
│   ├── emails/        # React Email template
│   ├── service.ts     # findMovie, sendPlotEmail (deps injected as functions)
│   ├── handler/       # inngest.ts (the function), http.ts (form endpoint)
│   └── api/ hooks/ components/   # browser side (the form)
└── lib/
    ├── errors.ts              # AppError: every expected failure declares `retryable`
    ├── inngest/errors.ts      # markPermanentErrors: AppError → NonRetriableError
    └── email/resend.ts        # Resend client + EmailSendError
```

Inngest is only imported in `lib/inngest/` and `handler/`, and Resend only in
`lib/email/resend.ts`. The form is an extra; the function works without it.

**Stack:** Next.js 16, TypeScript (strict), Inngest SDK v4, Resend, Zod 4,
React Hook Form, TanStack Query, Tailwind CSS 4, Vitest + `@inngest/test`.

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

Tests cover the OMDb and Resend error mapping, the email rules, the service,
the HTTP endpoint and the Inngest function itself (run with
[`@inngest/test`](https://www.npmjs.com/package/@inngest/test): step order,
idempotency key, and which failures stop retries).
