import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bnr: {
          teal: '#6c321B',
          cyan: '#B5651D',
          blue: '#0d6efd',
          'blue-dark': '#084298',
          gold: '#ffc107',
          dark: '#1c1c27',
          gray: '#212529',
          light: '#fcf6e8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
