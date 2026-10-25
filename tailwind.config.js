/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Ugaoo uses Outfit for all typography: display headings, product titles, UI & body
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Storefront design system — reverse engineered directly from Ugaoo production tokens
        fv: {
          primary: '#0A4D3C',       // Ugaoo deep evergreen forest green (nav, primary CTA, badges)
          'primary-dark': '#083B2A',// hover / pressed
          accent: '#00B566',        // Ugaoo vibrant emerald green (--color-price)
          leaf: '#00A93D',          // Ugaoo brand green (--jdgm-primary-color)
          page: '#FFFFFF',          // Clean bright white canvas
          cream: '#FFF3D9',         // Ugaoo signature warm sunny cream (header, category strip)
          coral: '#FF8962',         // Ugaoo trust badge accent coral/orange
          butter: '#FFF9E4',
          sand: '#F4E6C6',          // Ugaoo warm sand search box
          yellow: '#FED02F',        // Ugaoo bright gold badge (--color-sale-badge-background)
          star: '#00A93D',          // Ugaoo review star rating green
          ink: '#212326',           // Ugaoo body text (--color-base-text)
          heading: '#1C1C1C',       // Ugaoo heading text (--color-base-heading)
          deep: '#042018',
          muted: '#5D6B5F',
          border: '#CADFD4',        // Ugaoo border (--color-base-border)
          surface: '#F7F7F7',       // image placeholder
          danger: '#D72C0D',        // Ugaoo critical error (--color-critical)
          success: '#008060',       // Ugaoo success (--color-success)
        },
        // Brand Colors
        brand: {
          green: "#0A4C36",
          "green-light": "#00B566",
          "green-dark": "#083B2A",
          olive: "#6d7c00",
          "olive-light": "#8a9d00",
          "olive-dark": "#4e5a00",
          black: "#1C1C1C",
          "gray-dark": "#1A1A1A",
          "gray-medium": "#333333",
          light: "#EEEEEE",
          "light-dark": "#CCCCCC",
          "light-darker": "#AAAAAA",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
