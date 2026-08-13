import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmdbFetch, sendJson, sendError, getQuery } from './_tmdb'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const params = getQuery(req)
  const query = params.get('q')?.trim()
  if (!query) {
    sendJson(res, 400, { error: 'Add a search term with ?q=' })
    return
  }
  try {
    const year = params.get('year')
    const data = await tmdbFetch('/search/movie', {
      query,
      include_adult: 'false',
      page: params.get('page') ?? '1',
      // Narrows results dramatically when importing a film list.
      primary_release_year: year && /^\d{4}$/.test(year) ? year : undefined,
    })
    sendJson(res, 200, data)
  } catch (err) {
    sendError(res, err, 'Search failed. Try again.')
  }
}
