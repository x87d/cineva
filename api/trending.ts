import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmdbFetch, sendJson, sendError } from './_tmdb'

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const data = await tmdbFetch('/trending/movie/week')
    sendJson(res, 200, data, 60 * 30)
  } catch (err) {
    sendError(res, err, 'Could not load trending films right now.')
  }
}
