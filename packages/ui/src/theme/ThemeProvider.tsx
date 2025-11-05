import {
  CSSProperties,
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";
import styles from "./ThemeProvider.module.css";
import { baseTheme, ReaderTheme } from "./tokens";
import { mergeTheme, ThemeOverrides } from "./mergeTheme";
import { themeToCssVariables } from "./themeToCssVariables";

type ThemeProviderProps = PropsWithChildren<{
  theme?: ThemeOverrides;
  className?: string;
  style?: CSSProperties;
}>;

const ThemeContext = createContext<ReaderTheme>(baseTheme);

export function ThemeProvider({
  theme,
  children,
  className,
  style,
}: ThemeProviderProps) {
  const mergedTheme = useMemo(
    () => mergeTheme(baseTheme, theme),
    [theme]
  );

  const cssVariables = useMemo(
    () => themeToCssVariables(mergedTheme),
    [mergedTheme]
  );

  const combinedStyle = useMemo(
    () => ({
      ...cssVariables,
      ...style,
    }) as CSSProperties,
    [cssVariables, style]
  );

  const classes = className
    ? `${styles.themeRoot} ${className}`
    : styles.themeRoot;

  return (
    <ThemeContext.Provider value={mergedTheme}>
      <div className={classes} style={combinedStyle}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ReaderTheme {
  return useContext(ThemeContext);
}

export { ReaderTheme };
