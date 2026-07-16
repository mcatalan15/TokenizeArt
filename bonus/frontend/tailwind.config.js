/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.ts"],
  theme: {
    extend: {
      // Matches mint/assets/artwork.svg's palette, so the mint UI and the
      // NFT it produces feel like the same product.
      colors: {
        ink: "#100a24",
        panel: "#1a1035",
        accent: "#8b5cf6",
        accentLight: "#c9b6ff",
      },
    },
  },
  plugins: [],
};
