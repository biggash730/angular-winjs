import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  trend?: { value: string; positive?: boolean }
  tone?: 'brand' | 'accent' | 'neutral'
}

const toneClasses = {
  brand: 'bg-brand-gradient text-white',
  accent: 'bg-gradient-to-br from-accent-500 to-accent-600 text-white',
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
}

export function StatCard({ label, value, icon, trend, tone = 'neutral' }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-ink-50">{value}</p>
        {trend && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              trend.positive ? 'text-emerald-600' : 'text-ink-400',
            )}
          >
            {trend.value}
          </p>
        )}
      </div>
      {icon && (
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', toneClasses[tone])}>
          {icon}
        </div>
      )}
    </Card>
  )
}
