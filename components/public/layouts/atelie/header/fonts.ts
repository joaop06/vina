import localFont from "next/font/local";

// Google Fonts sometimes serves this family as /l/font?kit=…&skey=… URLs.
// Turbopack's next/font/google loader splits that query on "&" and fails.
export const atelieFont = localFont({
  src: "./fonts/cormorant-garamond-latin.woff2",
  weight: "300 700",
  display: "swap",
  variable: "--font-atelie",
  adjustFontFallback: "Times New Roman",
});
