import type { Config } from "tailwindcss";

/**
 * Premium Australian commercial investment aesthetic:
 * warm off-white ground, charcoal ink, one restrained brass accent.
 * No price badges, no urgency reds, no agent-brochure gradients.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14161A",
          900: "#14161A",
          800: "#1E2228",
          700: "#2C323A",
          600: "#414954",
          500: "#5C6672",
          400: "#7C8794",
          300: "#A3ACB7",
          200: "#C9D0D8",
          100: "#E4E8EC",
          50: "#F1F3F5",
        },
        canvas: {
          DEFAULT: "#FBFAF8",
          raised: "#FFFFFF",
          sunken: "#F4F2EE",
          deep: "#EDEAE4",
        },
        brass: {
          DEFAULT: "#9C7A46",
          600: "#8A6B3B",
          500: "#9C7A46",
          400: "#B99A60",
          200: "#E3D5BC",
          100: "#F2EADB",
        },
        signal: {
          hot: "#8C3A2B",
          warm: "#8A6B3B",
          nurture: "#4A5A6A",
          positive: "#2F5D50",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "ui-serif",
          "Iowan Old Style",
          "Palatino Linotype",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 6vw, 4.25rem)", { lineHeight: "1.04", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2rem, 4.5vw, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.65rem, 3.2vw, 2.35rem)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "display-sm": ["clamp(1.35rem, 2.4vw, 1.75rem)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        eyebrow: ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.16em" }],
      },
      maxWidth: { prose: "68ch" },
      spacing: { section: "clamp(4rem, 9vw, 7.5rem)" },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(20,22,26,0.04), 0 8px 24px -12px rgba(20,22,26,0.14)",
        lift: "0 2px 4px rgba(20,22,26,0.05), 0 18px 40px -18px rgba(20,22,26,0.24)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 0.5s ease-out both" },
    },
  },
  plugins: [],
};

export default config;
