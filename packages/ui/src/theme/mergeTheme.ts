import { ReaderTheme } from "./tokens";

export type ThemeOverrides = Partial<{
  colors: Partial<ReaderTheme["colors"]>;
  spacing: Partial<ReaderTheme["spacing"]>;
  radii: Partial<ReaderTheme["radii"]>;
  typography: Partial<ReaderTheme["typography"]> & {
    fontSize?: Partial<ReaderTheme["typography"]["fontSize"]>;
    lineHeight?: Partial<ReaderTheme["typography"]["lineHeight"]>;
  };
  shadows: Partial<ReaderTheme["shadows"]>;
}>;

function mergeNested<T extends Record<string, unknown>>(
  base: T,
  overrides?: Partial<T>
): T {
  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
  };
}

export function mergeTheme(
  base: ReaderTheme,
  overrides?: ThemeOverrides
): ReaderTheme {
  if (!overrides) {
    return base;
  }

  const fontSizeOverrides = overrides.typography?.fontSize;
  const lineHeightOverrides = overrides.typography?.lineHeight;

  const typographyOverrides = overrides.typography
    ? {
        ...overrides.typography,
        fontSize: mergeNested(base.typography.fontSize, fontSizeOverrides),
        lineHeight: mergeNested(base.typography.lineHeight, lineHeightOverrides),
      }
    : undefined;

  return {
    colors: mergeNested(base.colors, overrides.colors),
    spacing: mergeNested(base.spacing, overrides.spacing),
    radii: mergeNested(base.radii, overrides.radii),
    typography: mergeNested(base.typography, typographyOverrides),
    shadows: mergeNested(base.shadows, overrides.shadows),
  };
}
