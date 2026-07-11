import { Link } from 'react-router-dom'
import { Calendar, Clock, TrendingUp, Wallet as WalletIcon } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table, Tbody, Td, Th, Thead, Tr } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { Button } from '../../components/ui/Button'
import { useBookings } from '../../hooks/useBookings'
import { useWallet } from '../../hooks/useWallet'
import { useMyProvider } from '../../hooks/useProvider'
import { formatCurrency, formatTime } from '../../lib/utils'
import { BOOKING_STATUS_TONE } from '../../lib/constants'

function startOfTodayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function endOfTodayIso() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export default function Overview() {
  const { data: provider } = useMyProvider()
  const { data: wallet, isLoading: walletLoading } = useWallet()
  const { data: bookings, isLoading: bookingsLoading } = useBookings({
    from: startOfTodayIso(),
    to: endOfTodayIso(),
    pageSize: 10,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">
          Welcome back{provider?.businessName ? `, ${provider.businessName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Here's what's happening with your booking page today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's bookings"
          value={bookingsLoading ? '—' : bookings?.total ?? 0}
          icon={<Calendar className="size-5" />}
          tone="brand"
        />
        <StatCard
          label="Available balance"
          value={walletLoading ? '—' : formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency)}
          icon={<WalletIcon className="size-5" />}
          tone="accent"
        />
        <StatCard
          label="Pending balance"
          value={walletLoading ? '—' : formatCurrency(wallet?.pendingBalance ?? 0, wallet?.currency)}
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="Booking page"
          value={provider?.isActive ? 'Live' : 'Inactive'}
          icon={<TrendingUp className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader
          title="Today's schedule"
          description="Bookings scheduled for today across all services."
          action={
            <Link to="/dashboard/bookings">
              <Button variant="outline" size="sm">
                View all bookings
              </Button>
            </Link>
          }
        />
        {bookingsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !bookings?.items.length ? (
          <EmptyState
            icon={<Calendar className="size-6" />}
            title="No bookings today"
            description="New bookings from your public page will show up here."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Time</Th>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th>Deposit</Th>
              </Tr>
            </Thead>
            <Tbody>
              {bookings.items.map((booking) => (
                <Tr key={booking.id}>
                  <Td>{formatTime(booking.scheduledStart)}</Td>
                  <Td className="font-medium text-ink-900 dark:text-ink-50">{booking.clientName}</Td>
                  <Td>{booking.serviceName ?? '—'}</Td>
                  <Td>
                    <Badge tone={BOOKING_STATUS_TONE[booking.status]}>{booking.status}</Badge>
                  </Td>
                  <Td>{formatCurrency(booking.depositAmount)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {provider?.slug && (
        <Card className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-ink-900 dark:text-ink-50">Your public booking page</p>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Share this link with clients so they can book directly.
            </p>
          </div>
          <a
            href={`/book/${provider.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-ink-100 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-brand-300 dark:hover:bg-ink-700"
          >
            /book/{provider.slug}
          </a>
        </Card>
      )}
    </div>
  )
}
