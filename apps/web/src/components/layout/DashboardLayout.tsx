import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  Calendar,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Scissors,
  Settings,
  Sun,
  Wallet as WalletIcon,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../hooks/useTheme'
import { useMyProvider } from '../../hooks/useProvider'
import { useLogout } from '../../hooks/useAuthActions'
import { useAuthStore } from '../../store/auth'
import { initials } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/services', label: 'Services', icon: Scissors },
  { to: '/dashboard/availability', label: 'Availability', icon: Clock },
  { to: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
  { to: '/dashboard/wallet', label: 'Wallet', icon: WalletIcon },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { data: provider } = useMyProvider()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5 font-semibold text-ink-900 dark:text-ink-50">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
          <Calendar className="size-4" />
        </span>
        BookMe
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mx-3 mb-4 mt-2 flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
          {initials(provider?.businessName ?? user?.email ?? 'B')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
            {provider?.businessName ?? 'Your business'}
          </p>
          <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          aria-label="Log out"
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-50/50 dark:bg-ink-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900 lg:block">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-ink-900">
            {SidebarContent}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-100 bg-white/80 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80 sm:px-6">
          <button
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="hidden text-sm text-ink-500 dark:text-ink-400 lg:block">
            {provider?.isActive === false && (
              <span className="text-amber-600 dark:text-amber-400">
                Your booking page is currently inactive.
              </span>
            )}
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
