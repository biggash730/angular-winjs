/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f4ff',
          100: '#ebebff',
          200: '#d9d8ff',
          300: '#bcb8ff',
          400: '#9a8dff',
          500: '#7c5cfc',
          600: '#6c37f0',
          700: '#5c27d4',
          800: '#4c22ab',
          900: '#402086',
          950: '#261151',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd3',
          200: '#ffdba5',
          300: '#ffc06d',
          400: '#ff9d32',
          500: '#ff7d0a',
          600: '#f26200',
          700: '#c94a02',
          800: '#9f3b0b',
          900: '#81320c',
          950: '#461705',
        },
        ink: {
          50: '#f6f6f9',
          100: '#ececf2',
          200: '#d5d5e2',
          300: '#b1b1c9',
          400: '#8686a8',
          500: '#67668d',
          600: '#535174',
          700: '#44425f',
          800: '#302e46',
          900: '#1e1d2e',
          950: '#121120',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(30, 29, 46, 0.08), 0 8px 24px -8px rgba(30, 29, 46, 0.12)',
        glow: '0 0 0 1px rgba(124, 92, 252, 0.15), 0 8px 30px -8px rgba(124, 92, 252, 0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c5cfc 0%, #6c37f0 50%, #ff7d0a 150%)',
        'brand-radial': 'radial-gradient(circle at top left, rgba(124,92,252,0.25), transparent 60%)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
