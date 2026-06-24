/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
