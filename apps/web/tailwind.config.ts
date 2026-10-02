import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bed: "rgb(var(--bed) / <alpha-value>)",
        bench: {
          DEFAULT: "rgb(var(--bench) / <alpha-value>)",
          sunk: "rgb(var(--bench-sunk) / <alpha-value>)",
          raised: "rgb(var(--bench-raised) / <alpha-value>)"
        },
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        action: "rgb(var(--action) / <alpha-value>)",
        // Edges, flow and glow only. Never text on light - that is `live-ink`.
        live: {
          DEFAULT: "rgb(var(--live) / <alpha-value>)",
          ink: "rgb(var(--live-ink) / <alpha-value>)"
        },
        good: "rgb(var(--good) / <alpha-value>)",
        caution: "rgb(var(--caution) / <alpha-value>)",
        mark: "rgb(var(--mark) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      // Radius encodes scale rather than being one value everywhere: the work
      // surface, the controls on it, and the terms inside those are different
      // sizes of thing.
      borderRadius: {
        surface: "10px",
        control: "6px",
        chip: "3px"
      },
      // The scale from the system, so a heading is named by its role rather
      // than reached for by eye. Base 16px, roughly a major third.
      fontSize: {
        display: ["clamp(2.25rem, 5vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        score: ["clamp(3.5rem, 8vw, 5rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
        h1: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        h2: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        h3: ["1.1875rem", { lineHeight: "1.3", letterSpacing: "-0.015em" }],
        micro: ["0.8125rem", { lineHeight: "1.5" }],
        readout: ["0.8125rem", { lineHeight: "1.5" }]
      },
      // 4-based, as the system specifies. Tailwind's own scale already covers
      // these; the named steps are here so the spacing rule is readable.
      spacing: {
        18: "4.5rem"
      },
      maxWidth: {
        measure: "68ch"
      }
    }
  },
  plugins: []
};

export default config;
