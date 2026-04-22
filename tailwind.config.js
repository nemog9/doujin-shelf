/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f0f1a",
          card: "#1a1a2e",
          modal: "#16213e",
        },
      },
      gridTemplateColumns: {
        "auto-fill-160": "repeat(auto-fill, minmax(160px, 1fr))",
      },
    },
  },
  plugins: [],
};
