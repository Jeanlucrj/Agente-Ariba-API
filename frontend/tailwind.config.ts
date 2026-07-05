import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ariba: {
          50: '#e8f4fd',
          100: '#c6e3fa',
          200: '#8ec8f5',
          300: '#56acf0',
          400: '#2491eb',
          500: '#0070c9',
          600: '#005ba1',
          700: '#004479',
          800: '#002d52',
          900: '#00172b',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
