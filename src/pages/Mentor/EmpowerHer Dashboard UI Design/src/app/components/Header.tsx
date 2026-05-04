import { Bell, Sparkles, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

type NotificationType = "founder" | "session" | "funding";

interface Notification {
  id: number;
  message: string;
  read: boolean;
  type: NotificationType;
}

export function Header() {
  const navigate = useNavigate();
  const [openNotifications, setOpenNotifications] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      message: "New founder joined your network",
      read: false,
      type: "founder",
    },
    {
      id: 2,
      message: "New session request received",
      read: false,
      type: "session",
    },
    {
      id: 3,
      message: "Funding recommendation matched",
      read: true,
      type: "funding",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    if (notification.type === "founder") {
      navigate("my-founders");
    } else if (notification.type === "session") {
      navigate("session-requests");
    } else if (notification.type === "funding") {
      navigate("funding-match");
    }

    setOpenNotifications(false);
  };

  return (
    <header className="relative h-20 bg-white border-b border-purple-100 flex items-center justify-between px-8">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-6">

        {/* Welcome Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            Welcome back, Sarah ✨
          </h2>
          <p className="text-sm text-gray-500">
            You’re mentoring 6 founders today
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="hidden md:flex items-center gap-3">

          {/* Active Sessions */}
          <div
            onClick={() => navigate("session-tracking")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium cursor-pointer hover:scale-105 transition-all duration-300"
          >
            <Sparkles size={14} />
              Sessions Insights
          </div>

          {/* Funding Matches */}
          <div
            onClick={() => navigate("funding-match")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full text-xs font-medium shadow-sm cursor-pointer hover:scale-105 transition-all duration-300"
          >
            <TrendingUp size={14} />
             Funding Matches
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4 relative">

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className="relative p-2 hover:bg-purple-50 rounded-xl transition-all duration-300"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1 flex items-center justify-center text-xs bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-purple-100 font-semibold text-sm">
                Notifications
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                      className={`px-4 py-3 text-sm cursor-pointer transition-all ${
                        notification.read
                          ? "bg-white text-gray-600"
                          : "bg-purple-50 text-purple-700 font-medium"
                      } hover:bg-purple-100`}
                    >
                      {notification.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div
          onClick={() => navigate("profile")}
          className="flex items-center gap-3 pl-4 border-l border-purple-100 cursor-pointer hover:bg-purple-50 px-3 py-2 rounded-xl transition-all duration-300"
        >
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">
              Sarah Martinez
            </p>
            <p className="text-xs text-gray-500">
              Business Mentor
            </p>
          </div>

          <ImageWithFallback
            src="https://images.unsplash.com/photo-1754298949882-216a1c92dbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Sarah Martinez"
            className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
          />
        </div>
      </div>
    </header>
  );
}