/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#15151A",
          soft: "#7a7a80",
          muted: "#9b9b9f"
        },
        primary: {
          50: "#EEF7F3",
          100: "#DCEEE6",
          200: "#BBDDCD",
          400: "#7CB69D",
          500: "#5C9C81",
          600: "#4A8068",
          700: "#3B6553",
          900: "#1F3528"
        },
        accentBlue: {
          50: "#EAF0FF",
          400: "#6B8CFF",
          500: "#3D6BFF",
          600: "#2750D6"
        },
        accentGreen: {
          50: "#E9F8ED",
          400: "#52C470",
          500: "#2BA84A",
          600: "#1F8538"
        },
        paper: "#F4F4F2",
        hairline: "#E3E3E0"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "16px",
        cardLg: "18px"
      },
      boxShadow: {
        hairline: "inset 0 0 0 1.5px #E3E3E0",
        hairlineHover: "0 14px 28px rgba(0,0,0,0.12), inset 0 0 0 1.5px #E3E3E0"
      }
    }
  },
  plugins: []
}