# Meadow Take-Home: Movie Plot Email (Inngest + Next.js)

An Inngest function that reacts to `meadow_api/movie.watched`, fetches the
movie from OMDb and emails its plot with Resend
([exercise](docs/meadow_coding_excersise.txt)).

| Folder | What it is |
|---|---|
| [**`production/`**](production) | **The submission.** What I'd ship. |
| [`playground/`](playground) | The same app plus live run progress and fault injection, built to visualize Inngest. |

```bash
task dev
```

`task dev` runs `production/`; `task dev:playground` runs `playground/`. Both
install dependencies when needed, then start Next.js on :3000 and the Inngest
Dev Server on :8288. If a closed terminal left them running, `task stop` frees
both ports. Setup and design notes are in
[`production/README.md`](production/README.md).

## Assumptions

- OMDb is queried by exact title (`?t=`) with the full plot.
- Movie not found is a permanent failure: no email, no retries.
- No dedup across events: the same movie twice sends two emails. Retries never
  duplicate (idempotency key).
- Without a verified Resend domain, only the account owner receives email.
- Throttle assumes Resend's default rate limit.

## Recommendations for this exercise

- **Use Resend's test addresses in the sample event.** `peter@test.com` can't
  receive mail from an unverified Resend account, so the happy path can't run
  as written. `delivered@resend.dev` works on any account, and
  `bounced@resend.dev` lets candidates exercise the failure path too.
- **Define "successfully sending".** A 200 from Resend means accepted, not
  delivered; delivery and bounces arrive later via webhooks. Stating which one
  counts (and whether a fallback provider is in scope) turns "maximize the
  chances" into something gradeable instead of open-ended.
- **Spell out edge cases and share what matters most in the evaluation.**
  Movie not found (OMDb answers HTTP 200 with `"Response": "False"`),
  ambiguous titles, invalid emails, duplicate events. With a 2-hour limit,
  knowing whether tests, deployment or Inngest config weigh most changes what
  a candidate builds.
