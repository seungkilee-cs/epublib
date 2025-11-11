import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { Book } from "@epub-reader/core";
import { formatBytes } from "../utils/formatBytes";

interface BookDetailsModalProps {
  book: Book;
  progressPercentage?: number;
  onClose(): void;
  onUpdate(updates: Partial<Book>): Promise<void>;
  onDelete(): Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
}

function formatDate(value?: Date): string {
  if (!value) {
    return "—";
  }

  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return "—";
  }

  return `${dateValue.toLocaleDateString()} ${dateValue.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function BookDetailsModal({
  book,
  progressPercentage,
  onClose,
  onUpdate,
  onDelete,
  isSaving,
  isDeleting,
  errorMessage,
}: BookDetailsModalProps): JSX.Element {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? "");
  const [description, setDescription] = useState(book.description ?? "");
  const [tagsInput, setTagsInput] = useState((book.tags ?? []).join(", "));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setTitle(book.title);
    setAuthor(book.author ?? "");
    setDescription(book.description ?? "");
    setTagsInput((book.tags ?? []).join(", "));
    setStatusMessage(null);
  }, [book]);

  useEffect(() => {
    if (statusMessage) {
      const timer = window.setTimeout(() => setStatusMessage(null), 3500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [statusMessage]);

  const parsedTags = useMemo(() => (book.tags ?? []).join(", "), [book.tags]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedDescription = description.trim();
    const nextTags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!trimmedTitle) {
      setStatusMessage("Title is required.");
      return;
    }

    try {
      await onUpdate({
        title: trimmedTitle,
        author: trimmedAuthor || undefined,
        description: trimmedDescription || undefined,
        tags: nextTags.length ? nextTags : undefined,
      });
      setStatusMessage("Changes saved");
    } catch {
      setStatusMessage(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this book from your library? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await onDelete();
    } catch {
      // error is handled via errorMessage in parent
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-details-heading"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(640px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 20px 45px rgba(15,23,42,0.25)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h2 id="book-details-heading" style={{ margin: 0, fontSize: "1.75rem", color: "#0f172a" }}>
              {book.title}
            </h2>
            <p style={{ margin: "0.35rem 0 0", color: "#475569" }}>{book.author ?? "Unknown author"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              appearance: "none",
              border: "none",
              background: "transparent",
              fontSize: "1.5rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            ×
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            background: "#f8fafc",
            borderRadius: "0.85rem",
            padding: "1rem 1.25rem",
          }}
        >
          <Stat label="Progress" value={typeof progressPercentage === "number" ? `${progressPercentage.toFixed(0)}%` : "—"} />
          <Stat label="Status" value={book.status ?? "—"} />
          <Stat label="File size" value={formatBytes(book.fileSize)} />
          <Stat label="Date added" value={formatDate(book.dateAdded)} />
          <Stat label="Last opened" value={formatDate(book.lastOpened)} />
          <Stat label="Pages" value={book.pageCount ? book.pageCount.toString() : "—"} />
        </section>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="details-title" style={{ fontWeight: 600, color: "#0f172a" }}>
              Title
            </label>
            <input
              id="details-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              disabled={isSaving || isDeleting}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="details-author" style={{ fontWeight: 600, color: "#0f172a" }}>
              Author
            </label>
            <input
              id="details-author"
              type="text"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              disabled={isSaving || isDeleting}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="details-description" style={{ fontWeight: 600, color: "#0f172a" }}>
              Description
            </label>
            <textarea
              id="details-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              disabled={isSaving || isDeleting}
              style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="details-tags" style={{ fontWeight: 600, color: "#0f172a" }}>
              Tags
            </label>
            <input
              id="details-tags"
              type="text"
              placeholder={parsedTags ? undefined : "Comma-separated"}
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              disabled={isSaving || isDeleting}
              style={inputStyle}
            />
          </div>

          {errorMessage ? (
            <div
              role="alert"
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "0.75rem 1rem",
                borderRadius: "0.65rem",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          {statusMessage ? (
            <div
              role="status"
              style={{
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                color: "#047857",
                padding: "0.6rem 1rem",
                borderRadius: "0.65rem",
              }}
            >
              {statusMessage}
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "0.75rem",
                border: "1px solid #fecaca",
                background: "white",
                color: "#b91c1c",
                fontWeight: 600,
                cursor: isSaving || isDeleting ? "not-allowed" : "pointer",
              }}
            >
              {isDeleting ? "Deleting…" : "Delete book"}
            </button>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #cbd5f5",
                  background: "white",
                  color: "#1e293b",
                  fontWeight: 600,
                  cursor: isSaving || isDeleting ? "not-allowed" : "pointer",
                }}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "#2563eb",
                  color: "#f8fafc",
                  fontWeight: 600,
                  cursor: isSaving || isDeleting ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 16px rgba(37,99,235,0.25)",
                }}
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>
        {label}
      </span>
      <span style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const inputStyle: CSSProperties = {
  borderRadius: "0.65rem",
  border: "1px solid #cbd5f5",
  padding: "0.55rem 0.85rem",
  fontSize: "1rem",
  color: "#0f172a",
  background: "white",
  boxShadow: "inset 0 1px 2px rgba(15,23,42,0.05)",
};
