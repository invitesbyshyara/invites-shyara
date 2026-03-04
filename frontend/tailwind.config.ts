import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Quicksand", "sans-serif"],
        script: ["Dancing Script", "cursive"],
        display: ['"Playfair Display"', "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          foreground: "hsl(var(--gold-foreground))",
        },
        rose: {
          DEFAULT: "hsl(var(--rose))",
          light: "hsl(var(--rose-light))",
          dark: "hsl(var(--rose-dark))",
        },
        peach: {
          DEFAULT: "hsl(var(--peach))",
          light: "hsl(var(--peach-light))",
        },
        lavender: {
          DEFAULT: "hsl(var(--lavender))",
          light: "hsl(var(--lavender-light))",
        },
        cream: "hsl(var(--cream))",
        blush: "hsl(var(--blush))",
        wedding: {
          gold: "#D4AF37",
          "gold-light": "#E8D5A3",
          rose: "#E8B4B8",
          "rose-light": "#F5D7DA",
          "rose-pastel": "#F8E8E9",
          cream: "#F5F5DC",
          "cream-light": "#FAF9F6",
          burgundy: "#800020",
          "burgundy-light": "#A64D4D",
          navy: "#1A1A2E",
          "navy-light": "#2D2D4A",
          ivory: "#FFFEF7",
          blush: "#F4E4E6",
          "forest-green": "#006400",
          maroon: "#800020",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "phone-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "mesh-gradient": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(3deg)" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(20px) rotate(-3deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "heart-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
        "slide-in-right": "slide-in-right 0.6s ease-out forwards",
        "phone-float": "phone-float 4s ease-in-out infinite",
        "mesh-gradient": "mesh-gradient 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-reverse": "float-reverse 7s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "heart-pulse": "heart-pulse 2s ease-in-out infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-romantic": "linear-gradient(135deg, hsl(var(--rose)) 0%, hsl(var(--peach)) 50%, hsl(var(--gold)) 100%)",
        "gradient-soft": "linear-gradient(180deg, hsl(var(--rose-light)) 0%, hsl(var(--background)) 100%)",
        "gradient-wedding": "linear-gradient(135deg, #F8E8E9 0%, #FAF9F6 50%, #F5D7DA 100%)",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #E8D5A3 100%)",
        "gradient-rose-cream": "linear-gradient(135deg, #E8B4B8 0%, #F5D7DA 50%, #FAF9F6 100%)",
        "gradient-mehendi": "linear-gradient(135deg, #FFFEF7 0%, #F5D7DA 30%, #FAF9F6 60%, #E8B4B8 100%)",
        "gradient-reception": "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
        "gradient-save-date": "linear-gradient(135deg, #E6D5F3 0%, #F0E6F7 50%, #FAF5FF 100%)",
        "gradient-travel-venue": "linear-gradient(135deg, #D4E8F0 0%, #E3F2F7 50%, #F0F8FA 100%)",
        "gradient-rsvp": "linear-gradient(135deg, #F5E6D3 0%, #FAF0E6 50%, #FFF8F0 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
