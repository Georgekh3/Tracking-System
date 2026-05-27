import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        atelier: {
          green: "#2f6f5e",
          teal: "#0f766e",
          coral: "#d65f4c",
          gold: "#b7791f",
          mist: "#eef4f2",
          line: "#d8e3df"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: [forms]
};

export default config;
