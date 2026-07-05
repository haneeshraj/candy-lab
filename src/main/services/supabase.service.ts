import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

// The Supabase client lives ONLY here, in the main process. The renderer reaches
// it exclusively through the `window.api.releases.*` bridge, so the service-role
// key never enters the sandboxed UI. Credentials come from `MAIN_VITE_*` env
// vars (see `supabase/README.md`); `process.env` is a runtime fallback.

const SUPABASE_URL = import.meta.env.MAIN_VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const SUPABASE_KEY = import.meta.env.MAIN_VITE_SUPABASE_KEY ?? process.env.SUPABASE_KEY

/** Storage bucket for cover art + canvas videos (see `supabase/schema.sql`). */
export const MEDIA_BUCKET = 'release-media'

/** Thrown when the app can't reach Supabase; carries a UI-friendly message. */
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupabaseConfigError'
  }
}

let client: SupabaseClient | null = null

/** True when both credentials are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
}

/**
 * Lazily create (and cache) the Supabase client. Throws a `SupabaseConfigError`
 * with a friendly message when credentials are missing, so callers can surface
 * it to the UI instead of crashing.
 */
export function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new SupabaseConfigError(
      "Supabase isn't configured. Add MAIN_VITE_SUPABASE_URL and MAIN_VITE_SUPABASE_KEY to your .env (see supabase/README.md), then restart the app."
    )
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      // Desktop admin tool: no browser-style auth session to persist.
      auth: { persistSession: false, autoRefreshToken: false }
    })
    logger.info('Supabase client initialized')
  }
  return client
}
