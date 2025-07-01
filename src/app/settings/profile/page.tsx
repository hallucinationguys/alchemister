'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-provider'

interface User {
  id: string
  email: string
  email_verified: boolean
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  full_name: string
  display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { token, loading: authLoading, logout } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement API call to update profile
    console.log('Profile updated with:', formData)
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

  if (error) {
    return <div>{error}</div>
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
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user.email} disabled />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={formData.firstName} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={formData.lastName} onChange={handleInputChange} />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button type="submit">Update profile</Button>
        </div>
      </form>
    </div>
  )
}
