import { ButtonHTMLAttributes } from "react";
import styles from "./ReaderView.module.css";

type ControlButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

export type NavigationControlsProps = {
  onNext: () => void;
  onPrev: () => void;
  disableNext?: boolean;
  disablePrev?: boolean;
  className?: string;
  nextButtonProps?: ControlButtonProps;
  prevButtonProps?: ControlButtonProps;
  nextLabel?: string;
  prevLabel?: string;
};

const DEFAULT_PREV_LABEL = "← Previous";
const DEFAULT_NEXT_LABEL = "Next →";

function getAriaLabel(
  props: ControlButtonProps | undefined,
  fallback: string
): string {
  if (!props) {
    return fallback;
  }
  const ariaLabel = props["aria-label"];
  if (ariaLabel && typeof ariaLabel === "string") {
    return ariaLabel;
  }
  return fallback;
}

export function NavigationControls({
  onNext,
  onPrev,
  disableNext,
  disablePrev,
  className,
  nextButtonProps,
  prevButtonProps,
  nextLabel = DEFAULT_NEXT_LABEL,
  prevLabel = DEFAULT_PREV_LABEL,
}: NavigationControlsProps) {
  const rootClassName = className
    ? `${styles.controls} ${className}`
    : styles.controls;

  const { children: prevChildren, ...prevRest } = prevButtonProps ?? {};
  const { children: nextChildren, ...nextRest } = nextButtonProps ?? {};

  return (
    <div className={rootClassName} role="group" aria-label="Reader navigation">
      <button
        type="button"
        className={styles.controlButton}
        onClick={onPrev}
        disabled={disablePrev}
        aria-keyshortcuts="ArrowLeft Shift+Space"
        {...prevRest}
        aria-label={getAriaLabel(prevButtonProps, prevLabel)}
        title={prevRest.title}
      >
        {prevChildren ?? prevLabel}
      </button>
      <button
        type="button"
        className={styles.controlButton}
        onClick={onNext}
        disabled={disableNext}
        aria-keyshortcuts="ArrowRight Space"
        {...nextRest}
        aria-label={getAriaLabel(nextButtonProps, nextLabel)}
        title={nextRest.title}
      >
        {nextChildren ?? nextLabel}
      </button>
    </div>
  );
}
