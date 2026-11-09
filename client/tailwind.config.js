/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#2b3a8c', light: '#4b5fd6', dark: '#1e2a6b', soft: '#e9ecfb' },
        accent: { DEFAULT: '#f5a524', dark: '#b97a06', soft: '#fef3dd' },
        ink: { DEFAULT: '#141a33', soft: '#6b7390' },
        surface: { DEFAULT: '#f5f6fa', soft: '#eef0f8' },
        card: { DEFAULT: '#ffffff' },
        line: { DEFAULT: '#e3e6f0' },
        ok: { DEFAULT: '#1f9d6b' },
        bad: { DEFAULT: '#d64545' },
      },
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(20, 26, 51, 0.04)',
        pop: '0 18px 50px rgba(15, 23, 42, 0.22)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
