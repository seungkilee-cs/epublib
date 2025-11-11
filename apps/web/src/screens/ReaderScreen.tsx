import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReaderView,
  TableOfContents,
  ThemeProvider,
  ThemeSelector,
  readerThemePresets,
} from "@epub-reader/ui";
import type { LocationInfo, ReadingProgress, TocItem, Settings, SettingsUpdate } from "@epub-reader/core";
import { Theme, TextAlign, ViewMode } from "@epub-reader/core";
import {
  initializeServices,
  createEPUBService,
  progressService,
  bookService,
  fileAdapter,
  settingsService,
} from "../services/appServices";

const SAMPLE_BOOK_ID = "sample-alice";
const SAMPLE_BOOK_TITLE = "Alice in Wonderland (Sample)";
const SAMPLE_BOOK_URL =
  "https://raw.githubusercontent.com/benoitvallon/sample-epub/master/Alice%20in%20Wonderland.epub";

const FONT_FAMILY_OPTIONS: { label: string; value: string }[] = [
  { label: "Inter", value: "'Inter', system-ui" },
  { label: "Merriweather", value: "'Merriweather', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Open Sans", value: "'Open Sans', system-ui" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
];

const TEXT_ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: TextAlign.LEFT, label: "Left" },
  { value: TextAlign.JUSTIFY, label: "Justify" },
  { value: TextAlign.CENTER, label: "Center" },
  { value: TextAlign.RIGHT, label: "Right" },
];

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; description: string }[] = [
  { value: ViewMode.PAGINATED, label: "Paginated", description: "Traditional page turns" },
  { value: ViewMode.CONTINUOUS, label: "Continuous", description: "Scroll vertically" },
];

const SPREAD_MODE_OPTIONS: { value: ViewMode; label: string; description: string }[] = [
  { value: ViewMode.SINGLE_PAGE, label: "Single page", description: "One page at a time" },
  { value: ViewMode.TWO_PAGE, label: "Two page", description: "Facing page spread" },
];

export function ReaderScreen(): JSX.Element {
  const [bookData, setBookData] = useState<ArrayBuffer | null>(null);
  const [bookId, setBookId] = useState<string>(SAMPLE_BOOK_ID);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [initialLocation, setInitialLocation] = useState<string | undefined>(undefined);
  const [tableOfContents, setTableOfContents] = useState<TocItem[]>([]);
  const [currentChapterHref, setCurrentChapterHref] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isReaderReady, setIsReaderReady] = useState<boolean>(false);

  const readerService = useMemo(() => createEPUBService(), []);
  const { bookId: routeBookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setIsReaderReady(false);

      try {
        await initializeServices();

        const userSettings = await settingsService.getSettings();
        if (cancelled) {
          return;
        }
        setSettings(userSettings);

        const targetBookId = routeBookId ?? SAMPLE_BOOK_ID;

        if (routeBookId) {
          const [storedBook, storedFile, existingProgress] = await Promise.all([
            bookService.getBook(targetBookId),
            bookService.getBookFile(targetBookId),
            progressService.getProgress(targetBookId),
          ]);

          if (cancelled) {
            return;
          }

          if (!storedBook) {
            throw new Error("Book not found in library");
          }
          if (!storedFile) {
            throw new Error("Book file is missing or corrupted");
          }

          setBookId(targetBookId);
          setBookData(storedFile);
          setProgress(existingProgress ?? null);
          setInitialLocation(existingProgress?.cfi ?? undefined);
          setCurrentChapterHref(existingProgress?.currentChapter ?? null);
          return;
        }

        const existingProgress = await progressService.getProgress(SAMPLE_BOOK_ID);
        if (cancelled) {
          return;
        }
        setProgress(existingProgress ?? null);
        setInitialLocation(existingProgress?.cfi ?? undefined);
        setCurrentChapterHref(existingProgress?.currentChapter ?? null);

        const response = await fetch(SAMPLE_BOOK_URL);
        if (!response.ok) {
          throw new Error(`Sample fetch failed (${response.status})`);
        }
        const buffer = await response.arrayBuffer();
        if (cancelled) {
          return;
        }

        setBookId(SAMPLE_BOOK_ID);
        setBookData(buffer);
        setError(null);

        const existingBook = await bookService.getBook(SAMPLE_BOOK_ID);
        if (!existingBook) {
          await bookService.addBook(
            buffer,
            {
              id: SAMPLE_BOOK_ID,
              title: SAMPLE_BOOK_TITLE,
              author: "Lewis Carroll",
            },
            { createPlaceholderCover: true }
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [routeBookId]);

  const handleProgress = useCallback((nextProgress: ReadingProgress) => {
    setProgress(nextProgress);
    setInitialLocation(nextProgress.cfi);
    setCurrentChapterHref(nextProgress.currentChapter ?? null);
  }, []);

  const handleOpenLocal = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await initializeServices();
      const file = await fileAdapter.openFile({ accept: [".epub"] });

      const localBookId = crypto.randomUUID?.() ?? `local-${Date.now()}`;
      await bookService.addBook(
        file.data,
        {
          id: localBookId,
          title: file.name,
        },
        { createPlaceholderCover: true }
      );

      const existingProgress = await progressService.getProgress(localBookId);

      setBookId(localBookId);
      setBookData(file.data);
      setProgress(existingProgress ?? null);
      setInitialLocation(existingProgress?.cfi ?? undefined);
      setCurrentChapterHref(existingProgress?.currentChapter ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReturnToLibrary = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleLocationChange = useCallback((location: LocationInfo) => {
    setCurrentChapterHref(location.chapterHref ?? location.chapter ?? null);
  }, []);

  const handleTableOfContentsChange = useCallback((items: TocItem[]) => {
    setTableOfContents(items);
  }, []);

  const handleNavigateToChapter = useCallback(
    (href: string) => {
      void readerService
        .goToHref(href)
        .catch((err) => setError((err as Error).message ?? "Failed to navigate to chapter"));
    },
    [readerService]
  );

  const isTableOfContentsLoading = (isLoading && !tableOfContents.length) || (!bookData && isLoading);

  const currentTheme = settings?.theme ?? Theme.LIGHT;

  const themeOverrides = useMemo(() => readerThemePresets[currentTheme] ?? {}, [currentTheme]);

  const handleReaderReady = useCallback(() => {
    setIsReaderReady(true);
  }, []);

  const handleReaderError = useCallback((readerError: Error) => {
    setError(readerError.message);
  }, []);

  const handleSettingsUpdate = useCallback(async (update: SettingsUpdate) => {
    const { customTheme, margins, ...rest } = update;

    setSettings((prev) => {
      if (!prev) {
        return prev;
      }

      const draft: Settings = {
        ...prev,
        ...rest,
        margins: margins ? { ...prev.margins, ...margins } : prev.margins,
      };

      if (customTheme === null) {
        draft.customTheme = undefined;
      } else if (typeof customTheme !== "undefined") {
        draft.customTheme = customTheme;
      }

      return draft;
    });

    try {
      const updated = await settingsService.updateSettings(update);
      setSettings(updated);
      setError(null);
    } catch (err) {
      setError((err as Error).message ?? "Failed to update settings");
      try {
        const latest = await settingsService.getSettings();
        setSettings(latest);
      } catch (loadErr) {
        setError((loadErr as Error).message ?? "Failed to reload settings");
      }
    }
  }, []);

  const handleThemeChange = useCallback(
    (nextTheme: Theme) => {
      void handleSettingsUpdate({ theme: nextTheme });
    },
    [handleSettingsUpdate]
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      const update: SettingsUpdate = { viewMode: mode };
      if (mode === ViewMode.CONTINUOUS) {
        update.spreadMode = ViewMode.SINGLE_PAGE;
        update.defaultPageSpread = "single";
      }
      void handleSettingsUpdate(update);
    },
    [handleSettingsUpdate]
  );

  const handleSpreadModeChange = useCallback(
    (mode: ViewMode) => {
      void handleSettingsUpdate({
        spreadMode: mode,
        defaultPageSpread: mode === ViewMode.TWO_PAGE ? "double" : "single",
      });
    },
    [handleSettingsUpdate]
  );

  const readerSettingsSignature = useMemo(() => {
    if (!settings) {
      return null;
    }
    return JSON.stringify({
      theme: settings.theme,
      customTheme: settings.customTheme,
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      letterSpacing: settings.letterSpacing,
      textAlign: settings.textAlign,
      viewMode: settings.viewMode,
      spreadMode: settings.spreadMode,
    });
  }, [settings]);

  useEffect(() => {
    if (!isReaderReady || !settings || !readerSettingsSignature) {
      return;
    }

    void settingsService
      .applyToEPUB(readerService, { settings })
      .catch((err) => setError((err as Error).message ?? "Failed to apply theme to reader"));
  }, [isReaderReady, readerService, settings, readerSettingsSignature]);

  if (error) {
    return (
      <div role="alert" style={{ padding: "2rem" }}>
        Failed to load EPUB: {error}
        <div>
          <button type="button" onClick={handleOpenLocal} style={{ marginTop: "1rem" }}>
            Open local EPUB…
          </button>
          <button
            type="button"
            onClick={handleReturnToLibrary}
            style={{ marginTop: "1rem", marginLeft: "0.75rem" }}
          >
            Back to library
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !bookData) {
    return <div style={{ padding: "2rem" }}>Loading sample book…</div>;
  }

  if (!bookData) {
    return (
      <div style={{ padding: "2rem" }}>
        No book loaded. Select an EPUB to begin.
        <div>
          <button type="button" onClick={handleOpenLocal} style={{ marginTop: "1rem" }}>
            Open local EPUB…
          </button>
          <button
            type="button"
            onClick={handleReturnToLibrary}
            style={{ marginTop: "1rem", marginLeft: "0.75rem" }}
          >
            Back to library
          </button>
        </div>
      </div>
    );
  }

  const readerFlow = settings?.viewMode === ViewMode.CONTINUOUS ? "scrolled" : "paginated";

  return (
    <ThemeProvider theme={themeOverrides}>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          background: "var(--reader-shell-background, #f1f5f9)",
        }}
      >
        <aside
          style={{
            width: "min(340px, 28vw)",
            minWidth: "260px",
            borderRight: "1px solid rgba(148, 163, 184, 0.25)",
            background: "var(--reader-sidebar-surface, #ffffff)",
            boxShadow: "0 0 40px rgba(15,23,42,0.06)",
          }}
        >
          <TableOfContents
            toc={tableOfContents}
            currentChapterHref={currentChapterHref}
            onNavigate={handleNavigateToChapter}
            isLoading={isTableOfContentsLoading}
          />
        </aside>

        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <ReaderView
            service={readerService}
            bookData={bookData}
            bookId={bookId}
            progressService={progressService}
            onProgress={handleProgress}
            initialLocation={initialLocation}
            onLocationChange={handleLocationChange}
            onTableOfContentsChange={handleTableOfContentsChange}
            onReady={handleReaderReady}
            onError={handleReaderError}
            flow={readerFlow}
          />

          <div
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              background: "rgba(15,23,42,0.6)",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 12px 28px rgba(15,23,42,0.24)",
              backdropFilter: "blur(6px)",
              flexWrap: "wrap",
            }}
          >
            <span>{progress ? `Progress: ${progress.percentage.toFixed(1)}%` : "New book"}</span>
            <button type="button" onClick={handleOpenLocal} style={{ padding: "0.25rem 0.75rem" }}>
              Open EPUB…
            </button>
            <button type="button" onClick={handleReturnToLibrary} style={{ padding: "0.25rem 0.75rem" }}>
              Back to library
            </button>
          </div>

          {settings ? (
            <div
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxWidth: "min(320px, 28vw)",
              }}
            >
              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  color: "white",
                  padding: "0.5rem",
                  borderRadius: "0.75rem",
                  boxShadow: "0 12px 28px rgba(15,23,42,0.24)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <ThemeSelector value={currentTheme} onChange={handleThemeChange} disabled={isLoading} />
              </div>

              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  color: "white",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  boxShadow: "0 12px 28px rgba(15,23,42,0.24)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <strong style={{ fontSize: "0.95rem" }}>Typography</strong>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>Font family</span>
                  <select
                    value={settings.fontFamily}
                    onChange={(event) => {
                      const value = event.target.value;
                      void handleSettingsUpdate({ fontFamily: value });
                    }}
                    style={{
                      padding: "0.35rem 0.5rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(15,23,42,0.45)",
                      color: "white",
                    }}
                  >
                    {FONT_FAMILY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                    Font size: {Math.round(settings.fontSize)}px
                  </span>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    step={1}
                    value={settings.fontSize}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      void handleSettingsUpdate({ fontSize: next });
                    }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                    Line height: {settings.lineHeight.toFixed(2)}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={settings.lineHeight}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      void handleSettingsUpdate({ lineHeight: parseFloat(next.toFixed(2)) });
                    }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                    Letter spacing: {settings.letterSpacing.toFixed(2)}px
                  </span>
                  <input
                    type="range"
                    min={-1}
                    max={5}
                    step={0.1}
                    value={settings.letterSpacing}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      void handleSettingsUpdate({ letterSpacing: parseFloat(next.toFixed(2)) });
                    }}
                  />
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>Text alignment</span>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {TEXT_ALIGN_OPTIONS.map((option) => {
                      const isActive = settings.textAlign === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => void handleSettingsUpdate({ textAlign: option.value })}
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "0.5rem",
                            border: "1px solid rgba(255,255,255,0.25)",
                            background: isActive ? "rgba(59,130,246,0.25)" : "rgba(15,23,42,0.35)",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.6rem",
                    background: "rgba(15,23,42,0.45)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontFamily: settings.fontFamily,
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: settings.lineHeight,
                    letterSpacing: `${settings.letterSpacing}px`,
                    textAlign: settings.textAlign,
                    color: "white",
                  }}
                >
                  “It was much pleasanter at home,” thought poor Alice, “when one wasn't always growing larger and
                  smaller.”
                </div>
              </div>

              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  color: "white",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  boxShadow: "0 12px 28px rgba(15,23,42,0.24)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <strong style={{ fontSize: "0.95rem" }}>Layout</strong>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>View mode</span>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {VIEW_MODE_OPTIONS.map((option) => {
                      const isActive = settings.viewMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleViewModeChange(option.value)}
                          style={{
                            padding: "0.4rem 0.7rem",
                            borderRadius: "0.55rem",
                            border: "1px solid rgba(255,255,255,0.25)",
                            background: isActive ? "rgba(59,130,246,0.25)" : "rgba(15,23,42,0.35)",
                            color: "white",
                            cursor: isActive ? "default" : "pointer",
                            minWidth: "fit-content",
                          }}
                          disabled={isLoading}
                          aria-pressed={isActive}
                        >
                          <div style={{ fontWeight: 600 }}>{option.label}</div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>Page spread</span>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {SPREAD_MODE_OPTIONS.map((option) => {
                      const isActive = settings.spreadMode === option.value;
                      const isDisabled =
                        settings.viewMode === ViewMode.CONTINUOUS || isLoading;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSpreadModeChange(option.value)}
                          style={{
                            padding: "0.4rem 0.7rem",
                            borderRadius: "0.55rem",
                            border: "1px solid rgba(255,255,255,0.25)",
                            background: isActive ? "rgba(59,130,246,0.25)" : "rgba(15,23,42,0.35)",
                            color: "white",
                            cursor: isDisabled ? "not-allowed" : isActive ? "default" : "pointer",
                            opacity: isDisabled ? 0.5 : 1,
                            minWidth: "fit-content",
                          }}
                          disabled={isDisabled}
                          aria-pressed={isActive}
                        >
                          <div style={{ fontWeight: 600 }}>{option.label}</div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                  {settings.viewMode === ViewMode.CONTINUOUS ? (
                    <span style={{ fontSize: "0.7rem", opacity: 0.75 }}>
                      Page spreads are unavailable in continuous scroll mode.
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ThemeProvider>
  );
}
