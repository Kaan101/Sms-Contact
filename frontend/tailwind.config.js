/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        swiss: {
          50: '#F9F9FB',
          100: '#F4F4F6',
          200: '#E5E5EA',
          300: '#D1D1D6',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B'
        }
      },
      boxShadow: {
        'swiss-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'swiss': '0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'swiss-lg': '0 20px 40px -15px rgba(0, 0, 0, 0.07)',
      }
    },
  },
  plugins: [],
}