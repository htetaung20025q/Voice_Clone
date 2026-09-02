/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Myanmar', 'Padauk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        burmese: ['Noto Sans Myanmar', 'Padauk', 'Pyidaungsu', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        myanmar: {
          red: '#991B1B',       // Deep Myanmar lacquer ruby red (Primary CTA)
          'red-hover': '#7F1D1D',
          'red-light': '#FEF2F2',
          gold: '#D97706',      // Subtle Myanmar warm gold accent
          'gold-light': '#FEF3C7',
          'gold-dark': '#B45309',
        },
      }
    },
  },
  plugins: [],
}
