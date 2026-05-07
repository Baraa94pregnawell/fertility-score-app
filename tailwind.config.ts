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
        'purple-deep': '#3D2870',
        'rose-dusty': '#C06078',
        'bg-cream': '#FDFAF8',
        'text-dark': '#1A1325',
      },
      fontFamily: {
        arabic: ['IBM Plex Arabic', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
