/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        spotify: '#1DB954',
        'spotify-dark': '#158a3e',
        surface: '#181818',
        'surface-hover': '#282828',
        'surface-2': '#232323',
      }
    }
  },
  plugins: []
}
