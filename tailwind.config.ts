import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1720",
        ember: "#f97316",
        pine: "#0f766e",
        blood: "#b91c1c",
        moon: "#e2e8f0",
        parchment: "#f7f3e9"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 32, 0.16)"
      },
      fontFamily: {
        sans: ["\"Noto Sans SC\"", "\"PingFang SC\"", "\"Microsoft YaHei\"", "sans-serif"],
        display: ["\"Iowan Old Style\"", "\"Songti SC\"", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
