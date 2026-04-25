import type { Config } from "tailwindcss";

import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
        primary: "#E6D62E", // Amarelo ouro mais suave/menos "neon"
        secondary: "#1F0D1A", // Roxo bem profundo para melhor contraste
        accent: "#E6D62E",
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
  plugins: [tailwindAnimate],
};
export default config;
