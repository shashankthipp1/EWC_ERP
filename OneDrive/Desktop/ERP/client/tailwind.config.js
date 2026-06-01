/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "DM Sans", "sans-serif"]
      },
      colors: {
        navy: "var(--bg-base)",
        navyLight: "var(--bg-elevated)",
        panel: "var(--bg-surface)",
        panel2: "var(--bg-surface-2)",
        line: "var(--border-default)",
        gold: "var(--brand)",
        goldLight: "var(--brand-bright)",
        cream: "var(--text-primary)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        surface: "var(--bg-surface)",
        "surface-2": "var(--bg-surface-2)",
        border: "var(--border-default)",
        brand: "var(--brand)",
        "brand-bright": "var(--brand-bright)"
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
        panel: "var(--shadow-panel)",
        soft: "var(--shadow-soft)",
        lift: "0 12px 40px -12px var(--shadow-color)"
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.25rem"
      },
      backgroundImage: {
        mesh: "var(--bg-mesh)",
        "gradient-brand": "linear-gradient(135deg, var(--brand) 0%, var(--brand-bright) 100%)"
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        shimmer: "shimmer 1.5s infinite"
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } }
      }
    }
  },
  plugins: []
};
