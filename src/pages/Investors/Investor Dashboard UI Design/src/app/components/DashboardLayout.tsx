// import { useInvestorNav } from "../context/NavigationContext";
// import { Sidebar } from "./Sidebar";
// import Dashboard from "../pages/Dashboard";
// import ExploreStartups from "../pages/ExploreStartups";
// import InterestedStartups from "../pages/InterestedStartups";
// import MentorRecommendations from "../pages/MentorRecommendations";
// import FundingRequests from "../pages/FundingRequests";
// import Meetings from "../pages/Meetings";
// import Analytics from "../pages/Analytics";
// import Messages from "../pages/Messages";
// import StartupDetails from "../pages/StartupDetails";

// export function DashboardLayout() {
//   const { activePage } = useInvestorNav();

//   const renderCurrentPage = () => {
//     switch (activePage) {
//       case "dashboard":
//         return <Dashboard />;
//       case "explore":
//         return <ExploreStartups />;
//       case "interested":
//         return <InterestedStartups />;
//       case "mentor-recommendations":
//         return <MentorRecommendations />;
//       case "funding-requests":
//         return <FundingRequests />;
//       case "meetings":
//         return <Meetings />;
//       case "analytics":
//         return <Analytics />;
//       case "messages":
//         return <Messages />;
//       case "startup-details":
//         return <StartupDetails />;
//       default:
//         return <Dashboard />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lavender-50">
//       <Sidebar />
//       <main className="ml-64 p-8">{renderCurrentPage()}</main>
//     </div>
//   );
// }
import { useInvestorNav } from "../context/NavigationContext";
import { Sidebar } from "./Sidebar";
import Dashboard from "../pages/Dashboard";
import ExploreStartups from "../pages/ExploreStartups";
import InterestedStartups from "../pages/InterestedStartups";
import MentorRecommendations from "../pages/MentorRecommendations";
import FundingRequests from "../pages/FundingRequests";
import Meetings from "../pages/Meetings";
import Analytics from "../pages/Analytics";
import Messages from "../pages/Messages";
import StartupDetails from "../pages/StartupDetails";
import InvestorDealRoom from "../pages/InvestorDealRoom";  // ← add this


export function DashboardLayout() {
  const { activePage } = useInvestorNav();

  const renderCurrentPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "explore":
        return <ExploreStartups />;
      case "interested":
        return <InterestedStartups />;
      case "mentor-recommendations":
        return <MentorRecommendations />;
      case "funding-requests":
        return <FundingRequests />;
      case "meetings":
        return <Meetings />;
      case "analytics":
        return <Analytics />;
      case "messages":
        return <Messages />;
      case "startup-details":
        return <StartupDetails />;
      case "deal-room":
        return <InvestorDealRoom/>
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lavender-50">
      <Sidebar />
      <main className="ml-64 p-8">{renderCurrentPage()}</main>
    </div>
  );
}