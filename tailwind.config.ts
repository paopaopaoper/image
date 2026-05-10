import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f3f0",
          100: "#e8e3db",
          200: "#d4ccc0",
          300: "#c4b9a8",
          400: "#a89882",
          500: "#8a7b6b",
          600: "#736557",
          700: "#5c4f42",
          800: "#4a3f35",
          900: "#2d241a",
        },
        wash: {
          50: "#fafaf8",
          100: "#f5f3ef",
          200: "#eeebe5",
          300: "#e2ded6",
        },
        accent: {
          muted: "#c7a97c",
          soft: "#d4c5a9",
          deep: "#8b6f4e",
        },
      },
      fontFamily: {
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"SimSun"',
          "serif",
        ],
        sans: [
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "system-ui",
          "sans-serif",
        ],
      },
      spacing: {
        page: "min(5vw, 6rem)",
        section: "clamp(2rem, 4vw, 4rem)",
      },
      borderRadius: {
        soft: "0.375rem",
        gentle: "0.75rem",
        arch: "1.25rem",
      },
      boxShadow: {
        poster: "0 4px 24px rgba(45,36,26,0.08)",
        float: "0 8px 40px rgba(45,36,26,0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "skeleton-pulse": "skeletonPulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        skeletonPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
