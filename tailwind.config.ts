import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", ...defaultTheme.fontFamily.sans],
        body: ["var(--font-body)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: "#eefdf5",
          100: "#d6fae6",
          200: "#b0f3d0",
          300: "#7ce7b3",
          400: "#43d391",
          500: "#1db874",
          600: "#12945d",
          700: "#11764c",
          800: "#125d3f",
          900: "#0f4c35",
        },
        status: {
          open: "#16a34a",
          claimed: "#f59e0b",
          submitted: "#2563eb",
          done: "#6b7280",
        },
      },
      keyframes: {
        "count-flash": {
          "0%": { backgroundColor: "rgba(29, 184, 116, 0.35)" },
          "100%": { backgroundColor: "transparent" },
        },
        "pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "radar-ping": {
          "0%": { transform: "scale(0.9)", opacity: "0.55" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "mesh-drift": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%": { transform: "translate(3%, -4%) scale(1.05)" },
          "66%": { transform: "translate(-3%, 3%) scale(0.98)" },
        },
      },
      animation: {
        "count-flash": "count-flash 900ms ease-out",
        "pop": "pop 400ms ease-out",
        "radar-ping": "radar-ping 2.2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite",
        "mesh-drift": "mesh-drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
