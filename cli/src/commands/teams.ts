import { defineCommand } from 'citty'
import { apiCall } from '../api.ts'
import { printJson, printLine } from '../output.ts'

interface TeamListItem {
  id: string
  name: string
  description: string | null
  role: 'owner' | 'editor' | 'viewer'
  member_count: number
  plan_count: number
  created_at: number
  updated_at: number
}

interface TeamMember { email: string, role: 'owner' | 'editor' | 'viewer', joined_at: number }
interface TeamDetailPlan {
  id: string
  title: string
  status: 'draft' | 'active' | 'done' | 'archived'
  owner_email: string
  updated_at: number
  updated_by: string
}
interface TeamDetail {
  id: string
  name: string
  description: string | null
  created_at: number
  members: TeamMember[]
  plans: TeamDetailPlan[]
}

interface InviteSummary {
  id: string
  created_by: string
  note: string | null
  max_uses: number
  used_count: number
  expires_at: number
  created_at: number
}

interface CreateInviteResult {
  id: string
  url: string
  token: string
  expires_at: number
  max_uses: number
  note: string | null
}

/**
 * List, show, create, invite, and manage teams.
 *
 * EXAMPLES
 *   $ ape-plans teams
 *   Delta Mind       role owner    members 3  plans 7
 *   Demo             role editor   members 2  plans 1
 *
 *   $ ape-plans teams --json
 *   [{"id":"01HXX…","name":"Delta Mind","role":"owner", …}]
 *
 *   $ ape-plans teams show 01HXX...
 *   (prints name, description, members, plans)
 *
 *   $ ape-plans teams new "Delta Mind" --description "Core product team"
 *   → 01HXX…
 *
 *   $ ape-plans teams invite 01HXX... --max-uses 1 --expires-in 24h --note "welcome @alice"
 *   https://plans.openape.ai/invite?t=eyJhbGc…
 *
 *   $ ape-plans teams invites 01HXX...
 *   (lists active invites with used/max and expiry)
 *
 *   $ ape-plans teams revoke-invite 01HXX...
 *
 * JSON output (with --json) is stable and suitable for agent parsing.
 * Error codes:
 *   401  Not logged in. Run `ape-plans login`.
 *   403  You are not a member / role too low.
 *   404  Team or invite not found.
 */
export const teamsCommand = defineCommand({
  meta: {
    name: 'teams',
    description: 'List teams you belong to.',
  },
  args: {
    json: { type: 'boolean', description: 'JSON output.' },
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
  },
  subCommands: {
    show: defineCommand({
      meta: {
        name: 'show',
        description: 'Print a team with members and plans.',
      },
      args: {
        teamId: { type: 'positional', required: true, description: 'Team ULID (from `ape-plans teams --json`).' },
        json: { type: 'boolean', description: 'JSON output.' },
        endpoint: { type: 'string', description: 'Override plans endpoint.' },
      },
      async run({ args }) {
        const detail = await apiCall<TeamDetail>('GET', `/api/teams/${args.teamId}`, { endpoint: args.endpoint })
        if (args.json) { printJson(detail); return }
        printLine(`Team  ${detail.name}  (${detail.id})`)
        if (detail.description) printLine(`  ${detail.description}`)
        printLine('')
        printLine(`Members (${detail.members.length}):`)
        for (const m of detail.members) printLine(`  - ${m.email.padEnd(40)} ${m.role}`)
        printLine('')
        printLine(`Plans (${detail.plans.length}):`)
        for (const p of detail.plans) {
          printLine(`  - ${p.id}  ${p.status.padEnd(8)} ${p.title}`)
        }
      },
    }),

    new: defineCommand({
      meta: {
        name: 'new',
        description: 'Create a new team (caller becomes owner).',
      },
      args: {
        name: { type: 'positional', required: true, description: 'Team name (1–120 chars).' },
        description: { type: 'string', description: 'Optional description (≤500 chars).' },
        json: { type: 'boolean', description: 'JSON output.' },
        endpoint: { type: 'string', description: 'Override plans endpoint.' },
      },
      async run({ args }) {
        const result = await apiCall<{ id: string, name: string, description: string | null }>(
          'POST',
          '/api/teams',
          {
            endpoint: args.endpoint,
            body: { name: args.name, description: args.description },
          },
        )
        if (args.json) { printJson(result); return }
        printLine(result.id)
      },
    }),

    invite: defineCommand({
      meta: {
        name: 'invite',
        description: 'Create a shareable invite URL for a team.',
      },
      args: {
        teamId: { type: 'positional', required: true, description: 'Team ULID.' },
        'max-uses': { type: 'string', description: 'Max uses (default 5).' },
        'expires-in': { type: 'string', description: 'Duration e.g. 7d, 24h, 30m (default 7d).' },
        note: { type: 'string', description: 'Optional context shown to recipient.' },
        json: { type: 'boolean', description: 'JSON output.' },
        endpoint: { type: 'string', description: 'Override plans endpoint.' },
      },
      async run({ args }) {
        const maxUsesRaw = args['max-uses']
        const body: Record<string, unknown> = {}
        if (typeof maxUsesRaw === 'string' && maxUsesRaw.length > 0) {
          body.max_uses = parseInt(maxUsesRaw, 10)
        }
        if (args['expires-in']) body.expires_in = args['expires-in']
        if (args.note) body.note = args.note

        const result = await apiCall<CreateInviteResult>(
          'POST',
          `/api/teams/${args.teamId}/invites`,
          { endpoint: args.endpoint, body },
        )
        if (args.json) { printJson(result); return }
        printLine(result.url)
        printLine(`expires: ${new Date(result.expires_at * 1000).toISOString()}  uses: 0/${result.max_uses}`)
      },
    }),

    invites: defineCommand({
      meta: {
        name: 'invites',
        description: 'List active invites for a team.',
      },
      args: {
        teamId: { type: 'positional', required: true, description: 'Team ULID.' },
        json: { type: 'boolean', description: 'JSON output.' },
        endpoint: { type: 'string', description: 'Override plans endpoint.' },
      },
      async run({ args }) {
        const list = await apiCall<InviteSummary[]>(
          'GET',
          `/api/teams/${args.teamId}/invites`,
          { endpoint: args.endpoint },
        )
        if (args.json) { printJson(list); return }
        if (list.length === 0) { printLine('(no active invites)'); return }
        for (const inv of list) {
          printLine(
            `${inv.id}  ${inv.used_count}/${inv.max_uses} uses  exp ${new Date(inv.expires_at * 1000).toISOString()}${inv.note ? `  note: ${inv.note}` : ''}`,
          )
        }
      },
    }),

    'revoke-invite': defineCommand({
      meta: {
        name: 'revoke-invite',
        description: 'Revoke an invite by id.',
      },
      args: {
        inviteId: { type: 'positional', required: true, description: 'Invite ULID (from `ape-plans teams invites <team>`).' },
        endpoint: { type: 'string', description: 'Override plans endpoint.' },
      },
      async run({ args }) {
        await apiCall('DELETE', `/api/invites/${args.inviteId}`, { endpoint: args.endpoint })
        printLine('revoked')
      },
    }),
  },
  async run({ args }) {
    const teams = await apiCall<TeamListItem[]>('GET', '/api/teams', { endpoint: args.endpoint })
    if (args.json) { printJson(teams); return }
    if (teams.length === 0) { printLine('(no teams — create one with `ape-plans teams new "<name>"`)'); return }
    for (const t of teams) {
      printLine(
        `${t.id}  ${t.name.padEnd(30)}  role ${t.role.padEnd(7)} members ${t.member_count}  plans ${t.plan_count}`,
      )
    }
  },
})
