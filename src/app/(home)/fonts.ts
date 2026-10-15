import localFont from "next/font/local";

/**
 * NewPF typefaces, self-hosted from the @fontsource packages so the page makes
 * no third-party font request (no visitor IP sent to a font CDN) and renders
 * the same everywhere.
 *
 *   Newsreader — editorial serif with an optical-size axis: large headlines
 *   get the tighter display cut automatically.
 *   Instrument Sans — clean, slightly architectural sans for everything else.
 */
export const editorial = localFont({
  src: [
    { path: "../../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2", style: "normal", weight: "200 800" },
    { path: "../../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-editorial",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const grotesk = localFont({
  src: [
    { path: "../../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2", style: "normal", weight: "400 700" },
  ],
  variable: "--font-grotesk",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});
