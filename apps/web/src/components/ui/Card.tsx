import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
}

export function Card({ className, padded = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-ink-100 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
