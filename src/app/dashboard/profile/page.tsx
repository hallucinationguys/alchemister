'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      const accessToken = localStorage.getItem('access_token')

      if (!accessToken) {
        router.push('/auth')
        return
      }

      try {
        const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
        const res = await fetch(`${api_url}/users/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!res.ok) {
          throw new Error('Failed to fetch data')
        }

        const json = await res.json()
        setUser(json.data.user)
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
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // or some other placeholder
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={user.avatar_url || ''} alt={user.display_name} />
              <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.display_name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Full Name:</strong> {user.full_name}
            </p>
            <p>
              <strong>Email Verified:</strong> {user.email_verified ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Active:</strong> {user.is_active ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
