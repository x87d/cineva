import { supabase } from '@/lib/supabase'
import type { Profile, ProfileUpdate } from './types'

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/

/** Shared rule so sign-up and settings validate identically. */
export function validateUsername(username: string): string | null {
  const value = username.trim()
  if (!value) return 'Pick a username.'
  if (value.length < 3) return 'At least 3 characters.'
  if (value.length > 20) return 'At most 20 characters.'
  if (!USERNAME_PATTERN.test(value)) return 'Letters, numbers and underscores only.'
  return null
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, banner_url, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/** Case-insensitive availability check; the unique index is the real guarantee. */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  if (!supabase) return true
  let query = supabase.from('profiles').select('id').ilike('username', username.trim())
  if (excludeUserId) query = query.neq('id', excludeUserId)
  const { data, error } = await query.limit(1)
  if (error) throw new Error(error.message)
  return !data?.length
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<void> {
  if (!supabase) throw new Error('Accounts are not configured.')
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' })
  if (error) {
    // The unique index fires when two people race for the same name.
    if (/duplicate key|unique/i.test(error.message)) throw new Error('That username is taken.')
    throw new Error(error.message)
  }
}

const MAX_BYTES = 3 * 1024 * 1024

/** Uploads to the user's own folder in the public `avatars` bucket. */
export async function uploadProfileImage(
  userId: string,
  file: File,
  kind: 'avatar' | 'banner',
): Promise<string> {
  if (!supabase) throw new Error('Accounts are not configured.')
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > MAX_BYTES) throw new Error('Images must be under 3 MB.')

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${kind}-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
