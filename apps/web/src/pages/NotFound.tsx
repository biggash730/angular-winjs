import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
        <Compass className="size-7" />
      </span>
      <h1 className="text-3xl font-bold text-ink-900 dark:text-ink-50">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </div>
  )
}
