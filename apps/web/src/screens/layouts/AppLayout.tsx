import { Outlet } from "react-router-dom";

export function AppLayout(): JSX.Element {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Outlet />
    </div>
  );
}
