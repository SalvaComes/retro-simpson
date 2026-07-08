import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        simpsonYellow: "#FED90F",
        simpsonBlue: "#209CD8",
        simpsonRed: "#D62411",
        simpsonBrown: "#6C4A34",
      },
      fontFamily: {
        simpson: ["'Comic Sans MS'", "'Comic Sans'", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
