/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      boxShadow: {
        "ambient-purple": "0 0 40px 0 rgba(124, 58, 237, 0.08)",
        "glow-card": "0 8px 32px 0 rgba(124, 58, 237, 0.12)",
      },
      backdropBlur: {
        "glass": "24px"
      }
    },
    colors: {
      "on-tertiary-fixed": "#301400",
      "surface-container-lowest": "#070e1d",
      "primary-container": "#7c3aed",
      "on-secondary-fixed-variant": "#523787",
      "primary-fixed": "#eaddff",
      "on-tertiary": "#4f2500",
      "primary-fixed-dim": "#d2bbff",
      "inverse-on-surface": "#293040",
      "surface-tint": "#d2bbff",
      "tertiary-fixed": "#ffdcc6",
      "tertiary": "#ffb784",
      "surface-container-high": "#232a3a",
      "on-secondary-container": "#c3a6ff",
      "on-error": "#690005",
      "on-surface": "#dce2f7",
      "secondary-container": "#523787",
      "error-container": "#93000a",
      "primary": "#d2bbff",
      "surface": "#0c1322",
      "outline": "#958da1",
      "tertiary-fixed-dim": "#ffb784",
      "surface-container": "#191f2f",
      "on-primary-container": "#ede0ff",
      "outline-variant": "#4a4455",
      "secondary-fixed-dim": "#d2bbff",
      "on-background": "#dce2f7",
      "on-primary-fixed": "#25005a",
      "on-error-container": "#ffdad6",
      "on-primary-fixed-variant": "#5a00c6",
      "surface-dim": "#0c1322",
      "on-tertiary-fixed-variant": "#713700",
      "surface-bright": "#323949",
      "inverse-surface": "#dce2f7",
      "surface-variant": "#2e3545",
      "tertiary-container": "#a15100",
      "on-primary": "#3f008e",
      "error": "#ffb4ab",
      "inverse-primary": "#732ee4",
      "surface-container-low": "#141b2b",
      "on-secondary-fixed": "#25005a",
      "on-secondary": "#3b1e6f",
      "surface-container-highest": "#2e3545",
      "on-tertiary-container": "#ffe0cd",
      "secondary": "#d2bbff",
      "secondary-fixed": "#eaddff",
      "on-surface-variant": "#ccc3d8",
      "background": "#0c1322"
    },
    fontFamily: {
      "headline": ["Space Grotesk", "sans-serif"],
      "body": ["Inter", "sans-serif"],
      "label": ["JetBrains Mono", "monospace"],
      "mono": ["Fira Code", "monospace"]
    },
    borderRadius: {
      DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px"
    }
  }
}
