import { type ReactNode } from 'react'
import Link from 'next/link'
import { MountainIcon } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <div className="flex flex-col h-full p-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <MountainIcon className="h-6 w-6" />
            <span>Trading Alchemister</span>
          </Link>
          <div className="mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;The platform that turns market data into gold. Your AI-powered trading
                partner is here to guide you to success.&rdquo;
              </p>
              <footer className="text-sm">The Alchemister Team</footer>
            </blockquote>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">{children}</div>
    </div>
  )
}
