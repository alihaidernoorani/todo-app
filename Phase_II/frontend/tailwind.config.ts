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
        // Clean Light Mode Palette - "Slate & Snow"
        // Primary backgrounds
        white: "#ffffff",           // Main content areas, cards
        slate: {
          50: "#f8fafc",           // Secondary background (sidebar, page bg)
          100: "#f1f5f9",          // Tertiary (hover states, input bg)
          200: "#e2e8f0",          // Borders, dividers
          300: "#cbd5e1",          // Input borders, secondary borders
          400: "#94a3b8",          // Placeholder text, muted text
          500: "#64748b",          // Secondary text
          600: "#475569",          // Body text, descriptions
          700: "#334155",          // Secondary headings
          800: "#1e293b",          // Strong emphasis
          900: "#0f172a",          // Primary headings, primary text
        },
        // Tech Blue accent (replaces amber)
        blue: {
          50: "#eff6ff",           // Selected items, highlights
          100: "#dbeafe",          // Light accent backgrounds
          200: "#bfdbfe",          // Lighter accent
          300: "#93c5fd",          // Medium accent
          400: "#60a5fa",          // Focus ring variations
          500: "#3b82f6",          // Focus rings
          600: "#2563eb",          // Primary buttons, active states
          700: "#1d4ed8",          // Button hover states
          800: "#1e40af",          // Pressed states
          900: "#1e3a8a",          // Dark accent
        },
        // Semantic colors
        green: {
          50: "#f0fdf4",
          600: "#16a34a",          // Success messages
        },
        amber: {
          50: "#fffbeb",
          600: "#d97706",          // Medium priority, warnings
        },
        red: {
          50: "#fef2f2",
          600: "#dc2626",          // High priority, errors
        },
      },
      boxShadow: {
        // Clean Light Mode shadows (subtle, professional)
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        // Light glassmorphism (subtle backdrop blur effect)
        glass: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        // Shimmer animation for loading states (light theme)
        shimmer: "shimmer 2s cubic-bezier(0.4, 0.0, 0.6, 1) infinite",
        // Subtle pulse for optimistic states
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // Spring animation for interactions
        spring: "spring 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        spring: {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.05)" },
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
