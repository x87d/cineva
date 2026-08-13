import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0D17', // Midnight — primary background
        surface: '#151927', // Slate — surfaces / cards
        surface2: '#1E2438', // elevated surface / skeletons
        fg: '#E8EAF0', // Mist — primary text
        muted: '#969CB2', // secondary text
        accent: {
          violet: '#6C5CE7', // primary interactive accent
          coral: '#FF6B6B', // highlights and ratings
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: { 'screen-2xl': '1440px' },
    },
  },
  plugins: [],
} satisfies Config
