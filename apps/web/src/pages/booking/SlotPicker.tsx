import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { usePublicProvider } from '../../hooks/useProvider'
import { usePublicSlots } from '../../hooks/useAvailability'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Card, CardHeader } from '../../components/ui/Card'
import { Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { cn, formatCurrency, formatTime } from '../../lib/utils'
import { useBookingDraftStore } from '../../store/bookingDraft'

const clientSchema = z.object({
  clientName: z.string().min(2, 'Your name is required'),
  clientEmail: z.string().email('Enter a valid email'),
  clientPhone: z.string().min(5, 'Enter a valid phone number'),
  notes: z.string().max(500).optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function SlotPicker() {
  const { slug, serviceId } = useParams<{ slug: string; serviceId: string }>()
  const navigate = useNavigate()
  const setDraft = useBookingDraftStore((s) => s.setDraft)

  const { data, isLoading } = usePublicProvider(slug)
  const [date, setDate] = useState(todayIso())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const service = useMemo(() => data?.services.find((s) => s.id === serviceId), [data, serviceId])

  const { data: slots, isLoading: slotsLoading } = usePublicSlots(slug, serviceId, date)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientSchema) })

  const onSubmit = handleSubmit((values) => {
    if (!slug || !serviceId || !selectedSlot) return
    setDraft({
      slug,
      serviceId,
      scheduledStart: selectedSlot,
      clientName: values.clientName,
      clientEmail: values.clientEmail,
      clientPhone: values.clientPhone,
      notes: values.notes ?? '',
    })
    navigate(`/book/${slug}/${serviceId}/pay`)
  })

  if (isLoading) return <FullPageSpinner />

  if (!service) {
    return (
      <EmptyState
        icon={<Calendar className="size-6" />}
        title="Service not found"
        description="This service may have been removed."
      />
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/book/${slug}`)}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="size-4" /> Back to {data?.provider.businessName}
      </button>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink-900 dark:text-ink-50">{service.name}</h1>
            <p className="mt-1 flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {service.durationMinutes} min
              </span>
              <span>{formatCurrency(service.price)}</span>
            </p>
          </div>
          <p className="text-right text-xs text-ink-400">
            {service.depositPercentage}% deposit
            <br />
            <span className="font-semibold text-ink-700 dark:text-ink-200">
              {formatCurrency((service.price * service.depositPercentage) / 100)}
            </span>
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Pick a date & time" />
        <Input
          type="date"
          label="Date"
          min={todayIso()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setSelectedSlot(null)
          }}
        />

        <div className="mt-4">
          {slotsLoading ? (
            <div className="flex justify-center py-8">
              <Clock className="size-5 animate-pulse text-ink-300" />
            </div>
          ) : !slots?.length ? (
            <p className="py-6 text-center text-sm text-ink-500 dark:text-ink-400">
              No open slots on this date. Try another day.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot.start)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    selectedSlot === slot.start
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-ink-200 text-ink-700 hover:border-brand-400 dark:border-ink-700 dark:text-ink-200',
                  )}
                >
                  {formatTime(slot.start)}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {selectedSlot && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader title="Your details" description="We'll send your confirmation here." />
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                label="Full name"
                required
                error={errors.clientName?.message}
                {...register('clientName')}
              />
              <Input
                label="Email"
                type="email"
                required
                error={errors.clientEmail?.message}
                {...register('clientEmail')}
              />
              <Input
                label="Phone"
                type="tel"
                required
                error={errors.clientPhone?.message}
                {...register('clientPhone')}
              />
              <Textarea label="Notes (optional)" rows={3} {...register('notes')} />
              <Button type="submit" className="w-full">
                Continue to payment
              </Button>
            </form>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
