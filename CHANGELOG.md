# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## [CLI 0.2.1] — 2026-04-22

- **Claude Code skill** bundled in `skills/ape-plans/SKILL.md`. Positions
  `ape-plans` as the default planning surface for any non-trivial work
  (local AND cross-device), spells out living-document discipline
  (progress updates, discoveries, decision log), and a writing style that
  stays self-contained enough for newcomers to execute without prior
  context. Install: symlink into `~/.claude/skills/ape-plans`.
- **Top-level `ape-plans --help`** now carries a 3-line orientation
  (first-time setup + pointers to docs + the skill) instead of a single
  flat description.

## [CLI 0.2.0] — 2026-04-22

Driven by real friction captured while drafting a 10 KB planning doc through the v0.1 CLI (friction log preserved under the "OpenApe" team on plans.openape.ai).

### CLI

- **Default team context.** `ape-plans teams use <id>` persists a per-endpoint
  default. Subsequent `new`/`invite`/etc. omit `--team`. `teams --show` and
  `--clear` manage it. The active team is marked with `*` in `teams` listings.
- **Body patch editors** on `edit`:
  - `--append-body` / `--prepend-body` — merge incoming text without a re-send
  - `--replace-section "<heading>"` — replace the block under a Markdown
    heading until the next same-or-shallower heading
- **Team lifecycle:** `teams update <id> [--name] [--description]`,
  `teams archive|unarchive <id>`, `teams rm <id> [--force]`. `teams` hides
  archived by default; `--include-archived` flag reveals them.
- **`--id-only`** on every create command — prints just the ULID for scripting
  (`ID=$(ape-plans teams new X --id-only)`).
- **`ape-plans open <plan-id>`** launches the web view in the default browser.
- **Docs:** heredoc pattern (`--body-from-stdin <<'EOF' ... EOF`) promoted in
  `docs agent`.

### Webapp

- `POST /api/teams` now returns the same list-shape (`member_count`,
  `plan_count`, `updated_at`) as `GET /api/teams`.
- `PATCH /api/teams/:id` — rename/edit description (owner-only).
- `POST /api/teams/:id/archive` + `POST /api/teams/:id/unarchive`.
- `DELETE /api/teams/:id` — refuses with 409 when plans exist unless
  `?force=true`, which cascade-soft-deletes the plans.
- `GET /api/teams?include_archived=1` — otherwise archived teams are hidden.
- `teams.archived_at` column added (idempotent in-place `ALTER TABLE`, so
  existing v0.1 deploys upgrade with a simple service restart).

## [0.1.0] — 2026-04-22

Initial public release.

### Webapp (plans.openape.ai)

- DDISA-discovered login via `@openape/nuxt-auth-sp`.
- Teams as the sharing boundary (owner / editor / viewer roles; viewers
  read-only in MVP).
- Plans: Markdown body + minimal metadata (title, status, owner). CRUD with
  membership checks, soft-delete.
- Team invites via signed HS256 JWT URLs: generate, list, revoke, public
  preview endpoint, authenticated accept with `used_count` increment.
- `/cli-login` page that mints 30-day bearer tokens for the CLI.
- Mobile-first UI: `min-h-dvh`, safe-area-inset FAB and sticky save bar,
  apple-mobile-web-app meta.

### CLI (`@openape/ape-plans`)

- Paste-based login flow (`ape-plans login`) that saves a 30-day bearer
  token to `~/.openape/plans.json` (chmod 600).
- Teams: `teams`, `teams show`, `teams new`, `teams invite`, `teams invites`,
  `teams revoke-invite`.
- Invites: `accept <url-or-token>`, works with full URL or raw token.
- Plans: `list`, `show`, `new`, `edit`, `status`, `rm`. Body input via
  `$EDITOR`, `--body-from-stdin`, or `--body-from-file`.
- `ape-plans docs <topic>` prints embedded Markdown references (agent, auth,
  cli, errors, invites, plans, teams) for offline agent consumption.
- `--json`, `--quiet`, and `--endpoint <url>` on every command.

### Infrastructure

- Host-agnostic `scripts/deploy.sh` (env-driven: `DEPLOY_HOST`, `DEPLOY_USER`,
  `DEPLOY_BASE`, `DEPLOY_PORT`, `DEPLOY_SERVICE`).
- `scripts/server-setup.sh` one-shot root setup (directories, systemd unit,
  sudoers rule, `.env` template, nginx vhost).
- GitHub Actions `ci.yml` (typecheck + build on PRs) and `deploy.yml`
  (auto-deploy on main push with public health check + automatic rollback).
- `release-cli.yml` publishes `@openape/ape-plans` to npm when a `cli-v*`
  tag is pushed.

### Known gaps (v2)

- Viewer role not enforced on every write endpoint.
- Last-write-wins on concurrent plan edits (no ETag / If-Match).
- No plan revisions, comments, attachments, or realtime sync.
- CLI does not yet offer a browser-less device flow; 30-day paste is the
  only way to get a token.
