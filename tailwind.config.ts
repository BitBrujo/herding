import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
      },
      colors: {
        gray: {
          950: "#0a0a0a",
          900: "#1a1a1a",
          800: "#2a2a2a",
          700: "#3a3a3a",
          600: "#4a4a4a",
          500: "#6a6a6a",
          400: "#8a8a8a",
          300: "#aaaaaa",
          200: "#cacaca",
          100: "#eaeaea",
          50: "#fafafa",
        },
        blue: {
          600: "#2563eb",
          500: "#3b82f6",
          400: "#60a5fa",
        },
        green: {
          600: "#16a34a",
          500: "#22c55e",
          400: "#4ade80",
        },
        yellow: {
          500: "#eab308",
          400: "#facc15",
        },
        red: {
          600: "#dc2626",
          500: "#ef4444",
          400: "#f87171",
        },
      },
    },
  },
  plugins: [],
};

export default config;