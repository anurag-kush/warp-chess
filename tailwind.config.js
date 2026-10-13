/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warp: {
          cyan: '#00f0ff',
          purple: '#9d4edd',
          dark: '#0f172a',
          boardLight: '#f0d9b5',
          boardDark: '#b58863',
          floor2Light: '#d2dff0',
          floor2Dark: '#6b8cae',
        }
      }
    },
  },
  plugins: [],
}
