'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Skeleton } from '@/shared/ui/skeleton'
import { useAuth } from '@/shared/contexts/auth-provider'
import { useProfile, useUpdateProfile } from '@/features/settings/queries/useProfile'
import type { UpdateUserRequest } from '@/features/settings/types/types'

export default function ProfilePageWithQuery() {
  const { logout } = useAuth()

  // Use React Query hooks for fetching and updating profile
  const { data: user, isLoading, isError, error: fetchError } = useProfile()

  const updateProfileMutation = useUpdateProfile()

  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
  })

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prevState => ({ ...prevState, [id]: value }))
    // Clear success message when user starts typing
    setSuccessMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    const updateData: UpdateUserRequest = {
      first_name: formData.firstName || undefined,
      last_name: formData.lastName || undefined,
    }

    try {
      await updateProfileMutation.mutateAsync(updateData)
      setSuccessMessage('Profile updated successfully!')
    } catch (err) {
      // Error handling is done by React Query
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-8 pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-destructive">
        {(fetchError as Error)?.message || 'Failed to load profile'}
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {updateProfileMutation.isError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">
            {(updateProfileMutation.error as Error)?.message || 'Failed to update profile'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user.email} disabled />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={updateProfileMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={updateProfileMutation.isPending}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? 'Updating...' : 'Update profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}
