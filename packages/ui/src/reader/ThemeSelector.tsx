import { Theme } from "@epub-reader/core";
import styles from "./ThemeSelector.module.css";

export type ThemeSelectorProps = {
  value: Theme;
  onChange: (theme: Theme) => void;
  className?: string;
  disabled?: boolean;
};

const THEME_OPTIONS: { value: Theme; label: string; description: string }[] = [
  { value: Theme.LIGHT, label: "Light", description: "Bright background" },
  { value: Theme.DARK, label: "Dark", description: "Deep blues" },
  { value: Theme.SEPIA, label: "Sepia", description: "Warm parchment" },
  { value: Theme.BLACK, label: "Black", description: "High contrast" },
];

const SWATCH_CLASS: Record<Theme, string> = {
  [Theme.LIGHT]: styles.light,
  [Theme.DARK]: styles.dark,
  [Theme.SEPIA]: styles.sepia,
  [Theme.BLACK]: styles.black,
  [Theme.CUSTOM]: styles.light,
};

export function ThemeSelector({ value, onChange, className, disabled }: ThemeSelectorProps) {
  const classes = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={classes} role="toolbar" aria-label="Theme selector">
      {THEME_OPTIONS.map((option) => {
        const isActive = option.value === value;
        const optionClassName = [styles.option, isActive ? styles.optionActive : ""].filter(Boolean).join(" ");
        return (
          <button
            key={option.value}
            type="button"
            className={optionClassName}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            disabled={disabled}
          >
            <span className={`${styles.swatch} ${SWATCH_CLASS[option.value]}`.trim()} aria-hidden="true" />
            <span className={styles.label}>{option.label}</span>
            <span className={styles.description}>{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
