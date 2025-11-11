import { Link } from "react-router-dom";

export function NotFoundScreen(): JSX.Element {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        background: "#f8fafc",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "2.5rem", color: "#0f172a", marginBottom: "0.5rem" }}>Page not found</h1>
        <p style={{ color: "#475569", fontSize: "1.05rem" }}>
          The page you requested could not be found. It might have been moved or deleted.
        </p>
      </div>
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.4rem",
          borderRadius: "999px",
          background: "#2563eb",
          color: "#f8fafc",
          fontWeight: 600,
          textDecoration: "none",
          boxShadow: "0 10px 25px rgba(37,99,235,0.2)",
        }}
      >
        ← Back to library
      </Link>
    </div>
  );
}
