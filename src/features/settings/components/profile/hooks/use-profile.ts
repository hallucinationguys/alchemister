'use client'

import {
  useProfile as useProfileQuery,
  useUpdateProfile,
} from '@/features/settings/queries/useProfile'
import { useState } from 'react'
import type { UpdateUserRequest, UserResponse } from '@/features/settings/types/types'

/**
 * Hook for managing profile data and updates
 */
export function useProfile() {
  const [isEditing, setIsEditing] = useState(false)

  // Use the React Query hooks
  const profileQuery = useProfileQuery()
  const updateProfileMutation = useUpdateProfile()

  const startEditing = () => setIsEditing(true)
  const cancelEditing = () => setIsEditing(false)

  const updateProfile = async (data: UpdateUserRequest) => {
    try {
      await updateProfileMutation.mutateAsync(data)
      setIsEditing(false)
      return true
    } catch (error) {
      return false
    }
  }

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    isEditing,
    startEditing,
    cancelEditing,
    updateProfile,
    isUpdating: updateProfileMutation.isPending,
  }
}
