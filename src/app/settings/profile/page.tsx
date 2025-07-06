'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-provider'
import { useProfile } from './hooks/use-profile'
import type { UserResponse } from '../types'

export default function ProfilePage() {
  const { token, loading: authLoading, logout } = useAuth()
  const { updateProfile, loading: updateLoading, error: updateError } = useProfile()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (authLoading) return
      if (!token) return

      setLoading(true)
      try {
        const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
        const res = await fetch(`${api_url}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          if (res.status === 401) {
            logout()
            return
          }
          throw new Error('Failed to fetch data')
        }

        const json = await res.json()
        const fetchedUser = json.data.user
        setUser(fetchedUser)
        setFormData({
          firstName: fetchedUser.first_name || '',
          lastName: fetchedUser.last_name || '',
        })
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unknown error occurred while fetching the profile.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token, authLoading, logout])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prevState => ({ ...prevState, [id]: value }))
    // Clear messages when user starts typing
    setSuccessMessage(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setError(null)

    try {
      const updatedUser = await updateProfile({
        first_name: formData.firstName || undefined,
        last_name: formData.lastName || undefined,
      })

      if (updatedUser) {
        setUser(updatedUser)
        setSuccessMessage('Profile updated successfully!')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  if (loading || authLoading) {
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

  if (error && !user) {
    return <div className="text-destructive">{error}</div>
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
      {(error || updateError) && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error || updateError}</p>
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
              disabled={updateLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={updateLoading}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button type="submit" disabled={updateLoading}>
            {updateLoading ? 'Updating...' : 'Update profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}
