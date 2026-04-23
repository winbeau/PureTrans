import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        github: {
          canvas: '#f6f8fa',
          subtle: '#f3f4f6',
          fg: '#1f2328',
          muted: '#59636e',
          border: '#d0d7de',
          accent: '#0969da',
          overlay: '#1f2328',
          dark: {
            canvas: '#0d1117',
            subtle: '#161b22',
            fg: '#e6edf3',
            muted: '#8b949e',
            border: '#30363d',
            accent: '#388bfd',
            overlay: '#010409',
          },
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: [
          '"SFMono-Regular"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
