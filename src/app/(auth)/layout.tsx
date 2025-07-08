import AuthLayout from '@/features/auth/components/AuthLayout'

interface AuthRouteLayoutProps {
  children: React.ReactNode
}

export default function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  return <AuthLayout>{children}</AuthLayout>
}
