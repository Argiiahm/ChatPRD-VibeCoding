/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1E1D1B",
        foreground: "#EBEBE6",
        card: {
          DEFAULT: "#2B2A27",
          hover: "#363431",
        },
        primary: {
          DEFAULT: "#D97757", // Claude-like muted amber/orange
          hover: "#E88B6D",
        },
        secondary: {
          DEFAULT: "#363431",
          hover: "#45423E",
        },
        accent: "#D4A373",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
