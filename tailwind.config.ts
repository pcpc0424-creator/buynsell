import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#050508',
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#252530',
        },
        accent: {
          blue: '#4f7df3',
          purple: '#7c3aed',
          pink: '#db2777',
          cyan: '#06b6d4',
        }
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'orb-float-1': 'orb-float-1 15s ease-in-out infinite',
        'orb-float-2': 'orb-float-2 18s ease-in-out infinite',
        'orb-float-3': 'orb-float-3 20s ease-in-out infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'orb-float-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(-30px, 20px) scale(1.05)' },
          '50%': { transform: 'translate(-20px, -30px) scale(0.95)' },
          '75%': { transform: 'translate(20px, -10px) scale(1.02)' },
        },
        'orb-float-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 40px) scale(0.9)' },
        },
        'orb-float-3': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(50px, -50px) rotate(180deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
