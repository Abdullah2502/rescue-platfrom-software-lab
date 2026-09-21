import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        slate: {
          50: "rgb(var(--nx-slate-50) / <alpha-value>)",
          100: "rgb(var(--nx-slate-100) / <alpha-value>)",
          200: "rgb(var(--nx-slate-200) / <alpha-value>)",
          300: "rgb(var(--nx-slate-300) / <alpha-value>)",
          400: "rgb(var(--nx-slate-400) / <alpha-value>)",
          500: "rgb(var(--nx-slate-500) / <alpha-value>)",
          600: "rgb(var(--nx-slate-600) / <alpha-value>)",
          700: "rgb(var(--nx-slate-700) / <alpha-value>)",
          800: "rgb(var(--nx-slate-800) / <alpha-value>)",
          900: "rgb(var(--nx-slate-900) / <alpha-value>)",
          950: "rgb(var(--nx-slate-950) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--nx-ink) / <alpha-value>)",
          50: "rgb(var(--nx-slate-900) / <alpha-value>)",
          100: "rgb(var(--nx-slate-100) / <alpha-value>)",
          200: "rgb(var(--nx-slate-200) / <alpha-value>)",
          300: "rgb(var(--nx-slate-700) / <alpha-value>)",
          400: "rgb(var(--nx-slate-800) / <alpha-value>)",
          500: "rgb(var(--nx-slate-900) / <alpha-value>)",
          600: "rgb(var(--nx-slate-950) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--nx-paper) / <alpha-value>)",
          50: "rgb(var(--nx-slate-950) / <alpha-value>)",
          100: "rgb(var(--nx-slate-900) / <alpha-value>)",
          200: "rgb(var(--nx-slate-800) / <alpha-value>)",
          300: "rgb(var(--nx-slate-700) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--nx-surface) / <alpha-value>)",
          50: "rgb(var(--nx-slate-950) / <alpha-value>)",
          100: "rgb(var(--nx-slate-900) / <alpha-value>)",
          200: "rgb(var(--nx-slate-800) / <alpha-value>)",
        },
        signal: {
          DEFAULT: "#EF4444",
          50: "#450A0A",
          100: "#7F1D1D",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        relief: {
          DEFAULT: "#10B981",
          50: "#022C22",
          100: "#064E3B",
          500: "#10B981",
          600: "#059669",
        },
        mist: "rgb(var(--nx-mist) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Outfit", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3.5rem, 7vw, 5.5rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.25rem, 4vw, 3.25rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-md": ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      },
      letterSpacing: {
        eyebrow: "0.14em",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        panel: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 10px 30px -10px rgba(15, 23, 42, 0.1)",
        "glow-signal": "0 0 20px -3px rgba(239, 68, 68, 0.4)",
        "glow-relief": "0 0 20px -3px rgba(16, 185, 129, 0.4)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        "card-hover": "0 12px 30px -5px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        ticker: "ticker 50s linear infinite",
        "fade-in": "fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite linear",
      },
    },
  },
  plugins: [require("daisyui"), require("tailwindcss-animate")],
  daisyui: {
    themes: [
      {
        nexora: {
          primary: "#EF4444",
          "primary-content": "#FFFFFF",
          secondary: "#0F172A",
          "secondary-content": "#FFFFFF",
          accent: "#10B981",
          "accent-content": "#FFFFFF",
          neutral: "#0F172A",
          "neutral-content": "#FFFFFF",
          "base-100": "#FAFBFD",
          "base-200": "#F1F5F9",
          "base-300": "#E2E8F0",
          "base-content": "#0F172A",
          info: "#06B6D4",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "0.375rem",
          "--border-btn": "1px",
        },
      },
    ],
    logs: false,
    base: false,
    styled: true,
    utils: true,
  },
} satisfies Config;
