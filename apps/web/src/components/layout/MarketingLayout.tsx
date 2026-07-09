import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Calendar, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/Button'

export function MarketingLayout() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/80 backdrop-blur-md dark:border-ink-800/80 dark:bg-ink-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-ink-900 dark:text-ink-50">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <Calendar className="size-4" />
            </span>
            BookMe
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink-600 dark:text-ink-300 md:flex">
            <a href="/#features" className="hover:text-brand-600 dark:hover:text-brand-400">
              Features
            </a>
            <a href="/#pricing" className="hover:text-brand-600 dark:hover:text-brand-400">
              Pricing
            </a>
            <a href="/#categories" className="hover:text-brand-600 dark:hover:text-brand-400">
              Who it's for
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {accessToken ? (
              <Button size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-ink-100 py-10 dark:border-ink-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-ink-500 sm:flex-row sm:px-6 dark:text-ink-400">
          <p>&copy; {new Date().getFullYear()} BookMe. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/#pricing" className="hover:text-brand-600 dark:hover:text-brand-400">
              Pricing
            </a>
            <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400">
              Provider login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
