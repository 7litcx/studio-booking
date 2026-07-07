/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          secondary: 'hsl(var(--card))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          velvet: 'hsl(var(--secondary))',
          accent: 'hsl(var(--accent))',
          glow: 'hsl(var(--primary) / 0.25)'
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          muted: 'hsl(var(--muted-foreground))'
        },
        white: '#F9F6EE',
        border: 'hsl(var(--border))',
        glass: 'hsl(var(--input))',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        cinematic: ['Manrope', 'sans-serif']
      }
    },
  },
  plugins: [],
}
