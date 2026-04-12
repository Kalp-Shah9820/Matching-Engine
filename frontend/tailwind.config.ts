import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        ink: '#0a0a0a',
        panel: '#111111',
        edge: '#1e1e1e',
        wire: '#2a2a2a',
        muted: '#555555',
        dim: '#888888',
        light: '#cccccc',
        snow: '#f0f0f0',
        'amber-glow': '#fbbf24',
        'amber-dim': '#92600a',
        'teal-dim': '#134e4a',
        'rose-dim': '#4c0519',
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.5s infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(12px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
