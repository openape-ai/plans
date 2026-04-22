# OpenApe Plans

Collaborative plan management for humans **and AI agents**. Persistent
Markdown plans across devices and conversations, shared per team.

- **Webapp** — mobile-first Nuxt SPA ([plans.openape.ai](https://plans.openape.ai))
- **CLI** — `@openape/ape-plans`, agent-first with verbose `--help`
- **Auth** — [DDISA](https://openape.ai) decentralized identity discovery
- **Data** — SQLite + Drizzle, local to the deploy host
- **License** — MIT

---

## Why

You work with multiple AI agents across multiple devices. Plans written in a
conversation on one laptop need to be readable and editable from the phone,
from another laptop, or from an agent in a completely different session.
Local `~/.claude/plans/` directories do not bridge that gap.

Plans live here, on a server you control, behind DDISA auth. Humans use the
webapp; agents use the CLI; both see the same Markdown.

---

## Features

- **Teams as sharing boundary.** A plan belongs to exactly one team. All
  members see and (by default) edit.
- **Signed-JWT invite URLs.** Generate a link in the webapp or CLI, share it,
  recipient joins after DDISA login. Agents can invite other agents.
- **Mobile-first webapp.** Write, read, and edit Markdown plans from a
  phone; safe-area-aware FAB / sticky save bar.
- **Verbose agent CLI.** Every subcommand's `--help` carries a full example.
  `ape-plans docs <topic>` prints an embedded reference without internet
  access.

---

## Quickstart (CLI)

```bash
npm i -g @openape/ape-plans
ape-plans login you@example.com        # paste the token from {endpoint}/cli-login
ape-plans teams --json
ape-plans new --team 01HXX... --title "My plan"
ape-plans show 01HXX...
```

See [`docs/agent.md`](./docs/agent.md) for agent-focused workflows.

## Quickstart (Web)

1. Open [plans.openape.ai](https://plans.openape.ai) on your phone or laptop.
2. Sign in with your email — DDISA resolves the right identity provider.
3. Create a team, invite others with a signed URL, and start writing plans.

## Self-host

```bash
git clone https://github.com/openape-ai/plans && cd plans
pnpm install
pnpm --filter @openape-plans/app dev
```

For production: see [`docs/deploy.md`](./docs/deploy.md) — host-agnostic
`scripts/deploy.sh` + GitHub Actions auto-deploy over SSH.

## Docs

| Topic | File |
|-------|------|
| **Claude Code skill** (recommended for agents) | [`skills/ape-plans/SKILL.md`](./skills/ape-plans/SKILL.md) |
| Agent workflows | [`docs/agent.md`](./docs/agent.md) |
| Operator deploy guide | [`docs/deploy.md`](./docs/deploy.md) |
| CLI reference (also inline: `ape-plans docs cli`) | [`cli/src/docs/cli.md`](./cli/src/docs/cli.md) |
| Claude Code onboarding snippet | [`docs/claude-example.md`](./docs/claude-example.md) |

### Claude Code skill

Install the skill so fresh Claude sessions auto-discover `ape-plans`:

```bash
# clone once
git clone https://github.com/openape-ai/plans ~/Dev/openape-plans
# symlink into Claude's skills directory
mkdir -p ~/.claude/skills
ln -s ~/Dev/openape-plans/skills/ape-plans ~/.claude/skills/ape-plans
```

Next session, Claude picks it up automatically when the task involves planning — cross-device, multi-agent, OR just non-trivial local work.

## Project layout

```
openape-plans/
├─ app/                    Nuxt 4 webapp + Nitro API
│  ├─ server/api/           REST endpoints (teams, plans, invites, cli)
│  ├─ server/database/      Drizzle schema + libsql
│  ├─ server/utils/         require-auth, invite-jwt, cli-token, problem
│  └─ app/pages/            Login, teams, plans, invite, cli-login
├─ cli/                    @openape/ape-plans — citty + tsup
│  └─ src/
│     ├─ commands/          login, teams, accept, list/show/new/edit/status/rm, docs
│     └─ docs/              Embedded Markdown references printed by `ape-plans docs`
├─ scripts/
│  ├─ deploy.sh             Host-agnostic deploy (env-driven)
│  └─ server-setup.sh       One-shot root setup on a fresh host
├─ .github/workflows/
│  ├─ ci.yml                typecheck + build (PRs + main)
│  └─ deploy.yml            auto-deploy on main push w/ rollback
└─ docs/
```

## Contributing

Patches welcome. Open a PR with a concise conventional-commit message.

## License

[MIT](./LICENSE)
