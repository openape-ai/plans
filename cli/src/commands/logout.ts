import { clearSpToken } from '@openape/cli-auth'
import { defineCommand } from 'citty'
import { existsSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { resolveEndpoint } from '../config.ts'
import { info } from '../output.ts'

/**
 * Drop the cached SP-token for plans.openape.ai. Doesn't touch the IdP
 * session — that's owned by `apes login` / `apes logout`. Use
 * `--legacy` to also delete the pre-1.0 `~/.openape/auth-plans.json`
 * file if it's still hanging around from before the SSO refactor.
 *
 * EXAMPLES
 *   $ ape-plans logout                # clear plans-scope SP-token cache
 *   $ ape-plans logout --legacy       # also delete legacy auth-plans.json
 */
export const logoutCommand = defineCommand({
  meta: {
    name: 'logout',
    description: 'Forget the cached plans SP-token (does NOT log you out of `apes`).',
  },
  args: {
    endpoint: { type: 'string', description: 'Override plans endpoint.' },
    legacy: { type: 'boolean', description: 'Also delete the legacy ~/.openape/auth-plans.json file.' },
  },
  async run({ args }) {
    const endpoint = resolveEndpoint(args.endpoint)
    const aud = (() => {
      try { return new URL(endpoint).host }
      catch { return 'plans.openape.ai' }
    })()
    clearSpToken(aud)
    info(`Cleared plans SP-token cache for ${endpoint}.`)

    if (args.legacy) {
      const legacy = join(homedir(), '.openape', 'auth-plans.json')
      if (existsSync(legacy)) {
        unlinkSync(legacy)
        info(`Removed legacy ${legacy}.`)
      }
      else {
        info('No legacy auth-plans.json to remove.')
      }
    }

    info('IdP session (~/.config/apes/auth.json) untouched. Run `apes logout` to clear it.')
  },
})
