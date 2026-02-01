import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Stone Palette
        stone: {
          950: "#0c0a09", // Deep slate background (primary)
          900: "#1c1917", // Secondary background
          800: "#292524", // Card background
          700: "#44403c", // Border color
        },
        amber: {
          500: "#f59e0b", // Primary accent (CTAs, highlights)
          600: "#d97706", // Hover state
          400: "#fbbf24", // Lighter accent for glows
        },
        // Futuristic neon accents
        neon: {
          cyan: "#06b6d4",
          purple: "#a855f7",
          emerald: "#10b981",
        },
      },
      backgroundImage: {
        // Digital texture gradient
        "digital-texture": "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.05\"/%3E%3C/svg%3E')",
        // Radial glow gradient
        "radial-glow": "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
      },
      boxShadow: {
        // Glassmorphism shadows
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-lg": "0 12px 48px 0 rgba(0, 0, 0, 0.5)",
        // Neon glow effects
        "neon-amber": "0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)",
        "neon-cyan": "0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)",
        "neon-subtle": "0 0 10px rgba(245, 158, 11, 0.2)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        // Shimmer animation for loading states
        shimmer: "shimmer 2s cubic-bezier(0.4, 0.0, 0.6, 1) infinite",
        // Glow pulse for optimistic states
        "glow-pulse": "glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // Tactile press animation
        "tactile-press": "tactile-press 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "glow-pulse": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 30px rgba(245, 158, 11, 0.8)",
          },
        },
        "tactile-press": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
