import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShoppingBag,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Mail,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react";
import logo from "../../../../../logo.png";
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },

  { icon: Users, label: "Founders", path: "/admin/founders" },

  { icon: UserCircle, label: "Mentors", path: "/admin/mentors" },

  { icon: GraduationCap, label: "Investors", path: "/admin/investors" },

  { icon: ShoppingBag, label: "Revenue / Earnings", path: "/admin/revenue" },


  { icon: MessageSquare, label: "Community Posts", path: "/admin/community" },

  { icon: BarChart3, label: "Reports & Analytics", path: "/admin/reports" },

  { icon: Mail, label: "Messages / Support", path: "/admin/messages" },

  { icon: Settings, label: "Settings", path: "/admin/settings" },
];
export function Sidebar() {
  const location = useLocation();

  return (
<div className="h-screen w-64 bg-[#080611] border-r border-purple-900 flex flex-col">
        {/* Logo */}
<div className="p-6 border-b border-purple-900">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
 <img
    src={logo}
    alt="EmpowerHer"
    className="w-20 h-20 object-contain -ml-0 -mt-1"
  />
            </div>
          <div>
<h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
  EmpowerHer
</h1>
<p className="text-xs text-purple-300">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
<div className="p-4 border-t border-purple-900">
          <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Link>
      </div>
    </div>
  );
}
