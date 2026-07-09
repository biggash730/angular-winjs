import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, MapPin, Phone, Scissors } from 'lucide-react'
import { usePublicProvider } from '../../hooks/useProvider'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { categoryLabel, DAYS_OF_WEEK } from '../../lib/constants'
import { formatCurrency, initials } from '../../lib/utils'
import { ApiError } from '../../api/client'

export default function ProviderStorefront() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = usePublicProvider(slug)

  if (isLoading) return <FullPageSpinner />

  if (error || !data) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <EmptyState
        icon={<Scissors className="size-6" />}
        title={notFound ? 'Booking page not found' : 'Something went wrong'}
        description={
          notFound
            ? "This booking page doesn't exist or is no longer available."
            : 'Please try again in a moment.'
        }
      />
    )
  }

  const { provider, services, workingHours } = data
  const brandColor = provider.brandColor || '#7c5cfc'

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="relative h-40 rounded-xl2 sm:h-52"
          style={{
            background: provider.coverImageUrl
              ? `url(${provider.coverImageUrl}) center/cover`
              : `linear-gradient(135deg, ${brandColor}, #1e1d2e)`,
          }}
        >
          <div className="absolute -bottom-8 left-6 flex size-16 items-center justify-center rounded-2xl border-4 border-white bg-white text-lg font-bold shadow-soft dark:border-ink-950 dark:bg-ink-900">
            {provider.logoUrl ? (
              <img src={provider.logoUrl} alt={provider.businessName} className="size-full rounded-xl object-cover" />
            ) : (
              <span style={{ color: brandColor }}>{initials(provider.businessName)}</span>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-start justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">{provider.businessName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="brand">{categoryLabel(provider.category)}</Badge>
              {!provider.isActive && <Badge tone="danger">Temporarily unavailable</Badge>}
            </div>
          </div>
        </div>

        {provider.bio && (
          <p className="mt-4 px-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{provider.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 px-1 text-sm text-ink-500 dark:text-ink-400">
          {provider.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {provider.address}
            </span>
          )}
          {provider.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-4" /> {provider.phone}
            </span>
          )}
        </div>
      </motion.div>

      {!provider.isActive ? (
        <EmptyState
          icon={<Clock className="size-6" />}
          title="Booking temporarily unavailable"
          description="This provider's page isn't accepting new bookings right now. Please check back later."
        />
      ) : (
        <>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-ink-50">Services</h2>
            {!services.length ? (
              <EmptyState icon={<Scissors className="size-6" />} title="No services listed yet" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {services
                  .filter((s) => s.isActive)
                  .map((service, i) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <Card className="flex h-full flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-ink-900 dark:text-ink-50">{service.name}</h3>
                          {service.description && (
                            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{service.description}</p>
                          )}
                          <div className="mt-3 flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" /> {service.durationMinutes} min
                            </span>
                            <span className="font-semibold text-ink-900 dark:text-ink-50">
                              {formatCurrency(service.price)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-ink-400">
                            {service.depositPercentage}% deposit to book
                          </p>
                        </div>
                        <Button
                          className="mt-4 w-full"
                          onClick={() => navigate(`/book/${slug}/${service.id}`)}
                        >
                          Book
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>

          {workingHours.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-ink-50">Working hours</h2>
              <Card>
                <ul className="divide-y divide-ink-100 text-sm dark:divide-ink-800">
                  {DAYS_OF_WEEK.map((day) => {
                    const wh = workingHours.find((h) => h.dayOfWeek === day.value)
                    return (
                      <li key={day.value} className="flex items-center justify-between py-2">
                        <span className="text-ink-600 dark:text-ink-300">{day.label}</span>
                        <span className="text-ink-500 dark:text-ink-400">
                          {!wh || wh.isClosed ? 'Closed' : `${wh.startTime} – ${wh.endTime}`}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
