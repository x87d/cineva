import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmdbFetch, sendJson, sendError, getQuery } from './_tmdb'

const ALLOWED = new Set([
  'with_genres',
  'without_genres',
  'with_keywords',
  'with_people',
  'with_original_language',
  'primary_release_date.gte',
  'primary_release_date.lte',
  'vote_average.gte',
  'vote_count.gte',
  'sort_by',
  'page',
])

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const query = getQuery(req)
  const params: Record<string, string> = { include_adult: 'false' }
  for (const [key, value] of query.entries()) {
    if (ALLOWED.has(key) && value) params[key] = value
  }
  try {
    const data = await tmdbFetch('/discover/movie', params)
    sendJson(res, 200, data, 60 * 10)
  } catch (err) {
    sendError(res, err, 'Could not load films for those filters.')
  }
}
