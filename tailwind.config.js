/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Configure dark mode to work with a class (e.g., <body class="dark">)
  darkMode: 'class',

  // 2. Configure which files Tailwind should scan for classes
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // Force generate these classes for testing
  safelist: [
    'bg-red-500',
    'text-white',
    'p-4',
    'm-2',
    'rounded-lg',
    'shadow-lg',
    'text-lg',
    'font-bold',
    'min-h-screen'
  ],

  // 3. Define all your design tokens here
  theme: {
    extend: {
      // 4. Colors: Extracted from your :root CSS variables
      colors: {
        // We define colors using HSL values for easy opacity modification
        // This makes your design system extremely flexible.
        // Usage: bg-neutral-100, text-red-50, border-blue-70/50 (with 50% opacity)
        neutral: {
          0: 'hsl(0 0% 100%)',
          5: 'hsl(0 0% 96%)',
          10: 'hsl(0 0% 93%)',
          20: 'hsl(0 0% 86%)',
          30: 'hsl(0 0% 76%)',
          40: 'hsl(0 0% 68%)',
          50: 'hsl(0 0% 53%)',
          60: 'hsl(0 0% 44%)',
          70: 'hsl(0 0% 36%)',
          80: 'hsl(0 0% 25%)',
          90: 'hsl(0 0% 15%)',
          95: 'hsl(0 0% 12%)',
          100: 'hsl(0 0% 8%)',
        },
        red: {
          50: 'hsl(0 86% 97%)',
          100: 'hsl(0 93% 94%)',
          200: 'hsl(0 96% 89%)',
          300: 'hsl(0 94% 82%)',
          400: 'hsl(0 91% 71%)',
          500: 'hsl(0 84% 60%)',
          600: 'hsl(0 72% 51%)',
          700: 'hsl(0 74% 42%)',
          800: 'hsl(0 70% 35%)',
          900: 'hsl(0 63% 31%)',
          950: 'hsl(0 75% 16%)',
        },
        green: {
          40: 'hsl(95 68% 52%)',
          60: 'hsl(103 79% 35%)',
          70: 'hsl(107 88% 26%)',
        },
        blue: {
          50: 'hsl(208 100% 53%)',
          60: 'hsl(212 100% 50%)',
          70: 'hsl(216 100% 50%)',
          80: 'hsl(222 100% 47%)',
        },
        
        // 5. Semantic Colors: These map to your .light and .dark theme variables.
        // This is a powerful abstraction. You'll use these in your components.
        // Usage: bg-background-primary, text-text-secondary, border-border-brand
        background: {
          primary: 'hsl(var(--background-primary))',
          secondary: 'hsl(var(--background-secondary))',
          tertiary: 'hsl(var(--background-tertiary))',
          inverse: 'hsl(var(--background-inverse))',
          brand: 'hsl(var(--background-brand))',
          'brand-hover': 'hsl(var(--background-brand-hover))',
          disabled: 'hsl(var(--background-disabled))',
          modal: 'hsl(var(--background-modal))',
        },
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          tertiary: 'hsl(var(--text-tertiary))',
          inverse: 'hsl(var(--text-inverse))',
          'on-brand': 'hsl(var(--text-on-brand))',
          disabled: 'hsl(var(--text-disabled))',
          link: {
             primary: 'hsl(var(--text-link-primary))',
             'primary-hover': 'hsl(var(--text-link-primary-hover))',
          }
        },
        border: {
          primary: 'hsl(var(--border-primary))',
          secondary: 'hsl(var(--border-secondary))',
          tertiary: 'hsl(var(--border-tertiary))',
          divider: 'hsl(var(--border-divider))',
          brand: 'hsl(var(--border-brand))',
          focus: 'hsl(var(--border-focus))',
        },
      },
      
      // 6. Fonts
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },

      // 7. Keyframes for Animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-out-to-left": "slide-out-to-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "slide-out-to-right": "slide-out-to-right 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};