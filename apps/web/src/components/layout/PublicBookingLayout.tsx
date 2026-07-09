import { Link, Outlet } from 'react-router-dom'
import { Calendar, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export function PublicBookingLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-ink-50/60 dark:bg-ink-950">
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-50">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <Calendar className="size-3.5" />
            </span>
            BookMe
          </Link>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
