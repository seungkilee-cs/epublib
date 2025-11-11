import { Theme } from "@epub-reader/core";
import type { ThemeOverrides } from "./mergeTheme";

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryHover: string;
  text: string;
  textMuted: string;
  border: string;
  overlay: string;
  overlayText: string;
  shell: {
    background: string;
  };
  sidebar: {
    surface: string;
    border: string;
  };
  badge: {
    background: string;
    text: string;
  };
  control: {
    background: string;
    backgroundHover: string;
  };
};

export type SpacingTokens = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

export type RadiiTokens = {
  sm: string;
  md: string;
  lg: string;
  round: string;
};

export type TypographyTokens = {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  lineHeight: {
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
  };
};

export type ShadowTokens = {
  sm: string;
  md: string;
};

export type ReaderTheme = {
  colors: ColorTokens;
  spacing: SpacingTokens;
  radii: RadiiTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
};

export const colors: ColorTokens = {
  background: "#fdfdfd",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e2e8f0",
  overlay: "rgba(15, 23, 42, 0.6)",
  overlayText: "#ffffff",
  shell: {
    background: "#f1f5f9",
  },
  sidebar: {
    surface: "#ffffff",
    border: "rgba(148, 163, 184, 0.25)",
  },
  badge: {
    background: "rgba(37, 99, 235, 0.12)",
    text: "#1d4ed8",
  },
  control: {
    background: "rgba(255, 255, 255, 0.08)",
    backgroundHover: "rgba(255, 255, 255, 0.16)",
  },
};

export const spacing: SpacingTokens = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

export const radii: RadiiTokens = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  round: "9999px",
};

export const typography: TypographyTokens = {
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
};

export const shadows: ShadowTokens = {
  sm: "0 1px 2px 0 rgba(15, 23, 42, 0.08)",
  md: "0 4px 12px rgba(15, 23, 42, 0.12)",
};

export const baseTheme: ReaderTheme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
};

export const readerThemePresets: Record<Theme, ThemeOverrides> = {
  [Theme.LIGHT]: {},
  [Theme.DARK]: {
    colors: {
      background: "#0f172a",
      surface: "#111827",
      surfaceMuted: "#1e293b",
      primary: "#60a5fa",
      primaryHover: "#3b82f6",
      text: "#e2e8f0",
      textMuted: "#94a3b8",
      border: "rgba(148, 163, 184, 0.36)",
      overlay: "rgba(15, 23, 42, 0.7)",
      overlayText: "#f8fafc",
      shell: {
        background: "#0b1120",
      },
      sidebar: {
        surface: "#111827",
        border: "rgba(30, 41, 59, 0.7)",
      },
      badge: {
        background: "rgba(96, 165, 250, 0.16)",
        text: "#93c5fd",
      },
      control: {
        background: "rgba(148, 163, 184, 0.16)",
        backgroundHover: "rgba(148, 163, 184, 0.24)",
      },
    },
    shadows: {
      md: "0 18px 36px rgba(8, 11, 18, 0.45)",
    },
  },
  [Theme.SEPIA]: {
    colors: {
      background: "#fbf4e4",
      surface: "#f5e7cc",
      surfaceMuted: "#f0dfbc",
      primary: "#b45309",
      primaryHover: "#92400e",
      text: "#5b4636",
      textMuted: "#7c644e",
      border: "rgba(120, 90, 60, 0.35)",
      overlay: "rgba(96, 75, 54, 0.6)",
      overlayText: "#fff6e6",
      shell: {
        background: "#f2e8d5",
      },
      sidebar: {
        surface: "#f5e7cc",
        border: "rgba(120, 90, 60, 0.25)",
      },
      badge: {
        background: "rgba(228, 155, 15, 0.18)",
        text: "#b45309",
      },
      control: {
        background: "rgba(255, 245, 225, 0.45)",
        backgroundHover: "rgba(255, 240, 210, 0.68)",
      },
    },
    shadows: {
      md: "0 12px 28px rgba(91, 70, 54, 0.35)",
    },
  },
  [Theme.BLACK]: {
    colors: {
      background: "#000000",
      surface: "#050505",
      surfaceMuted: "#151515",
      primary: "#f97316",
      primaryHover: "#ea580c",
      text: "#f8fafc",
      textMuted: "#cbd5f5",
      border: "rgba(148, 163, 184, 0.28)",
      overlay: "rgba(15, 15, 15, 0.85)",
      overlayText: "#f8fafc",
      shell: {
        background: "#030712",
      },
      sidebar: {
        surface: "#0f172a",
        border: "rgba(30, 41, 59, 0.65)",
      },
      badge: {
        background: "rgba(249, 115, 22, 0.16)",
        text: "#fbd38d",
      },
      control: {
        background: "rgba(148, 163, 184, 0.16)",
        backgroundHover: "rgba(148, 163, 184, 0.28)",
      },
    },
    shadows: {
      md: "0 18px 36px rgba(3, 7, 18, 0.65)",
    },
  },
  [Theme.CUSTOM]: {},
};
