'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-provider'

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
  },
  {
    title: 'Model Providers',
    href: '/settings/model-providers',
  },
]

export function SettingsSidebarNav() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
      {sidebarNavItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start'
          )}
        >
          {item.title}
        </Link>
      ))}
      <Button variant="ghost" onClick={logout} className="justify-start hover:underline">
        Log out
      </Button>
    </nav>
  )
}
