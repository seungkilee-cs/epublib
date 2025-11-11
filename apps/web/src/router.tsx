import { createBrowserRouter } from "react-router-dom";
import { LibraryScreen } from "./screens/LibraryScreen";
import { ReaderScreen } from "./screens/ReaderScreen";
import { NotFoundScreen } from "./screens/NotFoundScreen";
import { AppLayout } from "./screens/layouts/AppLayout";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LibraryScreen />,
      },
      {
        path: "book/:bookId",
        element: <ReaderScreen />,
      },
      {
        path: "reader",
        element: <ReaderScreen />,
      },
      {
        path: "*",
        element: <NotFoundScreen />,
      },
    ],
  },
]);
