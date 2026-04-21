import { defineCommand } from 'citty'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { apiCall, createApiError } from '../api.ts'
import { printJson, printLine } from '../output.ts'

type PlanStatus = 'draft' | 'active' | 'done' | 'archived'
const VALID_STATUS: readonly PlanStatus[] = ['draft', 'active', 'done', 'archived']

interface PlanSummary {
  id: string
  team_id: string
  title: string
  status: PlanStatus
  owner_email: string
  updated_at: number
  updated_by: string
}

interface PlanFull extends PlanSummary {
  body_md: string
  created_at: number
}

interface TeamListItem {
  id: string
  name: string
  role: string
  plan_count: number
}

async function listAllPlans(endpoint: string | undefined, teamFilter?: string): Promise<PlanSummary[]> {
  if (teamFilter) {
    return await apiCall<PlanSummary[]>('GET', `/api/teams/${teamFilter}/plans`, { endpoint })
  }
  const teams = await apiCall<TeamListItem[]>('GET', '/api/teams', { endpoint })
  const all: PlanSummary[] = []
  for (const team of teams) {
    try {
      const plans = await apiCall<PlanSummary[]>('GET', `/api/teams/${team.id}/plans`, { endpoint })
      all.push(...plans)
    }
    catch {
      // If a team denies access we skip it rather than failing the whole list.
    }
  }
  all.sort((a, b) => b.updated_at - a.updated_at)
  return all
}

/**
 * List plans across the teams you belong to.
 *
 * EXAMPLES
 *   $ ape-plans list
 *   01HX...  [active]  Migrate auth to DDISA    (Delta Mind, updated 2h ago)
 *
 *   $ ape-plans list --team 01HXX... --status active --json
 *   [{"id":"…","team_id":"…","title":"…","status":"active",…}]
 */
export const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List plans you can see (optionally filtered by team/status).',
  },
  args: {
    team: { type: 'string', description: 'Team ULID to filter by.' },
    status: { type: 'string', description: 'Filter by status: draft|active|done|archived.' },
    json: { type: 'boolean', description: 'JSON output.' },
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
  },
  async run({ args }) {
    let plans = await listAllPlans(args.endpoint, args.team)
    if (args.status) {
      if (!VALID_STATUS.includes(args.status as PlanStatus)) {
        throw createApiError(400, `Invalid status "${args.status}"`, `Valid: ${VALID_STATUS.join(', ')}.`)
      }
      plans = plans.filter(p => p.status === args.status)
    }
    if (args.json) { printJson(plans); return }
    if (plans.length === 0) { printLine('(no plans)'); return }
    for (const p of plans) {
      printLine(`${p.id}  [${p.status}]  ${p.title}  (team ${p.team_id}, by ${p.owner_email})`)
    }
  },
})

/**
 * Print a plan's Markdown body (or full JSON with --json).
 *
 * EXAMPLES
 *   $ ape-plans show 01HXX...
 *   # Title
 *   …body…
 *
 *   $ ape-plans show 01HXX... --json | jq .status
 */
export const showCommand = defineCommand({
  meta: {
    name: 'show',
    description: 'Print a plan. Default: Markdown body to stdout.',
  },
  args: {
    planId: { type: 'positional', required: true, description: 'Plan ULID.' },
    json: { type: 'boolean', description: 'JSON output (full plan object).' },
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
  },
  async run({ args }) {
    const plan = await apiCall<PlanFull>('GET', `/api/plans/${args.planId}`, { endpoint: args.endpoint })
    if (args.json) { printJson(plan); return }
    process.stdout.write(plan.body_md.endsWith('\n') ? plan.body_md : `${plan.body_md}\n`)
  },
})

/**
 * Create a plan.
 *
 * Body input precedence: --body-from-file > --body-from-stdin > $EDITOR (or empty).
 *
 * EXAMPLES
 *   $ ape-plans new --team 01HXX... --title "Migrate auth"
 *     (opens $EDITOR, content becomes body)
 *
 *   $ echo '# Plan' | ape-plans new --team 01HXX... --title "From stdin" --body-from-stdin
 *
 *   $ ape-plans new --team 01HXX... --title "From file" --body-from-file ./plan.md
 *
 * Prints the new plan id to stdout. With --json, prints the full object.
 */
export const newCommand = defineCommand({
  meta: {
    name: 'new',
    description: 'Create a plan in a team.',
  },
  args: {
    team: { type: 'string', required: true, description: 'Team ULID (required).' },
    title: { type: 'string', required: true, description: 'Plan title (1–200 chars).' },
    status: { type: 'string', description: 'draft|active|done|archived (default draft).' },
    'body-from-stdin': { type: 'boolean', description: 'Read body from stdin.' },
    'body-from-file': { type: 'string', description: 'Read body from a file.' },
    json: { type: 'boolean', description: 'JSON output.' },
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
  },
  async run({ args }) {
    const status = (args.status ?? 'draft') as PlanStatus
    if (!VALID_STATUS.includes(status)) {
      throw createApiError(400, `Invalid status "${args.status}"`, `Valid: ${VALID_STATUS.join(', ')}.`)
    }

    let bodyMd = ''
    if (args['body-from-file']) {
      bodyMd = readFileSync(args['body-from-file'], 'utf-8')
    }
    else if (args['body-from-stdin']) {
      bodyMd = await readStdin()
    }
    else if (process.stdin.isTTY) {
      bodyMd = editInEditor('', `# ${args.title}\n\n`)
    }

    const plan = await apiCall<PlanFull>('POST', `/api/teams/${args.team}/plans`, {
      endpoint: args.endpoint,
      body: { title: args.title, body_md: bodyMd, status },
    })
    if (args.json) { printJson(plan); return }
    printLine(plan.id)
  },
})

/**
 * Edit a plan's body in $EDITOR (or via --body-from-stdin / --body-from-file).
 *
 * EXAMPLES
 *   $ ape-plans edit 01HXX...
 *     (opens $EDITOR with current body pre-loaded)
 *
 *   $ ape-plans edit 01HXX... --body-from-file updated.md
 *
 *   $ cat updated.md | ape-plans edit 01HXX... --body-from-stdin
 */
export const editCommand = defineCommand({
  meta: {
    name: 'edit',
    description: 'Edit a plan body. Opens $EDITOR by default.',
  },
  args: {
    planId: { type: 'positional', required: true, description: 'Plan ULID.' },
    title: { type: 'string', description: 'Change the title.' },
    status: { type: 'string', description: 'Change the status.' },
    'body-from-stdin': { type: 'boolean', description: 'Read new body from stdin.' },
    'body-from-file': { type: 'string', description: 'Read new body from a file.' },
    json: { type: 'boolean', description: 'JSON output.' },
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
  },
  async run({ args }) {
    const current = await apiCall<PlanFull>('GET', `/api/plans/${args.planId}`, { endpoint: args.endpoint })

    const patch: Record<string, unknown> = {}
    if (args.title) patch.title = args.title
    if (args.status) {
      if (!VALID_STATUS.includes(args.status as PlanStatus)) {
        throw createApiError(400, `Invalid status "${args.status}"`, `Valid: ${VALID_STATUS.join(', ')}.`)
      }
      patch.status = args.status
    }

    if (args['body-from-file']) {
      patch.body_md = readFileSync(args['body-from-file'], 'utf-8')
    }
    else if (args['body-from-stdin']) {
      patch.body_md = await readStdin()
    }
    else if (process.stdin.isTTY) {
      patch.body_md = editInEditor(current.body_md, `# ${current.title}\n\n`)
    }

    if (Object.keys(patch).length === 0) {
      throw createApiError(400, 'No changes to send')
    }

    const updated = await apiCall<PlanFull>('PATCH', `/api/plans/${args.planId}`, {
      endpoint: args.endpoint,
      body: patch,
    })
    if (args.json) { printJson(updated); return }
    printLine(`updated ${updated.id}`)
  },
})

/**
 * Change a plan's status.
 *
 * EXAMPLE
 *   $ ape-plans status 01HXX... active
 *   01HXX... → active
 */
export const statusCommand = defineCommand({
  meta: {
    name: 'status',
    description: 'Change a plan status (draft|active|done|archived).',
  },
  args: {
    planId: { type: 'positional', required: true, description: 'Plan ULID.' },
    status: { type: 'positional', required: true, description: 'New status.' },
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
  },
  async run({ args }) {
    if (!VALID_STATUS.includes(args.status as PlanStatus)) {
      throw createApiError(400, `Invalid status "${args.status}"`, `Valid: ${VALID_STATUS.join(', ')}.`)
    }
    await apiCall('PATCH', `/api/plans/${args.planId}`, {
      endpoint: args.endpoint,
      body: { status: args.status },
    })
    printLine(`${args.planId} → ${args.status}`)
  },
})

/**
 * Soft-delete a plan. Only plan owner or team owner.
 *
 * EXAMPLE
 *   $ ape-plans rm 01HXX...
 *   deleted 01HXX...
 */
export const rmCommand = defineCommand({
  meta: {
    name: 'rm',
    description: 'Soft-delete a plan.',
  },
  args: {
    planId: { type: 'positional', required: true, description: 'Plan ULID.' },
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
  },
  async run({ args }) {
    await apiCall('DELETE', `/api/plans/${args.planId}`, { endpoint: args.endpoint })
    printLine(`deleted ${args.planId}`)
  },
})

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on('data', chunk => chunks.push(Buffer.from(chunk)))
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    process.stdin.on('error', reject)
  })
}

function editInEditor(initial: string, placeholder: string): string {
  const editor = process.env.EDITOR || process.env.VISUAL || 'nano'
  const tmpDir = mkdtempSync(join(tmpdir(), 'ape-plans-'))
  const tmpFile = join(tmpDir, 'plan.md')
  writeFileSync(tmpFile, initial || placeholder, 'utf-8')
  try {
    const result = spawnSync(editor, [tmpFile], { stdio: 'inherit' })
    if (result.status !== 0) {
      throw createApiError(0, `$EDITOR (${editor}) exited with status ${result.status}`)
    }
    const contents = readFileSync(tmpFile, 'utf-8')
    return contents === placeholder ? '' : contents
  }
  finally {
    try { rmSync(tmpDir, { recursive: true, force: true }) } catch { /* best effort */ }
  }
}
