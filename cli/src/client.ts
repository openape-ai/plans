/**
 * Shared SP client instance for plans.openape.ai.
 *
 * Single call-site for createSpClient — all command modules and helpers
 * import from here (via the api/config/output shims) rather than reaching
 * into @openape/cli-auth directly.
 */
import { createSpClient } from '@openape/cli-auth'
import type { SpClientState } from '@openape/cli-auth'

export interface PlansState extends SpClientState {
  endpoint?: string
  /** Default team ULID for this endpoint. `teams use <id>` sets it. */
  activeTeamId?: string
}

export const plansClient = createSpClient<PlansState>({
  defaultEndpoint: 'https://plans.openape.ai',
  envVar: 'APE_PLANS_ENDPOINT',
  configFile: 'auth-plans.json',
  defaultAud: 'plans.openape.ai',
})

export const {
  configPath,
  resolveEndpoint,
  loadConfig,
  saveConfig,
  apiCall: _apiCall,
  _request,
} = plansClient
