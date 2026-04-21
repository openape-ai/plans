# OpenApe Plans

Collaborative plan management for humans + agents. Persistent Markdown plans across devices, shared per team.

- **Webapp** — mobile-first Nuxt SPA at [plans.openape.ai](https://plans.openape.ai)
- **CLI** — `@openape/ape-plans` for agents and scripts
- **Auth** — via DDISA (decentralized identity discovery) to any OpenApe IdP
- **Data** — SQLite + Drizzle, local to the deploy host

## Status

🚧 Pre-release. MVP milestones: see [`PLAN.md`](./PLAN.md).

## Quickstart (CLI)

```bash
npm i -g @openape/ape-plans
ape-plans login your@email.com
ape-plans teams
ape-plans list --json
```

## Self-host

See [`docs/deploy.md`](./docs/deploy.md).

## License

MIT
