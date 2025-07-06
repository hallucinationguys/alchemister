import { useState } from 'react'
import type { UpdateUserRequest, UserResponse, UseProfileResult } from '../../types'

export const useProfile = (): UseProfileResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = async (data: UpdateUserRequest): Promise<UserResponse | undefined> => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      }

      const response = await fetch('/settings/api/profile', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update profile')
      }

      const responseData = await response.json()
      return responseData.data.user as UserResponse
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error updating profile:', err)
      return undefined
    } finally {
      setLoading(false)
    }
  }

  return {
    updateProfile,
    loading,
    error,
  }
}
