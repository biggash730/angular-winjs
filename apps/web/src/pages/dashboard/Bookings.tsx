import { useState } from 'react'
import { Calendar, Check, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Table, Tbody, Td, Th, Thead, Tr } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useBookings, useCancelBooking, useCompleteBooking, useConfirmBooking } from '../../hooks/useBookings'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { BOOKING_STATUS_TONE } from '../../lib/constants'
import type { BookingStatus } from '../../api/types'

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PendingPayment', label: 'Pending payment' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'NoShow', label: 'No-show' },
]

const PAGE_SIZE = 10

export default function Bookings() {
  const [status, setStatus] = useState<BookingStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useBookings({
    status: status || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const confirmBooking = useConfirmBooking()
  const cancelBooking = useCancelBooking()
  const completeBooking = useCompleteBooking()

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Bookings</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Manage upcoming and past appointments.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BookingStatus | '')
              setPage(1)
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(1)
            }}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="All bookings"
          description={data ? `${data.total} total` : undefined}
        />
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={<Calendar className="size-6" />}
            title="No bookings found"
            description="Try adjusting your filters, or share your booking page to get your first booking."
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Date & time</Th>
                  <Th>Client</Th>
                  <Th>Service</Th>
                  <Th>Status</Th>
                  <Th>Deposit</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.items.map((booking) => (
                  <Tr key={booking.id}>
                    <Td>{formatDateTime(booking.scheduledStart)}</Td>
                    <Td>
                      <p className="font-medium text-ink-900 dark:text-ink-50">{booking.clientName}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{booking.clientEmail}</p>
                    </Td>
                    <Td>{booking.serviceName ?? '—'}</Td>
                    <Td>
                      <Badge tone={BOOKING_STATUS_TONE[booking.status]}>{booking.status}</Badge>
                    </Td>
                    <Td>
                      {formatCurrency(booking.depositAmount)}
                      {booking.depositPaid && (
                        <span className="ml-1 text-xs text-emerald-600">paid</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {booking.status === 'PendingPayment' || booking.status === 'Confirmed' ? (
                          <>
                            {booking.status === 'PendingPayment' && (
                              <Button
                                size="sm"
                                variant="outline"
                                isLoading={confirmBooking.isPending}
                                onClick={() => confirmBooking.mutate(booking.id)}
                                leftIcon={<Check className="size-3.5" />}
                              >
                                Confirm
                              </Button>
                            )}
                            {booking.status === 'Confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                isLoading={completeBooking.isPending}
                                onClick={() => completeBooking.mutate(booking.id)}
                                leftIcon={<Check className="size-3.5" />}
                              >
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              isLoading={cancelBooking.isPending}
                              onClick={() => cancelBooking.mutate(booking.id)}
                              leftIcon={<XCircle className="size-3.5" />}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-ink-400">No actions</span>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-ink-400">
                Page {data.page} of {totalPages} {isFetching && '· refreshing…'}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="size-4" />}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="size-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
