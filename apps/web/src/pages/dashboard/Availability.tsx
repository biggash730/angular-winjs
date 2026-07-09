import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CalendarOff, Plus, Save, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import {
  useCreateTimeOff,
  useDeleteTimeOff,
  useTimeOffList,
  useUpdateWorkingHours,
  useWorkingHours,
} from '../../hooks/useAvailability'
import { DAYS_OF_WEEK } from '../../lib/constants'
import type { DayOfWeek, WorkingHours } from '../../api/types'
import { formatDateTime } from '../../lib/utils'

type DayRow = Pick<WorkingHours, 'dayOfWeek' | 'startTime' | 'endTime' | 'isClosed'>

function buildDefaultRows(existing: WorkingHours[] | undefined): DayRow[] {
  return DAYS_OF_WEEK.map((day) => {
    const match = existing?.find((h) => h.dayOfWeek === day.value)
    return (
      match ?? {
        dayOfWeek: day.value as DayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isClosed: day.value === 0 || day.value === 6,
      }
    )
  })
}

const timeOffSchema = z
  .object({
    startAt: z.string().min(1, 'Start is required'),
    endAt: z.string().min(1, 'End is required'),
    reason: z.string().max(200).optional(),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: 'End must be after start',
    path: ['endAt'],
  })

type TimeOffValues = z.infer<typeof timeOffSchema>

export default function Availability() {
  const { data: hours, isLoading: hoursLoading } = useWorkingHours()
  const updateHours = useUpdateWorkingHours()
  const { data: timeOff, isLoading: timeOffLoading } = useTimeOffList()
  const createTimeOff = useCreateTimeOff()
  const deleteTimeOff = useDeleteTimeOff()

  const [rows, setRows] = useState<DayRow[]>(buildDefaultRows(undefined))
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false)

  useEffect(() => {
    setRows(buildDefaultRows(hours))
  }, [hours])

  function updateRow(index: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  async function saveHours() {
    await updateHours.mutateAsync(rows)
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimeOffValues>({ resolver: zodResolver(timeOffSchema) })

  const onCreateTimeOff = handleSubmit(async (values) => {
    await createTimeOff.mutateAsync({
      startAt: new Date(values.startAt).toISOString(),
      endAt: new Date(values.endAt).toISOString(),
      reason: values.reason,
    })
    reset()
    setTimeOffModalOpen(false)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Availability</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Set your weekly working hours and block out time off.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Weekly working hours"
          description="Clients can only book slots inside these windows."
          action={
            <Button size="sm" onClick={saveHours} isLoading={updateHours.isPending} leftIcon={<Save className="size-4" />}>
              Save hours
            </Button>
          }
        />
        {hoursLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => {
              const day = DAYS_OF_WEEK.find((d) => d.value === row.dayOfWeek)!
              return (
                <div
                  key={row.dayOfWeek}
                  className="flex flex-col gap-3 rounded-xl border border-ink-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-ink-800"
                >
                  <label className="flex w-32 items-center gap-2 text-sm font-medium text-ink-800 dark:text-ink-100">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                      checked={!row.isClosed}
                      onChange={(e) => updateRow(index, { isClosed: !e.target.checked })}
                    />
                    {day.label}
                  </label>
                  {row.isClosed ? (
                    <span className="text-sm text-ink-400">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(e) => updateRow(index, { startTime: e.target.value })}
                        className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-sm dark:border-ink-700 dark:bg-ink-900"
                      />
                      <span className="text-ink-400">to</span>
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => updateRow(index, { endTime: e.target.value })}
                        className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-sm dark:border-ink-700 dark:bg-ink-900"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Time off"
          description="Block specific dates or ranges — no bookings will be allowed then."
          action={
            <Button size="sm" onClick={() => setTimeOffModalOpen(true)} leftIcon={<Plus className="size-4" />}>
              Add time off
            </Button>
          }
        />
        {timeOffLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !timeOff?.length ? (
          <EmptyState
            icon={<CalendarOff className="size-6" />}
            title="No time off scheduled"
            description="Add a date range to block bookings, e.g. for a holiday."
          />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {timeOff.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-50">
                    {formatDateTime(item.startAt)} — {formatDateTime(item.endAt)}
                  </p>
                  {item.reason && (
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{item.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteTimeOff.mutate(item.id)}
                  className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800"
                  aria-label="Remove time off"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={timeOffModalOpen} onClose={() => setTimeOffModalOpen(false)} title="Add time off">
        <form onSubmit={onCreateTimeOff} className="space-y-4">
          <Input
            label="Start"
            type="datetime-local"
            required
            error={errors.startAt?.message}
            {...register('startAt')}
          />
          <Input
            label="End"
            type="datetime-local"
            required
            error={errors.endAt?.message}
            {...register('endAt')}
          />
          <Textarea label="Reason (optional)" rows={2} {...register('reason')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setTimeOffModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTimeOff.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
