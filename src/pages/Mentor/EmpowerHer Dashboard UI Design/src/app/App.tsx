

import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { MentorProvider } from "../context/MentorContext";

export default function App() {
  return (
    <MentorProvider>
      <RouterProvider router={router} />
    </MentorProvider>
  );
}