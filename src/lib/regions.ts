const KEY = 'cineva:v1:region'

export interface Region {
  code: string
  name: string
}

/** A short list rather than every country — enough for the audience, no clutter. */
export const REGIONS: Region[] = [
  { code: 'LB', name: 'Lebanon' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
]

export const DEFAULT_REGION = 'LB'

export function loadRegion(): string {
  try {
    return localStorage.getItem(KEY) || DEFAULT_REGION
  } catch {
    return DEFAULT_REGION
  }
}

export function saveRegion(code: string): void {
  try {
    localStorage.setItem(KEY, code)
  } catch {
    // ignore — the session still works
  }
}

export function regionName(code: string): string {
  return REGIONS.find((r) => r.code === code)?.name ?? code
}
