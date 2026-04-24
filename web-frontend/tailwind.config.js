/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213d',
        paper: '#f8fafc',
        line: '#d8e3ea',
        brand: {
          50: '#effcf9',
          100: '#d7f4ef',
          500: '#1f9d8a',
          600: '#147d74',
          700: '#105f59',
        },
        note: {
          50: '#f3f8ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      boxShadow: {
        subtle: '0 16px 36px rgba(20, 33, 61, 0.08)',
      },
    },
  },
  plugins: [],
};
