/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070B18",
          900: "#0B1226",
          800: "#131B3A",
          700: "#1B2650",
          600: "#273366",
        },
        gold: {
          400: "#F2C94C",
          500: "#D4AF37",
          600: "#B4922C",
        },
        ivory: "#F5F5F0",
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "stadium-glow":
          "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.16), transparent 60%)",
        "seam-line":
          "repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(212,175,55,0.35) 8px, rgba(212,175,55,0.35) 10px)",
        "mesh-gold":
          "radial-gradient(circle at 15% 20%, rgba(212,175,55,0.14), transparent 45%), radial-gradient(circle at 85% 0%, rgba(99,102,241,0.10), transparent 40%), radial-gradient(circle at 50% 100%, rgba(212,175,55,0.08), transparent 50%)",
        "grid-fade":
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        shimmer: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
      },
      boxShadow: {
        gold: "0 0 24px rgba(212,175,55,0.35)",
        "gold-lg": "0 0 60px rgba(212,175,55,0.25)",
        "inner-line": "inset 0 1px 0 rgba(255,255,255,0.06)",
        glass: "0 8px 32px rgba(0,0,0,0.35)",
      },
      keyframes: {
        floodlight: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "70%": { transform: "scale(1.4)", opacity: "0" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-glow": {
          "0%, 100%": { textShadow: "0 0 14px rgba(242,201,76,0.45)" },
          "50%": { textShadow: "0 0 28px rgba(242,201,76,0.85)" },
        },
      },
      animation: {
        floodlight: "floodlight 3.5s ease-in-out infinite",
        rise: "rise 0.5s ease-out both",
        marquee: "marquee 28s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.2,0.6,0.4,1) infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "count-glow": "count-glow 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
