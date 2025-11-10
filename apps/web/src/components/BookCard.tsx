import type { CSSProperties, MouseEvent } from "react";
import type { Book } from "@epub-reader/core";
import { formatBytes } from "../utils/formatBytes";

export interface BookCardProps {
  book: Book;
  progress?: number;
  onOpen(book: Book): void;
  onShowDetails?(book: Book): void;
  onDelete?(book: Book): void;
}

export function BookCard({ book, progress, onOpen, onShowDetails, onDelete }: BookCardProps): JSX.Element {
  const handleDetailsClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onShowDetails?.(book);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.(book);
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      style={{
        all: "unset",
        width: "100%",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
        borderRadius: "0.9rem",
        background: "white",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
        padding: "1rem",
        position: "relative",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 8px 20px rgba(15,23,42,0.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "";
        event.currentTarget.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.08)";
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

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", textAlign: "left" }}>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>{book.title}</span>
        <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{book.author ?? "Unknown author"}</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{formatBytes(book.fileSize)}</span>
          {typeof progress === "number" ? (
            <span style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>
              {progress.toFixed(0)}%
            </span>
          ) : null}
        </div>
      </div>

      {typeof progress === "number" ? (
        <div
          style={{
            height: "0.4rem",
            borderRadius: "999px",
            background: "#e2e8f0",
            overflow: "hidden",
          }}
          aria-hidden
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

      {(onShowDetails || onDelete) && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
          {onShowDetails ? (
            <button
              type="button"
              onClick={handleDetailsClick}
              style={actionButtonStyle}
            >
              Details
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              style={{ ...actionButtonStyle, color: "#dc2626" }}
            >
              Remove
            </button>
          ) : null}
        </div>
      )}
    </button>
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
