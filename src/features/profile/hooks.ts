import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { fetchProfile, updateProfile } from './api'
import type { ProfileUpdate } from './types'

export function useProfile() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()

  const profile = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  })

  const save = useMutation({
    mutationFn: (patch: ProfileUpdate) => updateProfile(userId as string, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  })

  return {
    profile: profile.data ?? null,
    isLoading: profile.isLoading,
    error: profile.error as Error | null,
    save,
    userId,
  }
}
