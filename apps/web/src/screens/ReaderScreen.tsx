import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReaderView, ThemeProvider } from "@epub-reader/ui";
import type { ReadingProgress } from "@epub-reader/core";
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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReturnToLibrary = useCallback(() => {
    navigate("/");
  }, [navigate]);

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
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <ReaderView
          service={readerService}
          bookData={bookData}
          bookId={bookId}
          progressService={progressService}
          onProgress={handleProgress}
          initialLocation={initialLocation}
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
    </ThemeProvider>
  );
}
