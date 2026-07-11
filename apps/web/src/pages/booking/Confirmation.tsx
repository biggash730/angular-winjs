import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Clock, Hourglass, Mail, XCircle } from 'lucide-react'
import { usePublicBooking } from '../../hooks/useBookings'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { BOOKING_STATUS_TONE } from '../../lib/constants'

const STATUS_COPY: Record<string, { title: string; description: string; icon: typeof CheckCircle2 }> = {
  PendingPayment: {
    title: 'Waiting for payment',
    description: "We're confirming your deposit — this usually takes a few seconds.",
    icon: Hourglass,
  },
  Confirmed: {
    title: "You're booked!",
    description: 'Your appointment is confirmed. We look forward to seeing you.',
    icon: CheckCircle2,
  },
  Completed: {
    title: 'Appointment completed',
    description: 'Thanks for booking with us.',
    icon: CheckCircle2,
  },
  Cancelled: {
    title: 'Booking cancelled',
    description: 'This booking was cancelled. Your deposit has been refunded.',
    icon: XCircle,
  },
  NoShow: {
    title: 'Marked as no-show',
    description: 'This appointment was marked as a no-show.',
    icon: XCircle,
  },
}

export default function Confirmation() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { data: booking, isLoading } = usePublicBooking(bookingId)

  if (isLoading) return <FullPageSpinner />

  if (!booking) {
    return (
      <EmptyState
        icon={<Calendar className="size-6" />}
        title="Booking not found"
        description="We couldn't find this booking. Check the link and try again."
      />
    )
  }

  const copy = STATUS_COPY[booking.status] ?? STATUS_COPY.Confirmed
  const Icon = copy.icon

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon className="size-7" />
        </div>
        <h1 className="text-xl font-semibold text-ink-900 dark:text-ink-50">{copy.title}</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{copy.description}</p>
        <div className="mt-4 flex justify-center">
          <Badge tone={BOOKING_STATUS_TONE[booking.status]}>{booking.status}</Badge>
        </div>
      </Card>

      <Card>
        <dl className="divide-y divide-ink-100 text-sm dark:divide-ink-800">
          <div className="flex items-center justify-between py-3">
            <dt className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
              <Calendar className="size-4" /> Date & time
            </dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">
              {formatDateTime(booking.scheduledStart)}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
              <Clock className="size-4" /> Service
            </dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">
              {booking.serviceName ?? 'Service'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
              <Mail className="size-4" /> Contact
            </dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{booking.clientEmail}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink-500 dark:text-ink-400">Deposit paid</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">
              {formatCurrency(booking.depositAmount)} {booking.depositPaid ? '✓' : ''}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink-500 dark:text-ink-400">Booking reference</dt>
            <dd className="font-mono text-xs text-ink-500 dark:text-ink-400">{booking.id}</dd>
          </div>
        </dl>
      </Card>
    </motion.div>
  )
}
