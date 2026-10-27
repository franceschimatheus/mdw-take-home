# Playground

**Not the submission.** The same app as [`../production`](../production) with
tooling I built to _see_ Inngest work. Setup is identical; run it with
`task dev:playground` from the repo root. Tests live only in `production/`.

## What's added

**Live progress (Inngest Realtime).** The form shows a stepper that follows the
run (_queued → look up movie → email the plot_), including retry notices like
"Retrying (attempt 3 of 11)". The function publishes to a per-event channel
(`realtime.ts`); the HTTP handler returns a subscription token;
`useMovieRequestStatus` subscribes with `useRealtime`. Here, "movie not found"
is a normal outcome shown in the UI instead of a failure.

**Dev tools (fault injection).** A side sheet (development only) to add a
delay before each step, and make OMDb or Resend fail permanently, fail then
recover, or return "not found". The options travel inside the event, so
retries keep them; `dev/faults.ts` throws the same errors the real providers
would, and simulated outages retry after 2s instead of Inngest's backoff.

**Two form variants (top navigation).** The same flow submitted two ways, to
compare them:

|                  | `/` React Query + RHF               | `/server-action` Server Action                        |
| ---------------- | ----------------------------------- | ----------------------------------------------------- |
| Transport        | `fetch` → `POST /api/watch-movie`   | `<form action>` → `actions/watch-movie.ts`            |
| Validation       | client (`zodResolver`) + server     | server only, errors returned in the action state      |
| Works without JS | no                                  | yes                                                   |
| Pending / result | `useMutation`                       | `useActionState`                                      |
| Dismiss result   | `mutation.reset()`                  | no reset: remembers the dismissed state               |
| Double submit    | guard in the submit handler         | `preventDefault` in `onSubmit` (React queues actions) |
| Network failure  | `WatchMovieRequestError('network')` | thrown to the nearest error boundary                  |

Both call `queue.ts` (publish the event + issue the realtime token) and share
the live progress card and the dev tools.

## Why it isn't production

- It widens the event and HTTP contracts for tooling, not product needs.
- It couples the Inngest function to one UI (publishing stages and retries).
- Realtime adds failure modes (tokens, dropped connections, no replay) a
  "we'll email you" flow doesn't need.
- Fault injection, even gated, is extra code in production builds.
