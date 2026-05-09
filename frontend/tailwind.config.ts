import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bnr: {
          teal: '#08beab',
          cyan: '#0baccc',
          blue: '#0d6efd',
          'blue-dark': '#084298',
          gold: '#ffc107',
          dark: '#1c1c27',
          gray: '#212529',
          light: '#f8f9fa',
        },
      },
    },
  },
  plugins: [],
};

export default config;
