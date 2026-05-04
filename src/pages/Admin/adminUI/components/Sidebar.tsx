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

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Users / Members", path: "/admin/users" },
  { icon: UserCircle, label: "Mentors", path: "/admin/mentors" },
  { icon: GraduationCap, label: "Courses", path: "/admin/courses" },
  { icon: ShoppingBag, label: "Marketplace", path: "/admin/marketplace" },
  { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
  { icon: MessageSquare, label: "Community Posts", path: "/admin/community" },
  { icon: BarChart3, label: "Reports & Analytics", path: "/admin/reports" },
  { icon: Mail, label: "Messages / Support", path: "/admin/messages" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white">E</span>
          </div>
          <div>
            <h1 className="text-lg">EmpowerHer</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
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
      <div className="p-4 border-t border-border">
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
