/** @type {import('tailwindcss').Config} */

/*bg-primary
bg-accent
bg-accent-hover
border-border
ring-primary
text-text-label
bg-warning-bg
border-warning-border
text-warning-text

OPACITY
bg-primary/40
text-muted/60
ring-accent/50
*/
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        primary: "hsl(var(--color-primary) / <alpha-value>)",
        secondary: "hsl(var(--color-secondary) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        "accent-hover": "hsl(var(--color-accent-hover) / <alpha-value>)",
        background: "hsl(var(--color-background) / <alpha-value>)",
        surface: "hsl(var(--color-surface) / <alpha-value>)",

        // Text
        text: "hsl(var(--color-text) / <alpha-value>)",
        "text-label": "hsl(var(--color-text-label) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",

        white: "hsl(var(--color-white) / <alpha-value>)",

        // Status + feedback
        success: "hsl(var(--color-success) / <alpha-value>)",
        danger: "hsl(var(--color-danger) / <alpha-value>)",
        "error-hover": "hsl(var(--color-error-hover) / <alpha-value>)",

        // Warning set
        "warning-bg": "hsl(var(--color-warningbg) / <alpha-value>)",
        "warning-border": "hsl(var(--color-warningborder) / <alpha-value>)",
        "warning-text": "hsl(var(--color-warningtext) / <alpha-value>)",

        // Borders / utility
        border: "hsl(var(--color-border) / <alpha-value>)",

        // Other theme colors
        purple: "hsl(var(--color-purple) / <alpha-value>)",
      },

      ringColor: {
        primary: "hsl(var(--color-primary) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        DEFAULT: "var(--radius-default)",
      },

      fontFamily: {
        body: "var(--font-family-body)",
        heading: "var(--font-family-heading)",
        main: "var(--font-family-main)",
      },

      fontSize: {
        title: "var(--font-size-title)",
        subtitle: "var(--font-size-subtitle)",
        small: "var(--font-size-small)",
        medium: "var(--font-size-medium)",
        large: "var(--font-size-large)",
        xlarge: "var(--font-size-xlarge)",
        body: "var(--font-size-body)",
        input: "var(--font-size-input)",
        label: "var(--font-size-label)",
        button: "var(--font-size-button)",
      },
    },
  },
  plugins: [],
};
