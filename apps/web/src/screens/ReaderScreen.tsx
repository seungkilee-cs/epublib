import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReaderView, TableOfContents, ThemeProvider } from "@epub-reader/ui";
import type { LocationInfo, ReadingProgress, TocItem } from "@epub-reader/core";
import {
  initializeServices,
  createEPUBService,
  progressService,
  bookService,
  fileAdapter,
} from "../services/appServices";

const SAMPLE_BOOK_ID = "sample-alice";
const SAMPLE_BOOK_TITLE = "Alice in Wonderland (Sample)";
const SAMPLE_BOOK_URL =
  "https://raw.githubusercontent.com/benoitvallon/sample-epub/master/Alice%20in%20Wonderland.epub";

export function ReaderScreen() {
  const [bookData, setBookData] = useState<ArrayBuffer | null>(null);
  const [bookId, setBookId] = useState<string>(SAMPLE_BOOK_ID);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [initialLocation, setInitialLocation] = useState<string | undefined>(undefined);
  const [tableOfContents, setTableOfContents] = useState<TocItem[]>([]);
  const [currentChapterHref, setCurrentChapterHref] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const readerService = useMemo(() => createEPUBService(), []);
  const { bookId: routeBookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        await initializeServices();

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
    })();

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

  return (
    <ThemeProvider>
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
        </div>
      </div>
    </ThemeProvider>
  );
}
