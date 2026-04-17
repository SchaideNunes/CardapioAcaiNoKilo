import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      fontSize: {
        // Tipografia fluida: min-size, ideal-size (vw), max-size
        'fluid-h1': ['clamp(2.5rem, 8vw, 6rem)', { lineHeight: '0.9' }],
        'fluid-h2': ['clamp(2rem, 6vw, 5rem)', { lineHeight: '1' }],
        'fluid-h3': ['clamp(1.5rem, 4vw, 3.5rem)', { lineHeight: '1.1' }],
        'fluid-p': ['clamp(1rem, 1.2vw, 1.25rem)', { lineHeight: '1.6' }],
      },
      colors: {
        primary: "#F6E632",
        secondary: "#931B88",
        accent: "#F6E632",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-raleway)"],
        heading: ["var(--font-bebas-neue)"],
      },
      borderRadius: {
        base: "3px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
