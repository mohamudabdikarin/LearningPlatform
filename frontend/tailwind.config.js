/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- this is required
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#14b8a6', // teal-500
        'dark-gray': '#1f2937',      // gray-800
        'light-gray': '#f9fafb',     // gray-50
      }
    },
  },
  plugins: [],
}