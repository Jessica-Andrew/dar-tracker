import type { Config } from 'tailwindcss';

/**
 * Mirrors tokens.css. Any change to a token here must be paired with
 * the same change in tokens.css (and vice versa). Two sources means
 * one source can drift — keep them in sync.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50:  '#FBF6EE',
          100: '#F5EEDF',
          200: '#EFE6D8',
          300: '#E2D5BF',
          400: '#DACBB1',
          500: '#C9BBA4',    
          600: '#B0A48F',
        },
        clay: {
          100: '#F3D9C9',
          300: '#E29477',
          500: '#B4552D',
          600: '#9A461F',
          700: '#7A3418',
          900: '#4A1C0C',
        },
        ochre: {
          300: '#E9C578',
          500: '#D9A648',
          700: '#A17820',
        },
        olive: {
          300: '#B8C084',
          500: '#9BA65D',
          700: '#6B7A3A',
          800: '#5C7A4E',
        },
        ink: {
          900: '#2E2418',
          700: '#5C4B33',
          500: '#8A7357',
          300: '#B0A48F',
        },
        danger: {
          100: '#F2D9D0',
          500: '#A03A24',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        body: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs:   ['0.6875rem', { lineHeight: '1.5' }],
        sm:   ['0.8125rem', { lineHeight: '1.5' }],
        base: ['0.875rem',  { lineHeight: '1.5' }],
        md:   ['1rem',      { lineHeight: '1.5' }],
        lg:   ['1.125rem',  { lineHeight: '1.4' }],
        xl:   ['1.5rem',    { lineHeight: '1.15' }],
        '2xl':['2.125rem',  { lineHeight: '1.02' }],
        '3xl':['2.625rem',  { lineHeight: '1.02' }],
        '4xl':['3.625rem',  { lineHeight: '0.95' }],
      },
      letterSpacing: {
        kicker: '0.14em',
      },
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        button:          '0 3px 0 #7A3418',
        'button-hover':  '0 4px 0 #7A3418',
        'button-active': '0 1px 0 #7A3418',
        card:            '0 20px 50px -12px rgba(46, 36, 24, 0.5), 0 0 0 0.5px rgba(184, 143, 90, 0.3)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        quick: '150ms',
        base: '250ms',
        medium: '350ms',
        slow: '450ms',
      },
      keyframes: {
        'card-in': {
          '0%':   { opacity: '0', transform: 'translate(-50%, -42%) scale(0.88)' },
          '60%':  { opacity: '1', transform: 'translate(-50%, -50.5%) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'task-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        tickle: {
          '0%':   { transform: 'translateY(0)' },
          '30%':  { transform: 'translateY(-4px)' },
          '60%':  { transform: 'translateY(1px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'card-in': 'card-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'task-in': 'task-in 450ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        tickle:    'tickle 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
