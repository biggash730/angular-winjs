import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowLeft, CreditCard, Landmark, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useBookingDraftStore } from '../../store/bookingDraft'
import { useCreatePublicBooking } from '../../hooks/useBookings'
import { usePublicProvider } from '../../hooks/useProvider'
import { formatCurrency } from '../../lib/utils'
import { StripeCheckoutForm } from '../../components/payment/StripeCheckoutForm'
import { PaystackCheckoutButton } from '../../components/payment/PaystackCheckoutButton'
import type { PaymentGateway, PaymentInitPayload } from '../../api/types'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default function PaymentStep() {
  const { slug, serviceId } = useParams<{ slug: string; serviceId: string }>()
  const navigate = useNavigate()
  const draft = useBookingDraftStore()
  const clearDraft = useBookingDraftStore((s) => s.clearDraft)

  const { data } = usePublicProvider(slug)
  const service = useMemo(() => data?.services.find((s) => s.id === serviceId), [data, serviceId])

  const createBooking = useCreatePublicBooking()
  const [payment, setPayment] = useState<PaymentInitPayload | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (!draft.slug || !draft.serviceId || !draft.scheduledStart || draft.slug !== slug || draft.serviceId !== serviceId) {
      navigate(`/book/${slug}/${serviceId}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function selectGateway(gateway: PaymentGateway) {
    const response = await createBooking.mutateAsync({
      slug: draft.slug as string,
      serviceId: draft.serviceId as string,
      scheduledStart: draft.scheduledStart as string,
      clientName: draft.clientName,
      clientEmail: draft.clientEmail,
      clientPhone: draft.clientPhone,
      notes: draft.notes || undefined,
      gateway,
    })
    setPayment(response.payment)
    setBookingId(response.booking.id)
  }

  function handlePaid() {
    clearDraft()
    if (bookingId) {
      navigate(`/book/${slug}/confirmation/${bookingId}`, { replace: true })
    }
  }

  const depositAmount = service ? (service.price * service.depositPercentage) / 100 : payment?.amount ?? 0

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/book/${slug}/${serviceId}`)}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <Card>
        <CardHeader title="Confirm & pay deposit" description="Your appointment is held once the deposit is paid." />
        <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 dark:bg-ink-800/50">
          <div>
            <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{service?.name ?? 'Service'}</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {draft.scheduledStart && new Date(draft.scheduledStart).toLocaleString()}
            </p>
          </div>
          <p className="text-lg font-semibold text-brand-600 dark:text-brand-400">
            {formatCurrency(depositAmount)}
          </p>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
          <ShieldCheck className="size-3.5" /> Payments are securely processed by Stripe or Paystack.
        </p>
      </Card>

      {!payment ? (
        <Card>
          <CardHeader title="Choose a payment method" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-5"
              isLoading={createBooking.isPending}
              onClick={() => selectGateway('Stripe')}
              leftIcon={<CreditCard className="size-5" />}
            >
              Card / Apple Pay / Google Pay
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-5"
              isLoading={createBooking.isPending}
              onClick={() => selectGateway('Paystack')}
              leftIcon={<Landmark className="size-5" />}
            >
              Paystack (Card / Mobile Money)
            </Button>
          </div>
          {createBooking.isError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">
              Could not start payment. Please try again.
            </p>
          )}
        </Card>
      ) : payment.gateway === 'Stripe' && payment.clientSecret ? (
        <Card>
          <CardHeader title="Pay by card" />
          <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret }}>
            <StripeCheckoutForm onSuccess={handlePaid} />
          </Elements>
        </Card>
      ) : payment.gateway === 'Paystack' && payment.reference ? (
        <Card>
          <CardHeader title="Pay with Paystack" />
          <PaystackCheckoutButton
            email={draft.clientEmail}
            amount={payment.amount}
            reference={payment.reference}
            publicKey={payment.publicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY}
            onSuccess={handlePaid}
          />
        </Card>
      ) : (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}
    </div>
  )
}
