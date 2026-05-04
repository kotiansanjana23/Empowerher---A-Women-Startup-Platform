import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  TrendingUp,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSessions, setOpenSessions] = useState(false);

  useEffect(() => {
    if (
      location.pathname.includes("session-requests") ||
      location.pathname.includes("session-tracking")
    ) {
      setOpenSessions(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    alert("Logging out...");
    navigate("/");
  };

  const navItemStyle = (isActive: boolean) =>
    `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-white text-purple-700 shadow-md"
        : "text-gray-600 hover:bg-purple-50 hover:translate-x-1"
    }`;

  return (
    <aside className="w-64 bg-gradient-to-b from-purple-100/60 via-white to-white backdrop-blur-md border-r border-purple-100 flex flex-col shadow-md">

      {/* Top Brand Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-pink-500"></div>

      {/* Logo */}
      <div className="p-6 border-b border-purple-100">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          EmpowerHer
        </h1>
        <p className="text-xs text-gray-500 mt-1">Mentor Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">

        <NavLink to="." end className={({ isActive }) => navItemStyle(isActive)}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 h-6 w-1 bg-gradient-to-b from-purple-600 to-pink-500 rounded-r-full transition-all"></span>
              )}
              <LayoutDashboard
                size={20}
                className={isActive ? "text-purple-600" : "group-hover:text-purple-500"}
              />
              Dashboard
            </>
          )}
        </NavLink>

        <NavLink to="my-founders" className={({ isActive }) => navItemStyle(isActive)}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 h-6 w-1 bg-gradient-to-b from-purple-600 to-pink-500 rounded-r-full"></span>
              )}
              <Users
                size={20}
                className={isActive ? "text-purple-600" : "group-hover:text-purple-500"}
              />
              My Founders
            </>
          )}
        </NavLink>

        {/* Sessions Dropdown */}
        <div>
          <button
            onClick={() => setOpenSessions(!openSessions)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 hover:bg-purple-50 hover:translate-x-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              <Calendar size={20} />
              Sessions
            </div>
            {openSessions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {openSessions && (
            <div className="ml-8 mt-2 space-y-1 border-l border-purple-200 pl-4">
              <NavLink
                to="session-requests"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-gray-600 hover:bg-purple-50"
                  }`
                }
              >
                Session Requests
              </NavLink>

              <NavLink
                to="session-tracking"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-gray-600 hover:bg-purple-50"
                  }`
                }
              >
                Session Tracking
              </NavLink>
            </div>
          )}
        </div>

        <button
  onClick={() => {
    const founders = JSON.parse(localStorage.getItem("myFounders") || "[]");

    if (founders.length > 0) {
      navigate(`progress/${founders[0].id}`);
    } else {
      alert("No founders available");
    }
  }}
  className="w-full text-left group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-purple-50 hover:translate-x-1 transition-all duration-300"
>
  <ClipboardCheck
    size={20}
    className="group-hover:text-purple-500"
  />
  Founder Progress Timeline
</button>

        <NavLink to="funding-match" className={({ isActive }) => navItemStyle(isActive)}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 h-6 w-1 bg-gradient-to-b from-purple-600 to-pink-500 rounded-r-full"></span>
              )}
              <TrendingUp
                size={20}
                className={isActive ? "text-purple-600" : "group-hover:text-purple-500"}
              />
              Funding Match
            </>
          )}
        </NavLink>

        <NavLink to="messages" className={({ isActive }) => navItemStyle(isActive)}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 h-6 w-1 bg-gradient-to-b from-purple-600 to-pink-500 rounded-r-full"></span>
              )}
              <MessageSquare
                size={20}
                className={isActive ? "text-purple-600" : "group-hover:text-purple-500"}
              />
              Communication
            </>
          )}
        </NavLink>

        <NavLink to="analytics" className={({ isActive }) => navItemStyle(isActive)}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 h-6 w-1 bg-gradient-to-b from-purple-600 to-pink-500 rounded-r-full"></span>
              )}
              <TrendingUp
                size={20}
                className={isActive ? "text-purple-600" : "group-hover:text-purple-500"}
              />
              Analytics
            </>
          )}
        </NavLink>

        <NavLink to="profile" className={({ isActive }) => navItemStyle(isActive)}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 h-6 w-1 bg-gradient-to-b from-purple-600 to-pink-500 rounded-r-full"></span>
              )}
              <User
                size={20}
                className={isActive ? "text-purple-600" : "group-hover:text-purple-500"}
              />
              Profile
            </>
          )}
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-purple-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}