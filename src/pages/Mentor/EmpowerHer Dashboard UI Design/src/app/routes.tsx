// import { createBrowserRouter } from "react-router-dom";

// import DashboardLayout from "./components/DashboardLayout";
// import Dashboard from "./pages/Dashboard";
// import SessionRequests from "./pages/SessionRequests";
// import SessionTracking from "./pages/SessionTracking";
// import MyFounders from "./pages/MyFounders";
// import FounderDetail from "./pages/FounderDetail";
// import ChatPage from "./pages/ChatPage";
// import ReadinessEvaluation from "./pages/ReadinessEvaluation";
// import FundingMatch from "./pages/FundingMatch";
// import Analytics from "./pages/Analytics";
// import Messages from "./pages/Messages";
// import Reviews from "./pages/Reviews";
// import Profile from "./pages/Profile";

// export const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <DashboardLayout />,
//     children: [
//       { index: true, element: <Dashboard /> },
//       { path: "session-requests", element: <SessionRequests /> },
//       { path: "session-tracking", element: <SessionTracking /> },
//       { path: "my-founders", element: <MyFounders /> },
//       { path: "my-founders/:id", element: <FounderDetail /> },
//       { path: "chat/:id", element: <ChatPage /> },
//       { path: "readiness-evaluation", element: <ReadinessEvaluation /> },

//       // ✅ FIXED FUNDING MATCH
//       {
//         path: "funding-match",
//         element: <FundingMatch />,
//         children: [
//           {
//             path: ":id",
//             element: <FundingMatch />,
//           },
//         ],
//       },

//       { path: "analytics", element: <Analytics /> },
//       { path: "messages", element: <Messages /> },
//       { path: "reviews", element: <Reviews /> },
//       { path: "profile", element: <Profile /> },
//     ],
//   },
// ]);

import { createBrowserRouter } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import SessionRequests from "./pages/SessionRequests";
import SessionHub from "./pages/SessionTracking";
import MyFounders from "./pages/MyFounders";
import FounderDetail from "./pages/FounderDetail";
import ReviewPitch from "./pages/ReviewPitch";
import MentorHub from "./pages/MentorHub";
import ChatPage from "./pages/ChatPage";
import ReadinessEvaluation from "./pages/ReadinessEvaluation";
import FounderProgress from "./pages/FounderProgress";
import FundingMatch from "./pages/FundingMatch";
import Analytics from "./pages/Analytics";
import Messages from "./pages/Messages";
import Reviews from "./pages/Reviews";
import Profile from "./pages/Profile";
import MentorWorkspace from "./pages/MentorWorkspace";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },

      { path: "session-requests", element: <SessionRequests /> },
      { path: "session-tracking", element: <SessionHub /> },

      { path: "my-founders", element: <MyFounders /> },

      // OLD DETAIL (keep if needed)
      { path: "my-founders/:id", element: <FounderDetail /> },

      // ✅ NEW ROUTES YOU NEEDED
      { path: "review-pitch/:id", element: <ReviewPitch /> },
      { path: "mentor-hub/:id", element: <MentorHub /> },

      // IMPORTANT: make evaluation dynamic
      { path: "evaluation/:id", element: <ReadinessEvaluation /> },
      { path: "progress", element: <FounderProgress /> },
      { path: "progress/:id", element: <FounderProgress /> },
      { path: "chat/:id", element: <ChatPage /> },

      {
        path: "funding-match",
        element: <FundingMatch />,
        // children: [
        //   {
        //     path: ":id",
        //     element: <FundingMatch />,
        //   },
        // ],
      },

      { path: "analytics", element: <Analytics /> },
      { path: "messages", element: <Messages /> },
      { path: "reviews", element: <Reviews /> },
      { path: "profile", element: <Profile /> },
      { path: "workspace", element: <MentorWorkspace /> },
    ],
  }
], {
  future: {
    v7_relativeSplatPath: true,
  },
});