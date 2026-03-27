/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base:    "#050103",
        darkest: "#3A0519",
        dark:    "#670D2F",
        primary: "#A53860",
        light:   "#EF88AD",
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow:       "0 0 24px 4px rgba(239,136,173,0.35)",
        "glow-lg":  "0 0 48px 10px rgba(239,136,173,0.25)",
        "card-hover":"0 8px 40px 0 rgba(165,56,96,0.35)",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(165,56,96,0.28) 0%, transparent 70%)",
        "hero-grid":
          "linear-gradient(rgba(58,5,25,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(58,5,25,0.25) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse_glow: {
          "0%,100%": { boxShadow: "0 0 16px 3px rgba(239,136,173,0.4)" },
          "50%":     { boxShadow: "0 0 36px 8px rgba(239,136,173,0.7)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.7s ease forwards",
        pulse_glow:   "pulse_glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

