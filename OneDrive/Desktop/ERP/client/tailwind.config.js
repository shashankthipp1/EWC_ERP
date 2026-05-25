/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Inter", "Segoe UI", "system-ui", "sans-serif"]
      },
      colors: {
        navy: "#050a12",
        navyLight: "#0b1220",
        panel: "#111827",
        panel2: "#1a2332",
        line: "rgba(148, 163, 184, 0.14)",
        gold: "#c9a227",
        goldLight: "#e4c76b",
        cream: "#f8fafc",
        muted: "#94a3b8",
        accent: "#3b82f6",
        accentSoft: "rgba(59, 130, 246, 0.12)",
        danger: "#ef4444",
        success: "#10b981"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(201, 162, 39, 0.2), 0 20px 50px -12px rgba(201, 162, 39, 0.25)",
        card: "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 48px -24px rgba(0, 0, 0, 0.65)",
        panel: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        soft: "0 4px 24px rgba(0, 0, 0, 0.35)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem"
      },
      backgroundImage: {
        mesh: "radial-gradient(at 20% 0%, rgba(59,130,246,0.15) 0, transparent 50%), radial-gradient(at 80% 10%, rgba(201,162,39,0.12) 0, transparent 45%), radial-gradient(at 50% 100%, rgba(15,23,42,0.8) 0, transparent 60%)"
      }
    }
  },
  plugins: []
};
