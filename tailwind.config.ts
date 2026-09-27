import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bed: "rgb(var(--bed) / <alpha-value>)",
        sheet: "rgb(var(--sheet) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        mark: "rgb(var(--mark) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
        caution: "rgb(var(--caution) / <alpha-value>)",
        good: "rgb(var(--good) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        sheet: "4px"
      },
      boxShadow: {
        sheet: "0 1px 2px rgb(var(--shadow) / 0.10), 0 12px 32px -12px rgb(var(--shadow) / 0.25)"
      },
      maxWidth: {
        measure: "68ch"
      }
    }
  },
  plugins: []
};

export default config;
