import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useRegister } from '../../hooks/useAuthActions'
import { ApiError } from '../../api/client'
import { PROVIDER_CATEGORIES } from '../../lib/constants'

const schema = z
  .object({
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
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Barber' },
  })
  const registerProvider = useRegister()
  const navigate = useNavigate()

  const onSubmit = handleSubmit(async ({ confirmPassword: _confirmPassword, ...values }) => {
    try {
      await registerProvider.mutateAsync(values)
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Unable to create your account.',
      })
    }
  })

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <Calendar className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">
            Start taking bookings
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            $5/month. Cancel anytime. Your own booking page in minutes.
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Business name"
              placeholder="Jane's Hair Studio"
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
            <Input
              label="Email"
              type="email"
              placeholder="you@business.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm password"
              type="password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            {errors.root?.message && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">
                {errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              isLoading={registerProvider.isPending}
              rightIcon={<Sparkles className="size-4" />}
            >
              Create my booking page
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
