export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  created_at: string
}

export type ProfileUpdate = Partial<Pick<Profile, 'username' | 'bio' | 'avatar_url' | 'banner_url'>>
