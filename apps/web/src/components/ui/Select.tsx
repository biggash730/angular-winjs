import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, required, id, children, ...props }, ref) => {
    const selectId = id ?? props.name
    return (
      <label className="block" htmlFor={selectId}>
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
            {label}
            {required && <span className="text-accent-600"> *</span>}
          </span>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-10 w-full appearance-none rounded-xl border border-ink-200 bg-white px-3 pr-9 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        </div>
        {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
      </label>
    )
  },
)
Select.displayName = 'Select'
