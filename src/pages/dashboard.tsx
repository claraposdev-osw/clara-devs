import { useState } from 'react'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { DesktopIcon } from '@/components/desktop/desktop-icon'
import { MobileFolder } from '@/components/desktop/mobile-folder'
import { Window } from '@/components/desktop/window'
import { DashboardApp } from '@/components/desktop/apps/dashboard-app'

type AppId = 'dashboard' | null

const APPS = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: 'bg-blue-600',
    content: <DashboardApp />,
    windowTitle: 'Dashboard',
  },
]

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const [openApp, setOpenApp] = useState<AppId>(null)

  const activeApp = APPS.find((a) => a.id === openApp)

  return (
    <>
      {/* Animated background — same orbs as login */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg__orb login-bg__orb--1" />
        <div className="login-bg__orb login-bg__orb--2" />
        <div className="login-bg__orb login-bg__orb--3" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">CD</span>
            </div>
            <span className="text-sm font-medium text-white">Clara Devs</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 hidden sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </header>

        {/* Desktop — PC */}
        <main className="hidden md:flex flex-1 flex-wrap content-start gap-6 p-8">
          {APPS.map((app) => (
            <DesktopIcon
              key={app.id}
              icon={app.icon}
              label={app.label}
              color={app.color}
              onClick={() => setOpenApp(app.id)}
            />
          ))}
        </main>

        {/* Mobile — iOS style */}
        <main className="md:hidden flex-1 flex flex-wrap content-start gap-6 p-6">
          {APPS.map((app) => (
            <MobileFolder
              key={app.id}
              icon={app.icon}
              label={app.label}
              color={app.color}
              onClick={() => setOpenApp(app.id)}
            />
          ))}
        </main>

        {/* Dock (PC only) */}
        <div className="hidden md:flex justify-center pb-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
            {APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => setOpenApp(app.id)}
                title={app.label}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-125 hover:-translate-y-1 duration-150"
              >
                <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center shadow-md`}>
                  <app.icon className="w-5 h-5 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Window overlay */}
      {activeApp && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setOpenApp(null)}
          />
          <Window
            title={activeApp.windowTitle}
            onClose={() => setOpenApp(null)}
            initialWidth={480}
            initialHeight={300}
          >
            {activeApp.content}
          </Window>
        </>
      )}
    </>
  )
}
