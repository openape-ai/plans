# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com).

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
