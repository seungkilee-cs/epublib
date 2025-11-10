import type { ReactNode } from "react";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightMatches(text: string, query?: string): ReactNode {
  if (!query) {
    return text;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === trimmed.toLowerCase();
    if (!isMatch) {
      return <span key={index}>{part}</span>;
    }

    return (
      <mark
        key={index}
        style={{
          background: "#fde68a",
          color: "#92400e",
          padding: "0 0.1rem",
          borderRadius: "0.25rem",
        }}
      >
        {part}
      </mark>
    );
  });
}
