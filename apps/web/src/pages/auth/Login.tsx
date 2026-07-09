import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useLogin } from '../../hooks/useAuthActions'
import { ApiError } from '../../api/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Unable to log in. Try again.',
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
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Log in to manage your bookings and payouts.
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
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
              placeholder="••••••••"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.root?.message && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">
                {errors.root.message}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={login.isPending} rightIcon={<LogIn className="size-4" />}>
              Log in
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
          New to BookMe?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Create your booking page
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
