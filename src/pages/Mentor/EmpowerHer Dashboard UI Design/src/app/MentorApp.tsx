import { Routes, Route } from "react-router-dom";
import { MentorProvider } from "../context/MentorContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import SessionRequests from "./pages/SessionRequests";
import SessionTracking from "./pages/SessionTracking";
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

export default function MentorApp() {
  return (
    <MentorProvider>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="session-requests" element={<SessionRequests />} />
          <Route path="session-tracking" element={<SessionTracking />} />
          <Route path="my-founders" element={<MyFounders />} />
          <Route path="my-founders/:id" element={<FounderDetail />} />
          <Route path="review-pitch/:id" element={<ReviewPitch />} />
          <Route path="mentor-hub/:id" element={<MentorHub />} />
          <Route path="evaluation/:id" element={<ReadinessEvaluation />} />
          <Route path="progress/:id" element={<FounderProgress />} />
          <Route path="chat/:id" element={<ChatPage />} />
          <Route path="funding-match" element={<FundingMatch />} />
          <Route path="funding-match/:id" element={<FundingMatch />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="messages" element={<Messages />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </MentorProvider>
  );
}
