/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#058789',
          hover: '#046b6d',
          50: '#f0fafa',
          100: '#d0f0f0',
          200: '#a0e0e0',
        },
        'accent-blue': '#5fc4eb',
        secondary: '#ba9d20',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
