import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Banknote,
  Calendar,
  Camera,
  Car,
  Check,
  Clock,
  CreditCard,
  Globe,
  Heart,
  Scissors,
  Shield,
  Sparkles,
  Stethoscope,
  Wallet,
  Wand2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

const categories = [
  { icon: Scissors, label: 'Barbers' },
  { icon: Wand2, label: 'Hairdressers' },
  { icon: Sparkles, label: 'Makeup Artists' },
  { icon: Stethoscope, label: 'Clinics' },
  { icon: Camera, label: 'Photographers' },
  { icon: Car, label: 'Car Rentals' },
]

const features = [
  {
    icon: Globe,
    title: 'Your own booking page',
    description:
      'A branded, mobile-friendly page at bookme.app/book/your-name that clients can book from in seconds.',
  },
  {
    icon: Clock,
    title: 'Real-time availability',
    description:
      'Set weekly working hours and block time off — clients only ever see slots you can actually take.',
  },
  {
    icon: CreditCard,
    title: 'Deposits, secured',
    description:
      'Collect a configurable deposit per service via Stripe or Paystack before you confirm a booking.',
  },
  {
    icon: Wallet,
    title: 'Wallet & payouts',
    description:
      'Track available and pending balance, then request a payout to your bank or mobile money wallet.',
  },
  {
    icon: Shield,
    title: 'No-shows, handled',
    description:
      'Cancellations refund automatically; completed jobs release your deposit straight to your wallet.',
  },
  {
    icon: Heart,
    title: 'Built for solo pros',
    description:
      'No bloated features you will never touch — just what independent service providers actually need.',
  },
]

const steps = [
  { title: 'Sign up', description: 'Create your account and pick a category in under a minute.' },
  { title: 'Add your services', description: 'Set pricing, duration, and deposit percentage per service.' },
  { title: 'Share your link', description: 'Send clients your booking page — they pick a slot and pay a deposit.' },
  { title: 'Get paid', description: 'Deposits land in your wallet; request a payout whenever you like.' },
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-brand-radial pointer-events-none absolute inset-0" />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge tone="brand" className="mx-auto mb-6">
              <Sparkles className="size-3.5" /> Now live for independent providers
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-6xl">
              Your booking page, <span className="bg-brand-gradient bg-clip-text text-transparent">built to get you paid.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-ink-600 dark:text-ink-300">
              BookMe gives barbers, hairdressers, makeup artists, clinics, photographers and car
              rental pros a beautiful booking page with deposits, availability and payouts —
              for one flat $5/month.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" rightIcon={<Sparkles className="size-4" />}>
                  Start your booking page
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  See how it works
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-ink-400">No credit card required for the first 14 days.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto mt-16 max-w-3xl"
          >
            <Card className="animate-float bg-white/90 backdrop-blur dark:bg-ink-900/90">
              <div className="flex items-center justify-between border-b border-ink-100 pb-4 dark:border-ink-800">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand-gradient text-white font-semibold">
                    J
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-ink-50">Jane's Hair Studio</p>
                    <Badge tone="accent">Hairdresser</Badge>
                  </div>
                </div>
                <Calendar className="size-5 text-ink-400" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { name: 'Signature Cut', price: '$45', duration: '45 min' },
                  { name: 'Full Color', price: '$120', duration: '2 hr' },
                  { name: 'Blowout', price: '$35', duration: '30 min' },
                ].map((service) => (
                  <div
                    key={service.name}
                    className="rounded-xl border border-ink-100 p-4 text-left dark:border-ink-800"
                  >
                    <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{service.name}</p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{service.duration}</p>
                    <p className="mt-3 font-semibold text-brand-600 dark:text-brand-400">
                      {service.price}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-y border-ink-100 bg-ink-50/60 py-14 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm font-medium uppercase tracking-wide text-ink-400">
            Built for every appointment-based business
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center gap-2 rounded-xl2 border border-ink-100 bg-white p-5 text-center shadow-soft dark:border-ink-800 dark:bg-ink-900"
              >
                <c.icon className="size-6 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 sm:text-4xl">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-4 text-ink-600 dark:text-ink-300">
            From your first booking to your fiftieth payout, BookMe handles the operational
            details so you can focus on the work.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold text-ink-900 dark:text-ink-50">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{f.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-ink-100 bg-ink-50/60 py-20 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-ink-900 dark:text-ink-50 sm:text-4xl">
            Live in four steps
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-ink-900 dark:text-ink-50">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-ink-600 dark:text-ink-300">
            One plan. Everything included. No surprise fees beyond the standard payout fee.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-10 max-w-md"
        >
          <Card className="relative overflow-hidden border-brand-200 dark:border-brand-500/30">
            <div className="bg-brand-radial pointer-events-none absolute inset-0" />
            <div className="relative">
              <Badge tone="brand">Standard plan</Badge>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-ink-900 dark:text-ink-50">$5</span>
                <span className="text-ink-500 dark:text-ink-400">/ month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink-600 dark:text-ink-300">
                {[
                  'Unlimited services & bookings',
                  'Custom booking page with your branding',
                  'Stripe & Paystack deposit collection',
                  'Wallet, transaction history & payouts',
                  'Working hours & time-off management',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-8 block">
                <Button className="w-full" size="lg">
                  Get started for $5/mo
                </Button>
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
                <Banknote className="size-3.5" /> Payout fee: 2% + $0.30 per payout
              </p>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-xl2 bg-brand-gradient px-8 py-16 text-center shadow-glow sm:px-16">
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to fill your calendar?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-brand-50/90">
              Join independent providers already taking bookings and deposits through BookMe.
            </p>
            <Link to="/signup" className="mt-8 inline-block">
              <Button size="lg" variant="secondary">
                Create your booking page
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
