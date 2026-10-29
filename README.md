# Meadow Take-Home: Movie Plot Email (Inngest + Next.js)

An Inngest function that reacts to `meadow_api/movie.watched`, fetches the
movie from OMDb and emails its plot with Resend
([exercise](docs/meadow_coding_excersise.txt)).

## Run it (Docker only)

The only requirement is Docker. Create the env file and fill in
`OMDB_API_KEY` and `RESEND_API_KEY` (the other variables are explained in
[`.env.example`](.env.example)):

```bash
cp .env.example .env
```

```bash
docker compose up --build
```

This starts the app on <http://localhost:3000> and the Inngest Dev Server on
<http://localhost:8288>, and keeps the terminal attached to their logs. If
Docker says `port is already allocated`, pick another port for the app:

```bash
APP_PORT=3300 docker compose up --build
```

Open <http://localhost:3000>, enter a movie title and an email, and submit.
Follow the run at <http://localhost:8288/runs>: it should end as
**Completed**, with the `fetch-movie` and `send-email` steps, and the email
shows up in your Resend dashboard. A title that doesn't exist fails right away
without retries.

Without a verified domain, Resend only delivers to your account's own email;
`delivered@resend.dev` (Resend's test inbox) works from any account.

`Ctrl+C` stops everything. Type-check, lint and unit tests, also in Docker:

```bash
docker compose run --rm --build test
```

## How it works

How the data flows, the folder structure and the error handling / Inngest
config are in [`docs/architecture.md`](docs/architecture.md).

## Without Docker

Needs Node ≥ 22.12 and pnpm (`nix develop` provides both, plus
[Task](https://taskfile.dev)). Keep `INNGEST_DEV=1` in `.env`.

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm dev:inngest
```

Run the last two in separate terminals, or `task dev` for both. `task check`
runs lint, audit, type-check, tests and build, like CI; `task --list` shows
the rest.

## Playground (optional)

[`playground/`](playground) is **not part of the submission**: a copy of this
app with extra tooling I built to see Inngest work (live run progress via
Inngest Realtime, fault injection for OMDb/Resend, a Server Action variant of
the form). What it adds and why it stays out of the real app:
[`playground/README.md`](playground/README.md). Run it with
`task dev:playground` after `cp .env playground/.env` (same variables).

## Assumptions

- OMDb is queried by exact title (`?t=`) with the full plot.
- Movie not found is a permanent failure: no email, no retries.
- No dedup across events: the same movie twice sends two emails. Retries never
  duplicate (idempotency key).
- Without a verified Resend domain, only the account owner receives email.
  Optional `RESEND_OWNER_EMAIL` locks the form (and `/api/watch-movie`) to
  that address.
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
- **Consider specifying how to look up the movie.** OMDb offers both `?t=`
  (a single title match) and `?s=` (a list of results), and for titles like
  "Dune" or "The Office" the two can lead to different movies. It might also
  help to mention that OMDb reports "not found" with an HTTP 200 and
  `"Response": "False"`. A short line such as "use `t=`; if the movie isn't
  found, no email is sent" would keep submissions easier to compare.
