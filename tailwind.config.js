/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'verde-oscuro': '#1B4332',
        'agave': '#2D6A4F',
        'flor': '#E76F51',
        'hueso': '#FDFBF7',
        'piedra': '#4A4A4A',
        'gris-info': '#F5F5F0',
        'arena': '#E9D8A6',
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
