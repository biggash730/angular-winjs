import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CreditCard, Image, Palette, Save } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useMyProvider, useUpdateProvider } from '../../hooks/useProvider'
import { useMySubscription, useSubscriptionCheckout } from '../../hooks/useSubscription'
import { PROVIDER_CATEGORIES, TIMEZONES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import type { PaymentGateway, SubscriptionStatus } from '../../api/types'

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
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes only'),
  bio: z.string().max(280).optional(),
  brandColor: z.string().optional(),
  logoUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  coverImageUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

const SUBSCRIPTION_TONE: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  Trialing: 'warning',
  Active: 'success',
  PastDue: 'danger',
  Canceled: 'neutral',
}

export default function Settings() {
  const { data: provider, isLoading } = useMyProvider()
  const updateProvider = useUpdateProvider()
  const { data: subscription, isLoading: subLoading } = useMySubscription()
  const checkout = useSubscriptionCheckout()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: 'UTC', category: 'Barber' },
  })

  useEffect(() => {
    if (provider) {
      reset({
        businessName: provider.businessName,
        category: provider.category,
        slug: provider.slug,
        bio: provider.bio ?? '',
        brandColor: provider.brandColor ?? '#7c5cfc',
        logoUrl: provider.logoUrl ?? '',
        coverImageUrl: provider.coverImageUrl ?? '',
        phone: provider.phone ?? '',
        address: provider.address ?? '',
        timezone: provider.timezone || 'UTC',
      })
    }
  }, [provider, reset])

  const onSubmit = handleSubmit(async (values) => {
    await updateProvider.mutateAsync(values)
  })

  async function handleSubscribe(gateway: PaymentGateway) {
    const result = await checkout.mutateAsync({ gateway })
    if (result.url) {
      window.location.href = result.url
    } else if (result.accessCode) {
      window.location.href = `https://checkout.paystack.com/${result.accessCode}`
    }
  }

  const brandColor = watch('brandColor')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Settings</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Manage your profile, branding and subscription.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Subscription"
          description="A $5/month subscription keeps your booking page live."
          action={
            !subLoading &&
            subscription && (
              <Badge tone={SUBSCRIPTION_TONE[subscription.status]}>{subscription.status}</Badge>
            )
          }
        />
        {subLoading ? (
          <p className="text-sm text-ink-400">Loading subscription…</p>
        ) : (
          <div className="space-y-4">
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Current period ends {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {(!subscription || subscription.status !== 'Active') && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => handleSubscribe('Stripe')}
                  isLoading={checkout.isPending}
                  leftIcon={<CreditCard className="size-4" />}
                >
                  Subscribe with Stripe
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSubscribe('Paystack')}
                  isLoading={checkout.isPending}
                  leftIcon={<CreditCard className="size-4" />}
                >
                  Subscribe with Paystack
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Profile & branding" description="This appears on your public booking page." />
        {isLoading ? (
          <p className="text-sm text-ink-400">Loading profile…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Business name"
                required
                error={errors.businessName?.message}
                {...register('businessName')}
              />
              <Select label="Category" required error={errors.category?.message} {...register('category')}>
                {PROVIDER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Booking page slug"
              hint="bookme.app/book/your-slug"
              required
              error={errors.slug?.message}
              {...register('slug')}
            />
            <Textarea label="Bio" rows={3} error={errors.bio?.message} {...register('bio')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Logo URL"
                leftIcon={<Image className="size-4" />}
                error={errors.logoUrl?.message}
                {...register('logoUrl')}
              />
              <Input
                label="Cover image URL"
                leftIcon={<Image className="size-4" />}
                error={errors.coverImageUrl?.message}
                {...register('coverImageUrl')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  label="Brand color"
                  type="color"
                  className="h-10 w-full cursor-pointer p-1"
                  leftIcon={<Palette className="size-4" />}
                  {...register('brandColor')}
                />
                {brandColor && (
                  <div
                    className="mt-2 h-8 w-full rounded-lg"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </div>
              <Input label="Phone" {...register('phone')} />
            </div>
            <Input label="Address" {...register('address')} />
            <Select label="Timezone" required {...register('timezone')}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
            <div className="flex justify-end">
              <Button type="submit" isLoading={updateProvider.isPending} leftIcon={<Save className="size-4" />}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
