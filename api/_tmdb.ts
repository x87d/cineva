import type { IncomingMessage, ServerResponse } from 'node:http'

const TMDB_BASE = 'https://api.themoviedb.org/3'

export function getApiKey(): string {
  const key = process.env.TMDB_API_KEY
  if (!key) {
    throw new Error('Missing TMDB_API_KEY — add it to .env and restart the dev server.')
  }
  return key
}

type Params = Record<string, string | number | undefined>

/** Calls TMDB with the server-side key attached. Throws a descriptive error on failure. */
export async function tmdbFetch<T = unknown>(pathname: string, params: Params = {}): Promise<T> {
  const url = new URL(TMDB_BASE + pathname)
  url.searchParams.set('api_key', getApiKey())
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  }

  let response: Response
  try {
    response = await fetch(url, { headers: { accept: 'application/json' } })
  } catch (cause) {
    throw new Error(`Could not reach TMDB (network error: ${(cause as Error).message})`)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    const error = new Error(
      `TMDB responded ${response.status}${body ? ` — ${body.slice(0, 200)}` : ''}`,
    ) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return response.json() as Promise<T>
}

export function getQuery(req: IncomingMessage): URLSearchParams {
  return new URL(req.url ?? '', 'http://localhost').searchParams
}

export function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
  cacheSeconds = 0,
): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  if (cacheSeconds > 0) {
    res.setHeader(
      'cache-control',
      `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    )
  }
  res.end(JSON.stringify(data))
}

/** Logs the real cause to the terminal and, in dev, returns it so failures are diagnosable. */
export function sendError(res: ServerResponse, err: unknown, userMessage: string): void {
  const detail = err instanceof Error ? err.message : String(err)
  console.error(`[cineva api] ${userMessage} :: ${detail}`)
  const isDev = process.env.NODE_ENV !== 'production'
  sendJson(res, 502, isDev ? { error: userMessage, detail } : { error: userMessage })
}
