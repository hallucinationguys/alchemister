'use client'

import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppearancePage() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">Customize the appearance of the app.</p>
      </div>
      <div className="space-y-6">
        <div>
          <h4 className="font-medium">Color mode</h4>
          {!mounted ? (
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="flex flex-col items-center">
                <Button
                  variant="outline"
                  onClick={() => setTheme('light')}
                  className={`h-24 w-full p-2 justify-start items-start rounded-md ${theme === 'light' ? 'border-2 border-primary' : ''}`}
                >
                  <div className="w-full h-full bg-white rounded-sm" />
                </Button>
                <p className="text-sm font-medium mt-2">Light</p>
              </div>

              <div className="flex flex-col items-center">
                <Button
                  variant="outline"
                  onClick={() => setTheme('dark')}
                  className={`h-24 w-full p-2 justify-start items-start rounded-md ${theme === 'dark' ? 'border-2 border-primary' : ''}`}
                >
                  <div className="w-full h-full bg-black rounded-sm" />
                </Button>
                <p className="text-sm font-medium mt-2">Dark</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
