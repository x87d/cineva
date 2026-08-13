/**
 * Minimal RFC-4180 CSV parser. Written rather than pulled in as a dependency
 * because Letterboxd's format is small and well-defined — but it does need to
 * handle quoted fields with embedded commas and newlines (reviews contain both).
 */
export function parseCsv(text: string): string[][] {
  // Strip a UTF-8 byte-order mark, which Excel-saved files often carry.
  const input = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"' // an escaped quote
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\r') {
      // handled by the \n branch; CRLF and LF both work
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Maps header names to column indexes, case- and space-insensitively. */
export function headerIndex(header: string[]): Map<string, number> {
  const map = new Map<string, number>()
  header.forEach((name, index) => {
    map.set(name.trim().toLowerCase(), index)
  })
  return map
}
