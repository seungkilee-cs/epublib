import { createBrowserRouter } from "react-router-dom";
import { LibraryScreen } from "./screens/LibraryScreen";
import { ReaderScreen } from "./screens/ReaderScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LibraryScreen />,
  },
  {
    path: "/book/:bookId",
    element: <ReaderScreen />,
  },
  {
    path: "/reader",
    element: <ReaderScreen />,
  },
]);
