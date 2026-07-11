import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query', 'zustand'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'stripe-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'paystack-vendor': ['react-paystack'],
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
})
