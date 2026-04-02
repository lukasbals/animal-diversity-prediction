import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(148, 163, 184, 0.18)",
        panel: "rgba(15, 23, 42, 0.86)",
        panelSoft: "rgba(30, 41, 59, 0.72)",
        accent: "#22c55e",
        danger: "#f97316",
        warning: "#facc15",
        mutedText: "#94a3b8",
      },
      boxShadow: {
        glow: "0 20px 45px rgba(15, 23, 42, 0.35)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at top, rgba(34, 197, 94, 0.16), transparent 28%), linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 1))",
      },
    },
  },
  plugins: [],
};

export default config;
