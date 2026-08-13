// Verifies the taste aggregation: traits shared across more films rank higher,
// 5-star films count double, and strength is relative to the top trait.
import assert from 'node:assert/strict'

function bump(tally, id, name) {
  const existing = tally.get(id)
  if (existing) existing.count += 1
  else tally.set(id, { name, count: 1 })
}

function rank(tally, limit) {
  const rows = [...tally.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, limit)
  const max = rows[0]?.[1].count ?? 1
  return rows.map(([id, e]) => ({ id, name: e.name, count: e.count, strength: e.count / max }))
}

function aggregate(movies, ratings) {
  const genres = new Map()
  for (const movie of movies) {
    const weight = (ratings.get(movie.id) ?? 0) >= 5 ? 2 : 1
    for (let i = 0; i < weight; i += 1) {
      for (const g of movie.genres) bump(genres, g.id, g.name)
    }
  }
  return rank(genres, 8)
}

const scifi = { id: 878, name: 'Science Fiction' }
const drama = { id: 18, name: 'Drama' }
const comedy = { id: 35, name: 'Comedy' }

const movies = [
  { id: 1, genres: [scifi, drama] },
  { id: 2, genres: [scifi] },
  { id: 3, genres: [comedy] },
]

const flat = aggregate(movies, new Map())
assert.equal(flat[0].name, 'Science Fiction', 'the most-shared genre ranks first')
assert.equal(flat[0].count, 2)
assert.equal(flat[0].strength, 1, 'the top trait has full strength')
assert.ok(flat[1].strength < 1, 'lesser traits are proportionally weaker')

// A 5-star comedy should outweigh two unrated sci-fi films' single mentions.
const weighted = aggregate(
  [{ id: 3, genres: [comedy] }, { id: 2, genres: [scifi] }],
  new Map([[3, 5]]),
)
assert.equal(weighted[0].name, 'Comedy', 'a 5-star film counts double')
assert.equal(weighted[0].count, 2)

// An unrelated film shares nothing -> no overlap to explain.
const overlap = ['Comedy'].filter((g) => flat.slice(0, 2).map((t) => t.name).includes(g))
assert.equal(overlap.length, 0, 'no false overlaps reported')

console.log('All taste-profile assertions passed.')
