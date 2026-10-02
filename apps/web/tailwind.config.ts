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
        accent: "rgb(var(--accent) / <alpha-value>)",
        mark: "rgb(var(--mark) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
        caution: "rgb(var(--caution) / <alpha-value>)",
        good: "rgb(var(--good) / <alpha-value>)"
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      // Radius encodes scale rather than being one value everywhere: the page
      // surface, the controls on it, and the terms inside those are different
      // sizes of thing.
      borderRadius: {
        sheet: "12px",
        control: "7px",
        chip: "4px"
      },
      boxShadow: {
        sheet: "0 1px 2px rgb(var(--shadow) / 0.05), 0 16px 40px -24px rgb(var(--shadow) / 0.22)"
      },
      maxWidth: {
        measure: "68ch"
      }
    }
  },
  plugins: []
};

export default config;
