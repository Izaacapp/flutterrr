/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pb-dark-purple': '#7B6BA6',
        'pb-medium-purple': '#B8B3E9',
        'pb-light-purple': '#D4D1F5',
        'pb-periwinkle': '#B8B3E9',
        'pb-light-periwinkle': '#E8E6FA',
        'pb-ultra-light': '#F5F4FD',
        'pb-background': '#FAFAFF',
      }
    },
  },
  plugins: [],
}