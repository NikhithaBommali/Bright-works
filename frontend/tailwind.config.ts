import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        brand: { teal: 'hsl(var(--brand-teal))' },
        surface: {
          primary: 'hsl(var(--surface-primary))',
          secondary: 'hsl(var(--surface-secondary))',
          elevated: 'hsl(var(--surface-elevated))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-bg))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          hover: 'hsl(var(--sidebar-hover))',
        },
        divider: 'hsl(var(--divider))',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, hsl(var(--primary)) 0%, var(--gradient-end) 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        soft: '0 10px 30px -12px hsl(var(--foreground) / 0.18)',
        card: '0 16px 40px -24px hsl(var(--foreground) / 0.24)',
      },
    },
  },
  plugins: [],
} satisfies Config;
