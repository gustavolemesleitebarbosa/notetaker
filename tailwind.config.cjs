/** @type {import('tailwindcss').Config} */
const config = {
  mode: 'jit',
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#299197",
          secondary: "#f6d860",
          accent: "#37cdbe",
          neutral: "#3d4451",
          "base-100": "#ffffff",
        },
      },
      "dark",
      "winter",
      "cupcake",
    ],
  },
};

module.exports = config;
