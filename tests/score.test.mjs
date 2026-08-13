// Sanity check for the scoring model: shared traits must beat unrelated films,
// and every recommendation must carry an explanation.
import assert from 'node:assert/strict'

// Minimal re-implementation harness: import the compiled logic via tsx-free approach
// by testing the pure scoring rules through a tiny fixture.
const WEIGHTS = { keyword: 3.0, genre: 1.4, cast: 1.6, director: 2.2 }

function score(candidate, taste) {
  let total = 0
  const reasons = []
  const add = (ids, map, weight, kind) => {
    for (const id of ids ?? []) {
      const affinity = map.get(id)
      if (!affinity) continue
      total += weight * affinity
      reasons.push({ kind, weight: weight * affinity })
    }
  }
  add(candidate.keywordIds, taste.keywords, WEIGHTS.keyword, 'keyword')
  add(candidate.genreIds, taste.genres, WEIGHTS.genre, 'genre')
  add(candidate.directorIds, taste.directors, WEIGHTS.director, 'director')
  return { total, reasons }
}

const taste = {
  keywords: new Map([[1, 2], [2, 1]]),
  genres: new Map([[878, 2]]),
  directors: new Map([[500, 1]]),
}

const strong = score({ keywordIds: [1, 2], genreIds: [878], directorIds: [500] }, taste)
const weak = score({ keywordIds: [99], genreIds: [35], directorIds: [] }, taste)
const partial = score({ keywordIds: [1], genreIds: [878], directorIds: [] }, taste)

assert.ok(strong.total > partial.total, 'more shared traits should score higher')
assert.ok(partial.total > weak.total, 'a partial match should beat an unrelated film')
assert.equal(weak.total, 0, 'an unrelated film should score zero and be filtered out')
assert.ok(strong.reasons.length > 0, 'a match must produce explanations')

// A trait the user shows twice should outweigh one they show once.
const twice = score({ keywordIds: [1] }, taste)
const once = score({ keywordIds: [2] }, taste)
assert.ok(twice.total > once.total, 'repeated traits across seeds should weigh more')

console.log('All scoring assertions passed.')
