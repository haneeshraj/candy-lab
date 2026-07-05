import http from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app, BrowserWindow, shell } from 'electron'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getAuthCredentials, getSupabase } from './supabase.service'
import { IPC_CHANNELS } from '../ipc/channels'
import { logger } from '../utils/logger'
import type { AccessStatus, AuthState, Profile, UserRole } from '../../preload/ipc/types'

// User-facing authentication. The renderer never touches Supabase Auth or the
// tokens — the main process runs the Google OAuth flow (PKCE) through the system
// browser + a one-shot loopback server, persists the session to a file, and
// reports state back over IPC. Access decisions (approved/pending/banned, admin)
// read the `profiles` table via the service-role client.

// Must match the redirect URL registered in Supabase (Auth → URL Configuration).
const LOOPBACK_PORT = 51789
const REDIRECT_URL = `http://localhost:${LOOPBACK_PORT}/callback`

// ── File-backed session storage (Supabase persists its session through this) ──

interface KeyValueStore {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function createFileStore(): KeyValueStore {
  const file = join(app.getPath('userData'), 'auth-store.json')
  let cache: Record<string, string> = {}
  try {
    cache = JSON.parse(readFileSync(file, 'utf-8')) as Record<string, string>
  } catch {
    cache = {} // first run / missing file
  }
  const persist = (): void => {
    try {
      writeFileSync(file, JSON.stringify(cache), 'utf-8')
    } catch (error) {
      logger.error('Failed to persist auth session', error)
    }
  }
  return {
    getItem: (key) => cache[key] ?? null,
    setItem: (key, value) => {
      cache[key] = value
      persist()
    },
    removeItem: (key) => {
      delete cache[key]
      persist()
    }
  }
}

// ── Auth client (anon key, PKCE, file-persisted) ──────────────────────────────

let authClient: SupabaseClient | null = null

function getAuthClient(): SupabaseClient {
  if (!authClient) {
    const { url, anonKey } = getAuthCredentials()
    authClient = createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // there's no browser URL in the main process
        storage: createFileStore()
      }
    })
    logger.info('Auth client initialized')
  }
  return authClient
}

// ── Profile mapping + state ───────────────────────────────────────────────────

interface ProfileRow {
  id: string
  email: string
  name: string | null
  notes: string | null
  role: UserRole
  status: AccessStatus
  created_at: string
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    notes: row.notes,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  }
}

const SIGNED_OUT: AuthState = { authenticated: false, user: null, profile: null }

/** Read the current session + profile. Never throws — returns signed-out when
 * unconfigured or on error, so the UI can always fall back to the login gate. */
export async function getAuthState(): Promise<AuthState> {
  let supabase: SupabaseClient
  try {
    supabase = getAuthClient()
  } catch {
    return SIGNED_OUT
  }

  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session) return SIGNED_OUT

  const user = { id: session.user.id, email: session.user.email ?? null }

  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, email, name, notes, role, status, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    logger.error('Failed to read profile', error)
    return { authenticated: true, user, profile: null }
  }

  return { authenticated: true, user, profile: data ? mapProfile(data as ProfileRow) : null }
}

function broadcast(state: AuthState): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.AUTH_STATE_CHANGED, state)
  }
}

// ── Google sign-in (system browser + loopback callback) ───────────────────────

interface CallbackResult {
  code?: string
  error?: string
}

/** Run a one-shot HTTP server that captures the OAuth redirect on /callback. */
function awaitCallback(): Promise<CallbackResult> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: CallbackResult): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      server.close()
      resolve(result)
    }

    const server = http.createServer((req, res) => {
      const requestUrl = new URL(req.url ?? '/', REDIRECT_URL)
      if (requestUrl.pathname !== '/callback') {
        res.writeHead(404)
        res.end()
        return
      }
      const code = requestUrl.searchParams.get('code') ?? undefined
      const error =
        requestUrl.searchParams.get('error_description') ??
        requestUrl.searchParams.get('error') ??
        undefined

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#121212;color:#efe7d3;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#c69953">candy-lab</h2><p>${
          error
            ? 'Sign-in failed. You can close this window.'
            : 'Signed in — you can close this window and return to the app.'
        }</p></div></body></html>`
      )
      finish({ code, error })
    })

    server.on('error', (err) => finish({ error: String(err) }))
    const timer = setTimeout(() => finish({ error: 'Timed out waiting for sign-in.' }), 5 * 60_000)
    server.listen(LOOPBACK_PORT)
  })
}

/** Begin Google OAuth: open the browser, capture the redirect, exchange the code
 * for a session, and return the resulting state. */
export async function signInWithGoogle(): Promise<AuthState> {
  const supabase = getAuthClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_URL, skipBrowserRedirect: true }
  })
  if (error || !data?.url) {
    throw new Error(error?.message ?? 'Could not start Google sign-in.')
  }

  // Start listening before opening the browser so the redirect can't race us.
  const callback = awaitCallback()
  await shell.openExternal(data.url)

  const { code, error: cbError } = await callback
  if (cbError || !code) {
    throw new Error(cbError ?? 'Sign-in was cancelled.')
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    throw new Error(exchangeError.message)
  }

  const state = await getAuthState()
  broadcast(state)
  return state
}

export async function signOut(): Promise<void> {
  try {
    await getAuthClient().auth.signOut()
  } catch (error) {
    logger.error('Sign-out failed', error)
  }
  broadcast(SIGNED_OUT)
}

// ── Admin access management (service-role; admin-guarded) ──────────────────────

/** Ensure the caller is an approved admin; returns their id. */
async function requireAdmin(): Promise<string> {
  const state = await getAuthState()
  if (
    !state.authenticated ||
    !state.profile ||
    state.profile.role !== 'admin' ||
    state.profile.status !== 'approved'
  ) {
    throw new Error('Admin access required.')
  }
  return state.profile.id
}

const PROFILE_COLUMNS = 'id, email, name, notes, role, status, created_at'

export async function listUsers(): Promise<Profile[]> {
  await requireAdmin()
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('listUsers failed', error)
    throw new Error(error.message)
  }
  return (data as ProfileRow[]).map(mapProfile)
}

async function updateProfileRow(id: string, changes: Record<string, unknown>): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) {
    logger.error('updateProfileRow failed', error)
    throw new Error(error.message)
  }
  return mapProfile(data as ProfileRow)
}

export async function setStatus(id: string, status: AccessStatus): Promise<Profile> {
  const adminId = await requireAdmin()
  if (id === adminId) throw new Error("You can't change your own access.")
  return updateProfileRow(id, { status })
}

export async function setRole(id: string, role: UserRole): Promise<Profile> {
  const adminId = await requireAdmin()
  if (id === adminId) throw new Error("You can't change your own role.")
  return updateProfileRow(id, { role })
}

export async function updateUser(
  id: string,
  changes: { name?: string; notes?: string }
): Promise<Profile> {
  await requireAdmin()
  const patch: Record<string, unknown> = {}
  if (typeof changes.name === 'string') patch.name = changes.name.trim()
  if (typeof changes.notes === 'string') patch.notes = changes.notes
  return updateProfileRow(id, patch)
}
