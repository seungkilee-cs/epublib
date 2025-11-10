import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { Book } from "@epub-reader/core";
import { LibraryView } from "@epub-reader/core";
import { initializeServices, bookService } from "../services/appServices";
import { formatBytes } from "../utils/formatBytes";
import { LibraryView as LibraryViewComponent } from "../components/LibraryView";

type UploadStatus = "pending" | "uploading" | "success" | "error";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  progress: number;
  error?: string;
};

const ACCEPTED_EXTENSIONS = new Set([".epub"]);
const ACCEPTED_MIME_TYPES = new Set(["application/epub+zip"]);

const generateUploadId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;


const getExtension = (name: string): string => {
  const match = name.toLowerCase().match(/\.[^./\\]+$/u);
  return match ? match[0] : "";
};

const statusLabel: Record<UploadStatus, string> = {
  pending: "Pending",
  uploading: "Uploading…",
  success: "Uploaded",
  error: "Failed",
};

export function LibraryScreen(): JSX.Element {
  const [books, setBooks] = useState<Book[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [libraryView, setLibraryView] = useState<LibraryView>(LibraryView.GRID);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await initializeServices();
        if (!active) {
          return;
        }
        const existingBooks = await bookService.getAllBooks();
        if (active) {
          setBooks(existingBooks);
        }
      } catch (error) {
        if (active) {
          setErrorBanner((error as Error).message);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const refreshBooks = useCallback(async () => {
    const allBooks = await bookService.getAllBooks();
    setBooks(allBooks);
  }, []);

  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      const extension = getExtension(file.name);
      if (!ACCEPTED_EXTENSIONS.has(extension)) {
        return "Unsupported file type. Please upload .epub files.";
      }

      if (file.type && !ACCEPTED_MIME_TYPES.has(file.type) && file.type !== "") {
        return "Unsupported MIME type. Only EPUB files are allowed.";
      }

      if (file.size <= 0) {
        return "File is empty.";
      }

      const existsInLibrary = books.some((book) => book.fileSize === file.size && book.title === file.name);
      if (existsInLibrary) {
        return "A book with this name and size already exists in your library.";
      }

      return null;
    },
    [books]
  );

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList ?? []);
      if (!files.length) {
        return;
      }

      setErrorBanner(null);
      setIsUploading(true);

      for (const file of files) {
        const uploadId = generateUploadId();
        setUploads((prev) => [
          ...prev,
          {
            id: uploadId,
            name: file.name,
            size: file.size,
            status: "pending",
            progress: 0,
          },
        ]);

        const validationMessage = validateFile(file);
        if (validationMessage) {
          updateUpload(uploadId, {
            status: "error",
            error: validationMessage,
            progress: 100,
          });
          continue;
        }

        try {
          updateUpload(uploadId, {
            status: "uploading",
            progress: 10,
          });

          const buffer = await file.arrayBuffer();
          updateUpload(uploadId, { progress: 55 });

          await bookService.addBook(
            buffer,
            {
              title: file.name,
              fileSize: file.size,
            },
            {
              extractMetadata: true,
              createPlaceholderCover: true,
            }
          );

          updateUpload(uploadId, {
            status: "success",
            progress: 100,
          });
        } catch (error) {
          updateUpload(uploadId, {
            status: "error",
            error: (error as Error).message,
            progress: 100,
          });
        }
      }

      await refreshBooks();
      setIsUploading(false);
    },
    [refreshBooks, updateUpload, validateFile]
  );

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        void processFiles(event.target.files);
        event.target.value = "";
      }
    },
    [processFiles]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const { files } = event.dataTransfer;
      if (files && files.length > 0) {
        void processFiles(files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const successfulUploads = useMemo(() => uploads.filter((upload) => upload.status === "success").length, [uploads]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "2.5rem 1.5rem 4rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <header>
          <h1 style={{ fontSize: "2.25rem", marginBottom: "0.5rem", color: "#0f172a" }}>Library Uploads</h1>
          <p style={{ color: "#475569", maxWidth: "600px" }}>
            Add one or more EPUB files to your personal library. You can drag and drop files into the
            upload area or browse your computer. Metadata such as title and cover art will be extracted
            automatically when available.
          </p>
        </header>

        {errorBanner ? (
          <div
            role="alert"
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
            }}
          >
            {errorBanner}
          </div>
        ) : null}

        <section>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragLeave}
            style={{
              position: "relative",
              border: `2px dashed ${isDragging ? "#2563eb" : "#cbd5f5"}`,
              borderRadius: "1rem",
              background: isDragging ? "rgba(59,130,246,0.08)" : "white",
              padding: "2.5rem 1.5rem",
              textAlign: "center",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".epub"
              multiple
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
              <div
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                }}
                aria-hidden
              >
                ⬆
              </div>

              <div>
                <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b" }}>
                  Drag & drop EPUB files here
                </p>
                <p style={{ color: "#64748b", marginTop: "0.25rem" }}>or use the button to browse your computer</p>
              </div>

              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={isUploading}
                style={{
                  padding: "0.65rem 1.5rem",
                  background: isUploading ? "#93c5fd" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "999px",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: 600,
                  transition: "background 0.2s ease",
                }}
              >
                {isUploading ? "Uploading…" : "Select EPUB files"}
              </button>

              <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Accepted format: .epub (multiple files supported)</p>
            </div>
          </div>
        </section>

        {uploads.length > 0 ? (
          <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.35rem", color: "#0f172a" }}>Upload activity</h2>
              <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                {successfulUploads}/{uploads.length} completed
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {uploads.map((upload) => (
                <article
                  key={upload.id}
                  style={{
                    background: "white",
                    borderRadius: "0.9rem",
                    padding: "1rem 1.25rem",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{upload.name}</span>
                      <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{formatBytes(upload.size)}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color:
                          upload.status === "success"
                            ? "#16a34a"
                            : upload.status === "error"
                            ? "#dc2626"
                            : "#2563eb",
                      }}
                    >
                      {statusLabel[upload.status]}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "0.75rem",
                      height: "0.45rem",
                      background: "#e2e8f0",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                    aria-hidden
                  >
                    <div
                      style={{
                        width: `${Math.min(upload.progress, 100)}%`,
                        height: "100%",
                        background:
                          upload.status === "error"
                            ? "#f87171"
                            : upload.status === "success"
                            ? "#34d399"
                            : "#60a5fa",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  {upload.error ? (
                    <p style={{ marginTop: "0.65rem", color: "#dc2626", fontSize: "0.9rem" }}>{upload.error}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <LibraryViewComponent
          books={books}
          view={libraryView}
          onViewChange={setLibraryView}
          isLoading={isUploading}
        />
      </div>
    </div>
  );
}
