import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-ink-200 px-6 py-14 text-center dark:border-ink-700">
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
