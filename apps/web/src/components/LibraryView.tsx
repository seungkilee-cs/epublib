import { Fragment } from "react";
import type { Book } from "@epub-reader/core";
import { LibraryView as LibraryViewMode } from "@epub-reader/core";
import { formatBytes } from "../utils/formatBytes";

export interface LibraryViewProps {
  books: Book[];
  view: LibraryViewMode;
  onViewChange(view: LibraryViewMode): void;
  isLoading?: boolean;
}

const viewOptions: Array<{ mode: LibraryViewMode; label: string }> = [
  { mode: LibraryViewMode.GRID, label: "Grid" },
  { mode: LibraryViewMode.LIST, label: "List" },
];

export function LibraryView({ books, view, onViewChange, isLoading = false }: LibraryViewProps): JSX.Element {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", color: "#0f172a", marginBottom: "0.25rem" }}>Library</h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            {books.length === 1 ? "1 book" : `${books.length} books`} available in your collection
          </p>
        </div>
        <div
          role="group"
          aria-label="Change library view"
          style={{
            display: "inline-flex",
            borderRadius: "999px",
            background: "#e2e8f0",
            padding: "0.25rem",
            gap: "0.25rem",
          }}
        >
          {viewOptions.map(({ mode, label }) => {
            const isActive = mode === view;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onViewChange(mode)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  cursor: isActive ? "default" : "pointer",
                  background: isActive ? "#2563eb" : "transparent",
                  color: isActive ? "#f8fafc" : "#1e293b",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
                aria-pressed={isActive}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? <LibraryLoadingState view={view} /> : null}

      {!isLoading && books.length === 0 ? <LibraryEmptyState /> : null}

      {!isLoading && books.length > 0 ? <LibraryItems books={books} view={view} /> : null}
    </section>
  );
}

function LibraryLoadingState({ view }: { view: LibraryViewMode }): JSX.Element {
  const skeletonCount = view === LibraryViewMode.LIST ? 5 : 8;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          view === LibraryViewMode.GRID ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr",
        gap: "1rem",
      }}
    >
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div
          key={index}
          style={{
            background: "#e2e8f0",
            borderRadius: "0.9rem",
            minHeight: view === LibraryViewMode.GRID ? "260px" : "96px",
            opacity: 0.7,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

function LibraryEmptyState(): JSX.Element {
  return (
    <div
      style={{
        border: "1px dashed #cbd5f5",
        borderRadius: "1rem",
        padding: "2.5rem 1.5rem",
        textAlign: "center",
        color: "#64748b",
        background: "#f8fafc",
      }}
    >
      <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
        Your library is empty
      </p>
      <p style={{ fontSize: "0.95rem" }}>
        Upload EPUB files to see them listed here. Metadata and cover images will appear automatically.
      </p>
    </div>
  );
}

function LibraryItems({ books, view }: { books: Book[]; view: LibraryViewMode }): JSX.Element {
  if (view === LibraryViewMode.LIST) {
    return (
      <div
        role="table"
        style={{
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderRadius: "0.9rem",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          role="row"
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 2fr 1fr 1fr",
            gap: "0.75rem",
            padding: "0.75rem 1.25rem",
            background: "#f1f5f9",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#475569",
          }}
        >
          <span>Title</span>
          <span>Author</span>
          <span>Added</span>
          <span>Size</span>
        </div>
        <div role="rowgroup" style={{ display: "flex", flexDirection: "column" }}>
          {books.map((book) => (
            <div
              key={book.id}
              role="row"
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 2fr 1fr 1fr",
                gap: "0.75rem",
                padding: "0.9rem 1.25rem",
                borderTop: "1px solid #e2e8f0",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, color: "#1e293b" }}>{book.title}</span>
              <span style={{ color: "#475569" }}>{book.author ?? "Unknown"}</span>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                {book.dateAdded ? book.dateAdded.toLocaleDateString() : "—"}
              </span>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{formatBytes(book.fileSize)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {books.map((book) => (
        <li
          key={book.id}
          style={{
            background: "white",
            borderRadius: "0.9rem",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "152%",
              borderRadius: "0.75rem",
              overflow: "hidden",
              background: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            {book.coverThumbnailUrl || book.coverUrl ? (
              <img
                src={book.coverThumbnailUrl ?? book.coverUrl}
                alt={book.title}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span aria-hidden>EPUB</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>{book.title}</span>
            <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{book.author ?? "Unknown author"}</span>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{formatBytes(book.fileSize)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
