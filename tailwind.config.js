/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'agave': '#2D6A4F',
        'arena': '#E9D8A6',
        'flor': '#E76F51',
        'hueso': '#FDFBF7',
        'gris-texto': '#2D2D2D',
        'gris-suave': '#6B6B6B',
        'exito': '#38A169',
        'peligro': '#C53A1F',
      },
      fontFamily: {
        'serif': ['Georgia', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
