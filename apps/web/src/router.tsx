import { createBrowserRouter } from "react-router-dom";
import { ReaderScreen } from "./screens/ReaderScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ReaderScreen />,
  },
]);
