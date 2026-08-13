const KEY = 'cineva:v1:taste'

export interface StoredTaste {
  seedIds: number[]
  quizGenreIds: number[]
  updatedAt: string
}

/** Guest taste lives in the browser; a signed-in user's taste will come from Supabase later. */
export function loadTaste(): StoredTaste | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTaste
    if (!Array.isArray(parsed.seedIds)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveTaste(seedIds: number[], quizGenreIds: number[]): void {
  try {
    const payload: StoredTaste = { seedIds, quizGenreIds, updatedAt: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // storage can be unavailable (private mode); recommendations still work in-session
  }
}

export function clearTaste(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
