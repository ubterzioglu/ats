import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The logo palette: black, white, lime, orange and a near-black ink.
        // Everything below it is a semantic role that resolves to one of
        // these values in globals.css. Text on lime is `void`; white text
        // never sits on orange.
        void: "rgb(var(--void) / <alpha-value>)",
        bone: "rgb(var(--bone) / <alpha-value>)",
        ash: "rgb(var(--ash) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        night: "rgb(var(--night) / <alpha-value>)",
        lime: "rgb(var(--lime) / <alpha-value>)",
        flame: "rgb(var(--flame) / <alpha-value>)",
        // Legacy names: iris and verdant resolve to lime, saffron to flame.
        iris: "rgb(var(--iris) / <alpha-value>)",
        saffron: "rgb(var(--saffron) / <alpha-value>)",
        verdant: "rgb(var(--verdant) / <alpha-value>)",

        bed: "rgb(var(--bed) / <alpha-value>)",
        bench: {
          DEFAULT: "rgb(var(--bench) / <alpha-value>)",
          sunk: "rgb(var(--bench-sunk) / <alpha-value>)",
          raised: "rgb(var(--bench-raised) / <alpha-value>)"
        },
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        // A divider is white at 8%, fixed: it is the one place the system
        // allows a hairline, and it must not be bumped up by an opacity suffix.
        line: "rgb(var(--line) / 0.08)",
        // The visible boundary of a control, which owes 3:1. `line` is a
        // divider and does not.
        edge: "rgb(var(--edge) / <alpha-value>)",
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
        // Headlines, buttons and chips use the wordmark's family; body copy
        // stays in the sans. Machine output keeps its tabular figures through
        // `tabular-nums`, not through a third family.
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      // Older views ask for hairline weights; nothing in this system is
      // lighter than regular, so those utilities resolve to 400.
      fontWeight: {
        extralight: "400",
        light: "400"
      },
      // Radius encodes scale: sticker cards are the roundest, controls and
      // terms step down, and the pill is a true pill.
      borderRadius: {
        sticker: "28px",
        surface: "20px",
        control: "12px",
        chip: "8px",
        pill: "9999px"
      },
      // Headlines carry their weight from the display family; every size
      // from 42px up carries -0.04em tracking.
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.5" }],
        "nav-label": ["0.875rem", { lineHeight: "1.2", letterSpacing: "0.025em" }],
        body: ["1.125rem", { lineHeight: "1.5" }],
        "heading-2xs": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "heading-xs": ["1.6875rem", { lineHeight: "1" }],
        subheading: ["2.25rem", { lineHeight: "1.2" }],
        "heading-sm": ["2.625rem", { lineHeight: "1.2", letterSpacing: "-0.04em" }],
        heading: ["3rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }],
        "heading-lg": [
          "clamp(2.75rem, 6vw, 4.875rem)",
          { lineHeight: "1.1", letterSpacing: "-0.04em" }
        ],
        display: [
          "clamp(3rem, 8vw, 7.0625rem)",
          { lineHeight: "1.05", letterSpacing: "-0.04em" }
        ],
        score: ["clamp(3.5rem, 8vw, 5rem)", { lineHeight: "1", letterSpacing: "-0.04em" }],
        h1: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        h2: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        h3: ["1.1875rem", { lineHeight: "1.3", letterSpacing: "-0.015em" }],
        micro: ["0.8125rem", { lineHeight: "1.5" }],
        readout: ["0.8125rem", { lineHeight: "1.5" }]
      },
      // Tailwind's numeric steps are left alone; the two section gaps the
      // system names (60px and 120px) get their own keys so they cannot be
      // confused with a 4-based step.
      spacing: {
        18: "4.5rem",
        "section-sm": "3.75rem",
        section: "7.5rem"
      },
      maxWidth: {
        measure: "68ch",
        page: "1280px",
        lede: "30rem"
      }
    }
  },
  plugins: []
};

export default config;

