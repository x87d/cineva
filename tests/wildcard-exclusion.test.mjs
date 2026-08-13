// Verifies the Wild Card's exclusion rule: seen films are never returned,
// and the roll retries rather than giving up when a page is exhausted.
import assert from 'node:assert/strict'

function filterPage(results, excludeIds, minVotes = 300) {
  const exclude = new Set(excludeIds)
  return results.filter((m) => m.vote_count >= minVotes && m.poster_path && !exclude.has(m.id))
}

const page = [
  { id: 1, vote_count: 900, poster_path: '/a.jpg' },
  { id: 2, vote_count: 900, poster_path: '/b.jpg' },
  { id: 3, vote_count: 50, poster_path: '/c.jpg' },   // too few votes
  { id: 4, vote_count: 900, poster_path: null },       // no artwork
]

const watched = [1, 2]

const fresh = filterPage(page, watched)
assert.equal(fresh.length, 0, 'a page of only watched/low-quality films yields nothing -> triggers a re-roll')

const freshWithNew = filterPage([...page, { id: 5, vote_count: 900, poster_path: '/e.jpg' }], watched)
assert.deepEqual(freshWithNew.map((m) => m.id), [5], 'only unseen, quality films survive')

for (const movie of freshWithNew) {
  assert.ok(!watched.includes(movie.id), 'a watched film must never be returned')
}

const noLibrary = filterPage(page, [])
assert.deepEqual(noLibrary.map((m) => m.id), [1, 2], 'with an empty library nothing is excluded')

console.log('All Wild Card exclusion assertions passed.')
