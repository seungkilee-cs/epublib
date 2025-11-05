// src/theme/tokens.ts
var colors = {
  background: "#fdfdfd",
  surface: "#ffffff",
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  overlay: "rgba(15, 23, 42, 0.6)"
};
var spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem"
};
var radii = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  round: "9999px"
};
var typography = {
  fontFamily: "'Inter', system-ui",
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.5rem"
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625
  }
};
var shadows = {
  sm: "0 1px 2px 0 rgba(15, 23, 42, 0.08)",
  md: "0 4px 12px rgba(15, 23, 42, 0.12)"
};
var baseTheme = {
  colors,
  spacing,
  radii,
  typography,
  shadows
};

// src/theme/ThemeProvider.tsx
import {
  createContext,
  useContext,
  useMemo
} from "react";

// src/theme/ThemeProvider.module.css
var ThemeProvider_default = {};

// src/theme/mergeTheme.ts
function mergeNested(base, overrides) {
  if (!overrides) {
    return base;
  }
  return {
    ...base,
    ...overrides
  };
}
function mergeTheme(base, overrides) {
  if (!overrides) {
    return base;
  }
  const fontSizeOverrides = overrides.typography?.fontSize;
  const lineHeightOverrides = overrides.typography?.lineHeight;
  const typographyOverrides = overrides.typography ? {
    ...overrides.typography,
    fontSize: mergeNested(base.typography.fontSize, fontSizeOverrides),
    lineHeight: mergeNested(base.typography.lineHeight, lineHeightOverrides)
  } : void 0;
  return {
    colors: mergeNested(base.colors, overrides.colors),
    spacing: mergeNested(base.spacing, overrides.spacing),
    radii: mergeNested(base.radii, overrides.radii),
    typography: mergeNested(base.typography, typographyOverrides),
    shadows: mergeNested(base.shadows, overrides.shadows)
  };
}

// src/theme/themeToCssVariables.ts
var PREFIX = "--reader";
function flattenTheme(prefix, value, result) {
  if (value === null || value === void 0) {
    return;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    Object.entries(value).forEach(([key, nested]) => {
      flattenTheme(`${prefix}-${key}`, nested, result);
    });
    return;
  }
  result[prefix] = String(value);
}
function themeToCssVariables(theme) {
  const variables = {};
  flattenTheme(`${PREFIX}-color`, theme.colors, variables);
  flattenTheme(`${PREFIX}-spacing`, theme.spacing, variables);
  flattenTheme(`${PREFIX}-radius`, theme.radii, variables);
  flattenTheme(`${PREFIX}-typography-font-size`, theme.typography.fontSize, variables);
  flattenTheme(
    `${PREFIX}-typography-line-height`,
    theme.typography.lineHeight,
    variables
  );
  if (theme.typography.fontFamily) {
    variables[`${PREFIX}-typography-font-family`] = theme.typography.fontFamily;
  }
  flattenTheme(`${PREFIX}-shadow`, theme.shadows, variables);
  return variables;
}

// src/theme/ThemeProvider.tsx
import { jsx } from "react/jsx-runtime";
var ThemeContext = createContext(baseTheme);
function ThemeProvider({
  theme,
  children,
  className,
  style
}) {
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
      ...style
    }),
    [cssVariables, style]
  );
  const classes = className ? `${ThemeProvider_default.themeRoot} ${className}` : ThemeProvider_default.themeRoot;
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: mergedTheme, children: /* @__PURE__ */ jsx("div", { className: classes, style: combinedStyle, children }) });
}
function useTheme() {
  return useContext(ThemeContext);
}

// src/reader/ReaderView.tsx
import {
  useCallback,
  useEffect,
  useMemo as useMemo2,
  useRef,
  useState
} from "react";

// src/reader/ReaderView.module.css
var ReaderView_default = {};

// src/reader/NavigationControls.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var DEFAULT_PREV_LABEL = "\u2190 Previous";
var DEFAULT_NEXT_LABEL = "Next \u2192";
function getAriaLabel(props, fallback) {
  if (!props) {
    return fallback;
  }
  const ariaLabel = props["aria-label"];
  if (ariaLabel && typeof ariaLabel === "string") {
    return ariaLabel;
  }
  return fallback;
}
function NavigationControls({
  onNext,
  onPrev,
  disableNext,
  disablePrev,
  className,
  nextButtonProps,
  prevButtonProps,
  nextLabel = DEFAULT_NEXT_LABEL,
  prevLabel = DEFAULT_PREV_LABEL
}) {
  const rootClassName = className ? `${ReaderView_default.controls} ${className}` : ReaderView_default.controls;
  const { children: prevChildren, ...prevRest } = prevButtonProps ?? {};
  const { children: nextChildren, ...nextRest } = nextButtonProps ?? {};
  return /* @__PURE__ */ jsxs("div", { className: rootClassName, role: "group", "aria-label": "Reader navigation", children: [
    /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        className: ReaderView_default.controlButton,
        onClick: onPrev,
        disabled: disablePrev,
        "aria-keyshortcuts": "ArrowLeft Shift+Space",
        ...prevRest,
        "aria-label": getAriaLabel(prevButtonProps, prevLabel),
        title: prevRest.title,
        children: prevChildren ?? prevLabel
      }
    ),
    /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        className: ReaderView_default.controlButton,
        onClick: onNext,
        disabled: disableNext,
        "aria-keyshortcuts": "ArrowRight Space",
        ...nextRest,
        "aria-label": getAriaLabel(nextButtonProps, nextLabel),
        title: nextRest.title,
        children: nextChildren ?? nextLabel
      }
    )
  ] });
}

// src/reader/ReaderView.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var INTERACTIVE_TAGS = /* @__PURE__ */ new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);
function toError(error) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "Unknown error");
}
function toArrayBuffer(source) {
  if (source instanceof ArrayBuffer) {
    return source;
  }
  if (typeof SharedArrayBuffer !== "undefined" && source instanceof SharedArrayBuffer) {
    const copy = new Uint8Array(source.byteLength);
    copy.set(new Uint8Array(source));
    return copy.buffer;
  }
  if (ArrayBuffer.isView(source)) {
    const view = source;
    const { buffer, byteOffset, byteLength } = view;
    if (typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer) {
      const copy = new Uint8Array(byteLength);
      copy.set(new Uint8Array(buffer, byteOffset, byteLength));
      return copy.buffer;
    }
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  throw new Error("Unsupported book data type");
}
function ReaderView({
  service,
  bookData,
  className,
  style,
  flow = "paginated",
  initialLocation,
  onLocationChange,
  onReady,
  onError,
  statusFormatter,
  controlsOverrides,
  enableKeyboardShortcuts = true,
  enableTouchGestures = true
}) {
  const containerRef = useRef(null);
  const lastInitialLocationRef = useRef(void 0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const pendingGestureRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(
    null
  );
  useEffect(() => {
    let cancelled = false;
    async function loadAndRender() {
      if (!containerRef.current) {
        return;
      }
      setIsLoading(true);
      setIsReady(false);
      setCurrentLocation(null);
      setError(null);
      try {
        await service.destroy().catch(() => void 0);
        const buffer = toArrayBuffer(bookData);
        await service.loadBook(buffer);
        if (cancelled || !containerRef.current) {
          return;
        }
        await service.renderTo(containerRef.current, {
          flow,
          restoreLocation: initialLocation
        });
        if (cancelled) {
          return;
        }
        lastInitialLocationRef.current = initialLocation;
        setIsReady(true);
        setIsLoading(false);
        onReady?.();
        const location = service.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          onLocationChange?.(location);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const normalized = toError(err);
        setError(normalized.message);
        setIsLoading(false);
        setIsReady(false);
        onError?.(normalized);
      }
    }
    void loadAndRender();
    return () => {
      cancelled = true;
      void service.destroy().catch(() => void 0);
    };
  }, [bookData, flow, initialLocation, onLocationChange, onReady, onError, service]);
  useEffect(() => {
    if (!isReady) {
      return;
    }
    const handleRelocated = () => {
      const location = service.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        onLocationChange?.(location);
      }
      setIsNavigating(false);
    };
    const handleRendered = () => {
      handleRelocated();
    };
    service.on("relocated", handleRelocated);
    service.on("rendered", handleRendered);
    const handleResize = () => {
      const rendition = service.getRendition();
      const element = containerRef.current;
      if (rendition && element) {
        rendition.resize(element.clientWidth, element.clientHeight);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      service.off("relocated", handleRelocated);
      service.off("rendered", handleRendered);
      window.removeEventListener("resize", handleResize);
    };
  }, [isReady, onLocationChange, service]);
  useEffect(() => {
    if (!isReady || !initialLocation) {
      return;
    }
    if (lastInitialLocationRef.current === initialLocation) {
      return;
    }
    lastInitialLocationRef.current = initialLocation;
    service.goTo(initialLocation).catch((err) => {
      const normalized = toError(err);
      setError(normalized.message);
      onError?.(normalized);
    });
  }, [initialLocation, isReady, onError, service]);
  const handleNext = useCallback(async () => {
    if (!isReady || isNavigating) {
      return;
    }
    setIsNavigating(true);
    try {
      await service.nextPage();
    } catch (err) {
      const normalized = toError(err);
      setError(normalized.message);
      setIsNavigating(false);
      onError?.(normalized);
    }
  }, [isNavigating, isReady, onError, service]);
  const handlePrev = useCallback(async () => {
    if (!isReady || isNavigating) {
      return;
    }
    setIsNavigating(true);
    try {
      await service.prevPage();
    } catch (err) {
      const normalized = toError(err);
      setError(normalized.message);
      setIsNavigating(false);
      onError?.(normalized);
    }
  }, [isNavigating, isReady, onError, service]);
  useEffect(() => {
    if (!isReady || !enableKeyboardShortcuts) {
      return;
    }
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }
      const activeElement = document.activeElement;
      if (activeElement && INTERACTIVE_TAGS.has(activeElement.tagName)) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        void handleNext();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        void handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableKeyboardShortcuts, handleNext, handlePrev, isReady]);
  const statusText = useMemo2(() => {
    const status = {
      location: currentLocation,
      isLoading,
      error
    };
    if (statusFormatter) {
      const formatted = statusFormatter(status);
      if (formatted != null) {
        return formatted;
      }
    }
    if (error) {
      return `Error: ${error}`;
    }
    if (isLoading) {
      return "Loading\u2026";
    }
    if (!currentLocation) {
      return "Locating\u2026";
    }
    if (currentLocation.totalPages > 0 && currentLocation.page > 0) {
      return `Page ${currentLocation.page} / ${currentLocation.totalPages}`;
    }
    const progress = Math.round((currentLocation.percentage ?? 0) * 100);
    return `Progress ${progress}%`;
  }, [currentLocation, error, isLoading, statusFormatter]);
  const atDocumentStart = useMemo2(() => {
    if (!currentLocation) {
      return true;
    }
    if (currentLocation.totalPages > 0 && currentLocation.page > 0) {
      return currentLocation.page <= 1;
    }
    return currentLocation.percentage <= 0;
  }, [currentLocation]);
  const atDocumentEnd = useMemo2(() => {
    if (!currentLocation) {
      return true;
    }
    if (currentLocation.totalPages > 0 && currentLocation.page > 0) {
      return currentLocation.page >= currentLocation.totalPages;
    }
    return currentLocation.percentage >= 0.999;
  }, [currentLocation]);
  const disablePrev = !isReady || isLoading || isNavigating || atDocumentStart;
  const disableNext = !isReady || isLoading || isNavigating || atDocumentEnd;
  const rootClassName = className ? `${ReaderView_default.root} ${className}` : ReaderView_default.root;
  const onTouchStart = useCallback(
    (event) => {
      if (!enableTouchGestures || !isReady) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
      pendingGestureRef.current = null;
    },
    [enableTouchGestures, isReady]
  );
  const onTouchMove = useCallback(
    (event) => {
      if (!enableTouchGestures || !isReady) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      if (touchStartXRef.current == null || touchStartYRef.current == null) {
        return;
      }
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        pendingGestureRef.current = null;
        return;
      }
      const threshold = 40;
      if (deltaX > threshold) {
        pendingGestureRef.current = "prev";
      } else if (deltaX < -threshold) {
        pendingGestureRef.current = "next";
      } else {
        pendingGestureRef.current = null;
      }
    },
    [enableTouchGestures, isReady]
  );
  const onTouchEnd = useCallback(
    () => {
      if (!enableTouchGestures || !isReady) {
        return;
      }
      const action = pendingGestureRef.current;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      pendingGestureRef.current = null;
      if (action === "next") {
        void handleNext();
      } else if (action === "prev") {
        void handlePrev();
      }
    },
    [enableTouchGestures, handleNext, handlePrev, isReady]
  );
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className: rootClassName,
      style,
      "aria-busy": isLoading,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
      children: [
        /* @__PURE__ */ jsx3("div", { ref: containerRef, className: ReaderView_default.canvas }),
        /* @__PURE__ */ jsx3(
          NavigationControls,
          {
            onNext: handleNext,
            onPrev: handlePrev,
            disableNext,
            disablePrev,
            ...controlsOverrides
          }
        ),
        statusText ? /* @__PURE__ */ jsx3("div", { className: ReaderView_default.statusBadge, role: "status", "aria-live": "polite", children: statusText }) : null
      ]
    }
  );
}
export {
  NavigationControls,
  ReaderView,
  ThemeProvider,
  baseTheme,
  colors,
  radii,
  shadows,
  spacing,
  typography,
  useTheme
};
