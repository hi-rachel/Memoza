/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: "var(--color-mint)",
        bg: "var(--color-bg)",
        text: "var(--color-text)",
        btn: "var(--color-btn)",
        "btn-active": "var(--color-btn-active)",
        border: "var(--color-border)",
        "tag-default": "var(--color-tag-default)",
        "card-bg": "var(--color-card-bg)",
        "card-border": "var(--color-card-border)",
      },
    },
  },
  plugins: [],
};
