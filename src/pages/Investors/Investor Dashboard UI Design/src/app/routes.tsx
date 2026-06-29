
import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ExploreStartups from "./pages/ExploreStartups";
import StartupDetails from "./pages/StartupDetails";
import InterestedStartups from "./pages/FundingRequests";
import Meetings from "./pages/Meetings";
import Analytics from "./pages/Analytics";
import Messages from "./pages/Messages";
import FundingRequests from "./pages/FundingRequests";
import MentorRecommendations from "./pages/MentorRecommendations";
import InvestorDealRoom from "./pages/InvestorDealRoom";


export const router = createBrowserRouter([
  {
path: "/investor",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "explore", Component: ExploreStartups },
      { path: "startup/:id", Component: StartupDetails },
      //{ path: "interested", Component: InterestedStartups },
      { path: "mentor-recommendations", Component: MentorRecommendations },
      { path: "meetings", Component: Meetings },
      { path: "analytics", Component: Analytics },
      { path: "messages", Component: Messages },
      { path: "funding-requests", Component: FundingRequests },
      { path: "deal-room", Component: InvestorDealRoom },
      { path: "deal-room/:mentorId", Component: InvestorDealRoom },
    ],
  },
]);