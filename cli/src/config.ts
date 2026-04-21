import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

/**
 * CLI state lives at `~/.openape/plans.json` (chmod 600). Multiple endpoints
 * (e.g. local dev vs prod) can coexist under `endpoints["<url>"]`; the
 * `activeEndpoint` key selects the default.
 *
 * Override endpoint per invocation via `--endpoint <url>`. Override the
 * default at startup via `APE_PLANS_ENDPOINT` env var.
 */

const DEFAULT_ENDPOINT = process.env.APE_PLANS_ENDPOINT ?? 'https://plans.openape.ai'

export interface EndpointState {
  endpoint: string
  token: string
  email: string
  act?: 'human' | 'agent'
  tokenExpiresAt?: number
}

export interface CliConfig {
  activeEndpoint: string
  endpoints: Record<string, EndpointState>
}

const CONFIG_DIR = join(homedir(), '.openape')
const CONFIG_FILE = join(CONFIG_DIR, 'plans.json')

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
}

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) {
    return { activeEndpoint: DEFAULT_ENDPOINT, endpoints: {} }
  }
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<CliConfig>
    return {
      activeEndpoint: parsed.activeEndpoint ?? DEFAULT_ENDPOINT,
      endpoints: parsed.endpoints ?? {},
    }
  }
  catch {
    return { activeEndpoint: DEFAULT_ENDPOINT, endpoints: {} }
  }
}

export function saveConfig(config: CliConfig): void {
  ensureConfigDir()
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })
  try { chmodSync(CONFIG_FILE, 0o600) } catch { /* best effort */ }
}

export function resolveEndpoint(override?: unknown): string {
  if (typeof override === 'string' && override.length > 0) return override.replace(/\/$/, '')
  const config = loadConfig()
  return (config.activeEndpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '')
}

export function getActiveSession(endpointOverride?: unknown): EndpointState | null {
  const endpoint = resolveEndpoint(endpointOverride)
  const config = loadConfig()
  const state = config.endpoints[endpoint]
  if (!state?.token) return null
  return state
}

export function setActiveSession(state: EndpointState): void {
  const config = loadConfig()
  config.activeEndpoint = state.endpoint
  config.endpoints[state.endpoint] = state
  saveConfig(config)
}

export function clearActiveSession(endpointOverride?: unknown): void {
  const endpoint = resolveEndpoint(endpointOverride)
  const config = loadConfig()
  delete config.endpoints[endpoint]
  if (Object.keys(config.endpoints).length === 0) {
    if (existsSync(CONFIG_FILE)) {
      try { unlinkSync(CONFIG_FILE) } catch { /* best effort */ }
    }
    return
  }
  if (config.activeEndpoint === endpoint) {
    config.activeEndpoint = Object.keys(config.endpoints)[0] ?? DEFAULT_ENDPOINT
  }
  saveConfig(config)
}

export function configPath(): string {
  return CONFIG_FILE
}

export { DEFAULT_ENDPOINT, dirname }
