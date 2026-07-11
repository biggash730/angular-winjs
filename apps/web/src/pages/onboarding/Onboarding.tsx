import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, LinkIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useMyProvider, useUpdateProvider } from '../../hooks/useProvider'
import { PROVIDER_CATEGORIES, TIMEZONES } from '../../lib/constants'
import { slugify } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'
import { FullPageSpinner } from '../../components/ui/Spinner'

const schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  category: z.enum([
    'Barber',
    'Hairdresser',
    'MakeupArtist',
    'Clinic',
    'Photographer',
    'CarRental',
    'Other',
  ]),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes only'),
  bio: z.string().max(280, 'Keep your bio under 280 characters').optional(),
  phone: z.string().optional(),
  timezone: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export default function Onboarding() {
  const { data: provider, isLoading } = useMyProvider()
  const updateProvider = useUpdateProvider()
  const setOnboarded = useAuthStore((s) => s.setOnboarded)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: '',
      category: 'Barber',
      slug: '',
      bio: '',
      phone: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    },
  })

  useEffect(() => {
    if (provider) {
      reset({
        businessName: provider.businessName,
        category: provider.category,
        slug: provider.slug,
        bio: provider.bio ?? '',
        phone: provider.phone ?? '',
        timezone: provider.timezone || 'UTC',
      })
    }
  }, [provider, reset])

  const businessName = watch('businessName')

  const onSubmit = handleSubmit(async (values) => {
    await updateProvider.mutateAsync(values)
    setOnboarded(true)
    navigate('/dashboard', { replace: true })
  })

  if (isLoading) return <FullPageSpinner />

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-16 dark:bg-ink-950">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <Calendar className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">
            Set up your booking page
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            A couple of quick details before clients can start booking you.
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Business name"
              required
              error={errors.businessName?.message}
              {...register('businessName')}
              onChange={(e) => {
                register('businessName').onChange(e)
                if (!provider?.slug) setValue('slug', slugify(e.target.value))
              }}
            />
            <Select label="Category" required error={errors.category?.message} {...register('category')}>
              {PROVIDER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Input
              label="Public page URL"
              required
              leftIcon={<LinkIcon className="size-4" />}
              error={errors.slug?.message}
              hint={`bookme.app/book/${watch('slug') || slugify(businessName || 'your-business')}`}
              {...register('slug')}
            />
            <Textarea
              label="Short bio"
              rows={3}
              placeholder="Tell clients what makes your business great"
              error={errors.bio?.message}
              {...register('bio')}
            />
            <Input label="Phone" placeholder="+1 555 000 0000" {...register('phone')} />
            <Select label="Timezone" required {...register('timezone')}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              className="w-full"
              isLoading={updateProvider.isPending}
              rightIcon={<ArrowRight className="size-4" />}
            >
              Go to dashboard
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
