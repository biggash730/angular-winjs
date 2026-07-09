import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  required?: boolean
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, required, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <label className="block" htmlFor={inputId}>
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
            {label}
            {required && <span className="text-accent-600"> *</span>}
          </span>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50',
              leftIcon && 'pl-9',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
              className,
            )}
            {...props}
          />
        </div>
        {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        {!error && hint && (
          <span className="mt-1 block text-xs text-ink-400">{hint}</span>
        )}
      </label>
    )
  },
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const areaId = id ?? props.name
    return (
      <label className="block" htmlFor={areaId}>
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
            {label}
            {required && <span className="text-accent-600"> *</span>}
          </span>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            'w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        {!error && hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      </label>
    )
  },
)
Textarea.displayName = 'Textarea'
