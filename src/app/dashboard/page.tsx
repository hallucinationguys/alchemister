import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to your Dashboard</CardTitle>
          <CardDescription>You have successfully logged in.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
