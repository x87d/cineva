import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmdbFetch, sendJson, sendError } from './_tmdb'

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const data = await tmdbFetch('/genre/movie/list')
    sendJson(res, 200, data, 60 * 60 * 24)
  } catch (err) {
    sendError(res, err, 'Could not load genres.')
  }
}
