/** Tokens live in src/index.css; names follow shadcn/ui so its components drop in. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        primary: 'var(--foreground)',
        'primary-foreground': 'var(--background)',
        destructive: 'var(--destructive)',
      },
      borderRadius: { lg: '8px', xl: '16px' },
    },
  },
  plugins: [],
};
