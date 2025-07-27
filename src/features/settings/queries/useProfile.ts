'use client'

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { profileService } from '@/api/services/settings-service'
import { handleQueryError, showQueryError } from '@/shared/lib/react-query/errorHandling'
import type { UserResponse, UpdateUserRequest } from '@/features/settings/types/types'

/**
 * Query keys for profile-related queries
 */
export const profileKeys = {
  all: ['profile'] as const,
  details: () => [...profileKeys.all, 'details'] as const,
}

/**
 * Hook for fetching user profile
 */
export const useProfile = (options?: UseQueryOptions<UserResponse>) => {
  return useQuery({
    queryKey: profileKeys.details(),
    queryFn: () => profileService.getProfile(),
    ...options,
  })
}

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation<UserResponse, Error, UpdateUserRequest>({
    mutationFn: (data: UpdateUserRequest) => profileService.updateProfile(data),
    onSuccess: updatedProfile => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: profileKeys.details() })

      // Optimistically update the profile in the cache
      queryClient.setQueryData(profileKeys.details(), updatedProfile)
    },
    onError: (error: Error) => {
      const apiError = handleQueryError(error)
      showQueryError(apiError)
    },
  })
}
