# Meadow Take-Home: Movie Plot Email (Inngest + Next.js)

An Inngest function that reacts to `meadow_api/movie.watched`, fetches the
movie from OMDb and emails its plot with Resend
([exercise](docs/meadow_coding_excersise.txt)).

| Folder | What it is |
|---|---|
| [**`production/`**](production) | **The submission.** What I'd ship. |
| [`playground/`](playground) | The same app plus live run progress and fault injection, built to visualize Inngest. |

## Running it

Commands below work in bash, zsh and PowerShell 7 (Windows).

First create the env file and fill in `OMDB_API_KEY` and `RESEND_API_KEY`
(where to get them and what the other variables do:
[`production/README.md`](production/README.md#setup)):

```bash
cp production/.env.example production/.env.local
```

With Nix, `nix develop` at the repo root gives you Node 24, pnpm and
[Task](https://taskfile.dev):

```bash
nix develop
```

```bash
task dev
```

### Without Nix

If you already have Node ≥ 22.12 and pnpm installed, add Task (or skip it and
use pnpm directly):

```bash
pnpm add -g @go-task/cli
```

```bash
task dev
```

Without Task, run the same thing from `production/` (or `playground/`):

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm dev:inngest
```

`pnpm dev` starts Next.js and `pnpm dev:inngest` the Inngest Dev Server; run
them in separate terminals.

### Tasks

`task dev` runs `production/`; `task dev:playground` runs `playground/`. Both
install dependencies when needed, then start Next.js on :3000 and the Inngest
Dev Server on :8288. If a closed terminal left them running, `task stop` frees
both ports. `task check` lints, audits dependencies (`pnpm audit`, moderate
severity and above; also `task audit`), type-checks, tests and builds, like CI.
Setup and design notes are in
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
