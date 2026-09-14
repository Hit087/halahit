import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ==== باليت جديد: وردي مغبّر هادئ + نبيتي فخم بدل الوردي الفاقع ====
        primary: "#E8C4C4",
        "primary-dark": "#D9A8A8",
        accent: "#7A3B41",
        "accent-dark": "#5F2C31",
        cream: "#F8F1E7",
        beige: "#E8D8C3",
        text: "#3E2723",
        canvas: "#FBF3EC",
        line: "#f0e0d6",
      },
      borderRadius: {
        luxury: "16px",
        "luxury-lg": "20px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(62, 39, 35, 0.08)",
        "soft-lg": "0 8px 32px rgba(62, 39, 35, 0.12)",
      },
      fontFamily: {
        arabic: ["var(--font-arabic)", "Tahoma", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
