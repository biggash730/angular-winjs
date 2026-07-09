import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-ink-100 dark:border-ink-800">
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:bg-ink-800/60 dark:text-ink-400">
      {children}
    </thead>
  )
}

export function Tbody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-ink-100 dark:divide-ink-800">{children}</tbody>
  )
}

export function Tr({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors hover:bg-ink-50/70 dark:hover:bg-ink-800/40', className)}
      {...props}
    >
      {children}
    </tr>
  )
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('px-4 py-3 font-medium', className)} {...props}>
      {children}
    </th>
  )
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-ink-700 dark:text-ink-200', className)} {...props}>
      {children}
    </td>
  )
}
