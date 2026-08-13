import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Tolerate common .env slips: surrounding quotes, stray spaces, a trailing slash. */
function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '')
}

const url = clean(import.meta.env.VITE_SUPABASE_URL)
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Human-readable reason the client is unusable, or null when it's fine. */
export const supabaseConfigError: string | null = (() => {
  if (!url && !anonKey) return 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server.'
  if (!url) return 'VITE_SUPABASE_URL is missing from .env.'
  if (!anonKey) return 'VITE_SUPABASE_ANON_KEY is missing from .env.'
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    return `VITE_SUPABASE_URL looks wrong: "${url}". It should look like https://your-project.supabase.co`
  }
  return null
})()

if (supabaseConfigError) console.warn(`[cineva auth] ${supabaseConfigError}`)
else console.info(`[cineva auth] using Supabase project: ${url}`)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export const supabaseUrl = url

/**
 * Confirms the project is actually reachable from this browser.
 * Distinguishes "project asleep / URL wrong / request blocked" from a real auth failure.
 */
export async function checkSupabaseReachable(): Promise<{ ok: boolean; message?: string }> {
  if (!url) return { ok: false, message: supabaseConfigError ?? 'Not configured.' }
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey },
    })
    if (response.ok) return { ok: true }
    return { ok: false, message: `Supabase answered ${response.status}.` }
  } catch {
    return {
      ok: false,
      message: `Could not reach ${url} from this browser. The project is reachable if that URL opens in a new tab — in which case an extension (ad/tracker blocker) or your network is blocking the request. If it doesn't open, the URL in .env doesn't match your project.`,
    }
  }
}
