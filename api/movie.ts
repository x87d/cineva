import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmdbFetch, sendJson, sendError, getQuery } from './_tmdb'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const id = getQuery(req).get('id')
  if (!id || !/^\d+$/.test(id)) {
    sendJson(res, 400, { error: 'A numeric ?id= is required.' })
    return
  }
  try {
    const data = await tmdbFetch(`/movie/${id}`, {
      append_to_response: 'credits,keywords,videos,similar,recommendations,watch/providers',
    })
    sendJson(res, 200, data, 60 * 60)
  } catch (err) {
    sendError(res, err, 'Could not load the film.')
  }
}
