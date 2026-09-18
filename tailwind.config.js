/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        court: {
          bg: "#0B0D0C",
          card: "#161A18",
          border: "#252C28",
          green: "#2F9E63",
          red: "#C2574F",
          blue: "#4A7DA8",
          yellow: "#C9A24B",
          accent: "#B7C95C",
          muted: "#98A29B",
        },
      },
    },
  },
  plugins: [],
};