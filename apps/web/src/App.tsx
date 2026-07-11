import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { MarketingLayout } from './components/layout/MarketingLayout'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { PublicBookingLayout } from './components/layout/PublicBookingLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import Landing from './pages/marketing/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Onboarding from './pages/onboarding/Onboarding'

import Overview from './pages/dashboard/Overview'
import Services from './pages/dashboard/Services'
import Availability from './pages/dashboard/Availability'
import Bookings from './pages/dashboard/Bookings'
import WalletPage from './pages/dashboard/Wallet'
import Settings from './pages/dashboard/Settings'

import ProviderStorefront from './pages/booking/ProviderStorefront'
import SlotPicker from './pages/booking/SlotPicker'
import PaymentStep from './pages/booking/PaymentStep'
import Confirmation from './pages/booking/Confirmation'

import NotFound from './pages/NotFound'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Marketing (public) */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Onboarding (authenticated, no dashboard chrome) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          {/* Provider dashboard (authenticated) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/dashboard/services" element={<Services />} />
              <Route path="/dashboard/availability" element={<Availability />} />
              <Route path="/dashboard/bookings" element={<Bookings />} />
              <Route path="/dashboard/wallet" element={<WalletPage />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/billing" element={<Navigate to="/dashboard/settings" replace />} />
            </Route>
          </Route>

          {/* Public client storefront + booking flow */}
          <Route element={<PublicBookingLayout />}>
            <Route path="/book/:slug" element={<ProviderStorefront />} />
            <Route path="/book/:slug/confirmation/:bookingId" element={<Confirmation />} />
            <Route path="/book/:slug/:serviceId" element={<SlotPicker />} />
            <Route path="/book/:slug/:serviceId/pay" element={<PaymentStep />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
