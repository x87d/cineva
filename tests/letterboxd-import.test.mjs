// Tests the CSV parser and match scoring against realistic Letterboxd export rows:
// quoted titles with commas, embedded newlines in reviews, half-star ratings,
// remakes that must not silently match the wrong film.
import assert from 'node:assert/strict'

// --- mirrors src/features/import/csv.ts ---
function parseCsv(text) {
  const input = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < input.length; i += 1) {
    const c = input[i]
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i += 1 } else { inQuotes = false }
      } else field += c
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

function normalizeTitle(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function toCinevaRating(r) {
  if (r === null || Number.isNaN(r)) return null
  return Math.min(5, Math.max(1, Math.round(r)))
}

function judge(row, cand) {
  const wanted = normalizeTitle(row.title), found = normalizeTitle(cand.title)
  const cy = cand.release_date ? Number(cand.release_date.slice(0, 4)) : null
  const exact = wanted === found
  const gap = row.year && cy ? Math.abs(row.year - cy) : null
  if (exact && gap !== null && gap <= 1) return 'high'
  if (exact && gap === null) return 'medium'
  if (exact && gap !== null && gap <= 3) return 'medium'
  if (!exact && (found.includes(wanted) || wanted.includes(found)))
    return gap !== null && gap <= 1 ? 'medium' : 'low'
  return 'low'
}

// --- 1. Real-shaped CSV with awkward fields ---
const csv = `Date,Name,Year,Letterboxd URI,Rating
2024-01-05,"Dune: Part Two",2024,https://boxd.it/x1,4.5
2024-02-11,"Good, the Bad and the Ugly",1966,https://boxd.it/x2,5
2024-03-02,"He said ""hello""",2001,https://boxd.it/x3,3
2024-03-09,Amélie,2001,https://boxd.it/x4,4
`
const rows = parseCsv(csv)
assert.equal(rows.length, 5, 'header + 4 data rows')
assert.equal(rows[2][1], 'Good, the Bad and the Ugly', 'a comma inside quotes stays in the field')
assert.equal(rows[3][1], 'He said "hello"', 'escaped quotes unescape correctly')

// --- 2. Review field containing a newline must not split the row ---
const withNewline = 'Name,Year,Review\n"Whiplash",2014,"Line one\nLine two"\n'
const nlRows = parseCsv(withNewline)
assert.equal(nlRows.length, 2, 'an embedded newline does not create a phantom row')
assert.ok(nlRows[1][2].includes('\n'), 'the newline is preserved inside the field')

// --- 3. Half-star conversion ---
assert.equal(toCinevaRating(4.5), 5)
assert.equal(toCinevaRating(0.5), 1, 'never rounds down to zero')
assert.equal(toCinevaRating(3), 3)
assert.equal(toCinevaRating(null), null, 'unrated films stay unrated')

// --- 4. Accents and articles normalize ---
assert.equal(normalizeTitle('Amélie'), 'amelie')
assert.equal(normalizeTitle('The Godfather'), 'godfather')

// --- 5. Remakes: the wrong-year match must NOT be auto-selected ---
const dune = { title: 'Dune', year: 2021 }
assert.equal(judge(dune, { title: 'Dune', release_date: '2021-09-15' }), 'high')
assert.equal(judge(dune, { title: 'Dune', release_date: '1984-12-14' }), 'low',
  'a 1984 remake is flagged for review, not imported silently')

// --- 6. Partial titles are low confidence ---
assert.equal(judge({ title: 'Alien', year: 1979 },
  { title: 'Aliens', release_date: '1986-07-18' }), 'low')

console.log('All Letterboxd import assertions passed.')
