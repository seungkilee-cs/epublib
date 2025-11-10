import type { CSSProperties, KeyboardEvent } from "react";
import type { Book } from "@epub-reader/core";
import { LibraryView as LibraryViewMode } from "@epub-reader/core";
import { formatBytes } from "../utils/formatBytes";
import { BookCard } from "./BookCard";

export type LibrarySortKey = "title" | "author" | "dateAdded" | "lastOpened";
export type LibrarySortDirection = "asc" | "desc";

export interface LibraryViewProps {
  books: Book[];
  view: LibraryViewMode;
  onViewChange(view: LibraryViewMode): void;
  onOpenBook(book: Book): void;
  progressByBookId?: Record<string, number>;
  onShowDetails?(book: Book): void;
  onDeleteBook?(book: Book): void;
  isLoading?: boolean;
  sortKey: LibrarySortKey;
  sortDirection: LibrarySortDirection;
  onSortChange(key: LibrarySortKey, direction: LibrarySortDirection): void;
}

const viewOptions: Array<{ mode: LibraryViewMode; label: string }> = [
  { mode: LibraryViewMode.GRID, label: "Grid" },
  { mode: LibraryViewMode.LIST, label: "List" },
];

const sortOptions: Array<{ key: LibrarySortKey; label: string }> = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "dateAdded", label: "Date added" },
  { key: "lastOpened", label: "Last read" },
];

export function LibraryView({
  books,
  view,
  onViewChange,
  onOpenBook,
  progressByBookId,
  onShowDetails,
  onDeleteBook,
  isLoading = false,
  sortKey,
  sortDirection,
  onSortChange,
}: LibraryViewProps): JSX.Element {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", color: "#0f172a", marginBottom: "0.25rem" }}>Library</h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            {books.length === 1 ? "1 book" : `${books.length} books`} available in your collection
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label htmlFor="library-sort" style={{ fontSize: "0.9rem", color: "#475569", fontWeight: 600 }}>
              Sort by
            </label>
            <select
              id="library-sort"
              value={sortKey}
              onChange={(event) => onSortChange(event.target.value as LibrarySortKey, sortDirection)}
              style={{
                appearance: "none",
                padding: "0.35rem 1.75rem 0.35rem 0.75rem",
                borderRadius: "999px",
                border: "1px solid #cbd5f5",
                background: "white",
                color: "#1e293b",
                fontWeight: 500,
                fontSize: "0.95rem",
                position: "relative",
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onSortChange(sortKey, sortDirection === "asc" ? "desc" : "asc")}
              style={{
                padding: "0.35rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid #cbd5f5",
                background: "white",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
              aria-label={`Change sort direction (currently ${sortDirection === "asc" ? "ascending" : "descending"})`}
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <LibraryLoadingState view={view} /> : null}

      {!isLoading && books.length === 0 ? <LibraryEmptyState /> : null}

      {!isLoading && books.length > 0 ? (
        <LibraryItems
          books={books}
          view={view}
          onOpenBook={onOpenBook}
          onShowDetails={onShowDetails}
          onDeleteBook={onDeleteBook}
          progressByBookId={progressByBookId}
        />
      ) : null}
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

interface LibraryItemsProps {
  books: Book[];
  view: LibraryViewMode;
  onOpenBook(book: Book): void;
  onShowDetails?(book: Book): void;
  onDeleteBook?(book: Book): void;
  progressByBookId?: Record<string, number>;
}

function LibraryItems({
  books,
  view,
  onOpenBook,
  onShowDetails,
  onDeleteBook,
  progressByBookId,
}: LibraryItemsProps): JSX.Element {
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
          {books.map((book) => {
            const progress = progressByBookId?.[book.id];
            return (
              <button
                key={book.id}
                type="button"
                role="row"
                onClick={() => onOpenBook(book)}
                onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenBook(book);
                  }
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "3fr 2fr 1fr 1fr",
                  gap: "0.75rem",
                  padding: "0.9rem 1.25rem",
                  borderTop: "1px solid #e2e8f0",
                  alignItems: "center",
                  textAlign: "left",
                  background: "white",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.18s ease",
                }}
              >
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{book.title}</span>
                <span style={{ color: "#475569" }}>{book.author ?? "Unknown"}</span>
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  {book.dateAdded ? book.dateAdded.toLocaleDateString() : "—"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
                  {typeof progress === "number" ? (
                    <span style={{ color: "#2563eb", fontWeight: 600 }}>{progress.toFixed(0)}%</span>
                  ) : null}
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{formatBytes(book.fileSize)}</span>
                </div>

                {typeof progress === "number" ? (
                  <div
                    aria-hidden
                    style={{
                      gridColumn: "1 / -1",
                      marginTop: "0.75rem",
                      height: "0.4rem",
                      borderRadius: "999px",
                      background: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(Math.max(progress, 0), 100)}%`,
                        height: "100%",
                        background: "#2563eb",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                ) : null}

                {(onShowDetails || onDeleteBook) && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "0.5rem",
                      marginTop: "0.65rem",
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {onShowDetails ? (
                      <button
                        type="button"
                        onClick={() => onShowDetails(book)}
                        style={actionButtonStyle}
                      >
                        Details
                      </button>
                    ) : null}
                    {onDeleteBook ? (
                      <button
                        type="button"
                        onClick={() => onDeleteBook(book)}
                        style={{ ...actionButtonStyle, color: "#dc2626", borderColor: "#fecaca" }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
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
        <li key={book.id}>
          <BookCard
            book={book}
            progress={progressByBookId?.[book.id]}
            onOpen={onOpenBook}
            onShowDetails={onShowDetails}
            onDelete={onDeleteBook}
          />
        </li>
      ))}
    </ul>
  );
}

const actionButtonStyle: CSSProperties = {
  padding: "0.35rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid #cbd5f5",
  background: "white",
  color: "#1e293b",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};
