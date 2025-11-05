import {
  CSSProperties,
  TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LocationInfo } from "@epub-reader/core";
import {
  EPUBService,
  type EPUBServiceOptions,
} from "@epub-reader/core";
import styles from "./ReaderView.module.css";
import {
  NavigationControls,
  type NavigationControlsProps,
} from "./NavigationControls";

export type ReaderViewStatus = {
  location: LocationInfo | null;
  isLoading: boolean;
  error: string | null;
};

type BookBinarySource = ArrayBuffer | SharedArrayBuffer | ArrayBufferView;

type ControlsOverrides = Partial<
  Omit<
    NavigationControlsProps,
    "onNext" | "onPrev" | "disableNext" | "disablePrev"
  >
>;

const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

export type ReaderViewProps = {
  service: EPUBService;
  bookData: BookBinarySource;
  className?: string;
  style?: CSSProperties;
  flow?: EPUBServiceOptions["flow"];
  initialLocation?: string;
  onLocationChange?: (location: LocationInfo) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
  statusFormatter?: (status: ReaderViewStatus) => string | null;
  controlsOverrides?: ControlsOverrides;
  enableKeyboardShortcuts?: boolean;
  enableTouchGestures?: boolean;
};

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "Unknown error");
}

function toArrayBuffer(source: BookBinarySource): ArrayBuffer {
  if (source instanceof ArrayBuffer) {
    return source;
  }

  if (
    typeof SharedArrayBuffer !== "undefined" &&
    source instanceof SharedArrayBuffer
  ) {
    const copy = new Uint8Array(source.byteLength);
    copy.set(new Uint8Array(source));
    return copy.buffer;
  }

  if (ArrayBuffer.isView(source)) {
    const view = source as ArrayBufferView;
    const { buffer, byteOffset, byteLength } = view;
    if (typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer) {
      const copy = new Uint8Array(byteLength);
      copy.set(new Uint8Array(buffer, byteOffset, byteLength));
      return copy.buffer;
    }

    return (buffer as ArrayBuffer).slice(byteOffset, byteOffset + byteLength);
  }

  throw new Error("Unsupported book data type");
}

export function ReaderView({
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
  enableTouchGestures = true,
}: ReaderViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastInitialLocationRef = useRef<string | undefined>(undefined);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const pendingGestureRef = useRef<"prev" | "next" | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(
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
        await service.destroy().catch(() => undefined);

        const buffer = toArrayBuffer(bookData);
        await service.loadBook(buffer);

        if (cancelled || !containerRef.current) {
          return;
        }

        await service.renderTo(containerRef.current, {
          flow,
          restoreLocation: initialLocation,
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
      void service.destroy().catch(() => undefined);
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
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

  const statusText = useMemo(() => {
    const status: ReaderViewStatus = {
      location: currentLocation,
      isLoading,
      error,
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
      return "Loading…";
    }

    if (!currentLocation) {
      return "Locating…";
    }

    if (currentLocation.totalPages > 0 && currentLocation.page > 0) {
      return `Page ${currentLocation.page} / ${currentLocation.totalPages}`;
    }

    const progress = Math.round((currentLocation.percentage ?? 0) * 100);
    return `Progress ${progress}%`;
  }, [currentLocation, error, isLoading, statusFormatter]);

  const atDocumentStart = useMemo(() => {
    if (!currentLocation) {
      return true;
    }

    if (currentLocation.totalPages > 0 && currentLocation.page > 0) {
      return currentLocation.page <= 1;
    }

    return currentLocation.percentage <= 0;
  }, [currentLocation]);

  const atDocumentEnd = useMemo(() => {
    if (!currentLocation) {
      return true;
    }

    if (currentLocation.totalPages > 0 && currentLocation.page > 0) {
      return currentLocation.page >= currentLocation.totalPages;
    }

    return currentLocation.percentage >= 0.999;
  }, [currentLocation]);

  const disablePrev =
    !isReady || isLoading || isNavigating || atDocumentStart;
  const disableNext = !isReady || isLoading || isNavigating || atDocumentEnd;

  const rootClassName = className
    ? `${styles.root} ${className}`
    : styles.root;

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
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
    (event: TouchEvent<HTMLDivElement>) => {
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

  return (
    <div
      className={rootClassName}
      style={style}
      aria-busy={isLoading}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div ref={containerRef} className={styles.canvas} />

      <NavigationControls
        onNext={handleNext}
        onPrev={handlePrev}
        disableNext={disableNext}
        disablePrev={disablePrev}
        {...controlsOverrides}
      />

      {statusText ? (
        <div className={styles.statusBadge} role="status" aria-live="polite">
          {statusText}
        </div>
      ) : null}
    </div>
  );
}
