// import { RouterProvider } from "react-router-dom";
// import { router } from "./routes";

// export default function App() {
//   return <RouterProvider router={router} />;
// }

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