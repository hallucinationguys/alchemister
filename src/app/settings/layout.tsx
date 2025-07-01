import { SettingsSidebarNav } from './SettingsSidebarNav'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-10 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <div className="flex flex-col w-full space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="w-1/5">
          <SettingsSidebarNav />
        </aside>
        <div className="flex-1 w-full">{children}</div>
      </div>
    </div>
  )
}
