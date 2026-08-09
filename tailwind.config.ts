import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F1F3D",
          50: "#EEF1F6",
          100: "#D6DCE8",
          200: "#AEB9D1",
          300: "#8596BA",
          400: "#5D73A3",
          500: "#3A5085",
          600: "#243968",
          700: "#0F1F3D",
          800: "#0B1730",
          900: "#070F22",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
