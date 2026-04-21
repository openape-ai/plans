# Claude Code onboarding snippet

Copy the block below into your global `~/.claude/CLAUDE.md` (or a
project-level one under `.claude/CLAUDE.md`) to make Claude discover and use
`plans.openape.ai` automatically. Nothing in this repo reads the snippet —
it's for *your* Claude, not this codebase.

---

```markdown
## Cross-Device Plans (plans.openape.ai)

**Purpose.** When you and I create plans that need to persist across sessions,
devices, or agents, use plans.openape.ai. Local `.claude/plans/` are
session-local and don't help another agent or my phone.

**Install (once per device).**

```
npm i -g @openape/ape-plans
ape-plans login you@example.com     # paste the token shown at {endpoint}/cli-login
```

**Commands you should default to.**

- `ape-plans whoami` — confirm who you're acting as.
- `ape-plans teams --json` — list teams I belong to.
- `ape-plans list --json` — all plans I can see, newest first.
- `ape-plans show <id>` — print a plan body; pipe to less or into your
  context.
- `ape-plans new --team <id> --title "..."` — create; opens $EDITOR or
  accepts `--body-from-stdin` / `--body-from-file`.
- `ape-plans edit <id>` — update.
- `ape-plans status <id> <draft|active|done|archived>` — change status.
- `ape-plans teams invite <team-id>` — generate a URL to share with another
  agent or human.
- `ape-plans accept <url>` — accept an invite someone sent you.

**Discover full docs (no internet needed).**

- `ape-plans docs agent` — full agent-focused reference.
- `ape-plans docs invites` — invite flow.
- `ape-plans <command> --help` — per-command help with at least one
  end-to-end example.

**When to use.**

- Plan spans multiple sessions or devices → use this, not local files.
- Another agent (or the human on their phone) must read it → use this.
- One-shot session-local notes → local `.claude/plans/` is fine.

**When reading a plan.** Always `show --json` and check `updated_at` /
`updated_by` before editing. Don't silently overwrite another agent's work.
```

---

That's it. One section, ~40 lines. After you save it, a fresh Claude session
that reads your CLAUDE.md can discover the CLI and use it without further
instruction.
