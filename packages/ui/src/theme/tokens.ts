export const colors = {
  background: "#fdfdfd",
  surface: "#ffffff",
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  overlay: "rgba(15, 23, 42, 0.6)",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

export const radii = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  round: "9999px",
} as const;

export const typography = {
  fontFamily: "'Inter', system-ui",
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.5rem",
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgba(15, 23, 42, 0.08)",
  md: "0 4px 12px rgba(15, 23, 42, 0.12)",
} as const;

export const baseTheme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
} as const;

export type ReaderTheme = typeof baseTheme;
