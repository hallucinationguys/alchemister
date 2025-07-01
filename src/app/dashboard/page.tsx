import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to your Dashboard</CardTitle>
          <CardDescription>You have successfully logged in.</CardDescription>
        </CardHeader>
        <div className="p-6">
          <Link href="/settings/profile" passHref>
            <Button className="w-full">Go to Settings</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
