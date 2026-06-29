
import {
  LayoutDashboard,
  Compass,
  Heart,
  FileText,
  Calendar,
  BarChart3,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Briefcase,
} from "lucide-react";
import { useInvestorNav } from "../context/NavigationContext";
import type { InvestorPage } from "../context/NavigationContext";
import logo from "../../../../../../logo.png";
// import { text } from "stream/consumers";


const navItems: { page: InvestorPage; icon: React.ElementType; label: string }[] = [
  { page: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { page: "explore", icon: Compass, label: "Explore Startups" },
 // { page: "interested", icon: Heart, label: "Interested Startups" },
  { page: "funding-requests", icon: FileText, label: "Funding Requests" },
   //{ page: "messages", icon: MessageSquare, label: "Messages" },
  { page: "meetings", icon: Calendar, label: "Meetings" },
    { page: "mentor-recommendations", icon: Users, label: "Mentor Requests" },
   { page: "deal-room", icon: Briefcase, label: "Deal Room" },  // ← add this
  { page: "analytics", icon: BarChart3, label: "Analytics" },

];

export function Sidebar() {
  const { activePage, setActivePage } = useInvestorNav();

  return (
<aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-50 via-white to-pink-50 border-r border-purple-200/60 backdrop-blur-xl flex flex-col z-10 shadow-[4px_0_25px_rgba(168,85,247,0.08)]">
      {/* Logo */}
<div className="p-5 border-b border-purple-200/60 bg-white/40 backdrop-blur-md">
  <div className="flex items-center">
    <img
      src={logo}
      alt="EmpowerHer"
      className="w-12 h-12 object-contain -mr-2 -mt-2"
    />

    <div className="flex flex-col leading-none">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
        EmpowerHer
      </h1>

      <p className="text-xs text-gray-500 mt-1">
        Investor Portal
      </p>
    </div>
  </div>
</div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setActivePage(item.page)}  // ← back to plain setActivePage
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left ${
              activePage === item.page
                //? "bg-gradient-to-r from-purple-100 to-pink-50 text-purple-700"
                ? "bg-gradient-to-r from-purple-200/80 to-pink-100 text-purple-800 shadow-md shadow-purple-100"
              //  : "text-gray-600 hover:bg-purple-50"
                : "text-gray-600 hover:bg-purple-100/70 hover:translate-x-1"
                
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}