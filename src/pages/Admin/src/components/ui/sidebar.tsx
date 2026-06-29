import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../../../firebase";
import { useNavigate } from "react-router-dom";
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
  Sparkles,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",           path: "/admin",              section: "main" },
  { icon: Users,           label: "Founders",            path: "/admin/founders",     section: "people" },
  { icon: UserCircle,      label: "Mentors",             path: "/admin/mentors",      section: "people" },
  { icon: GraduationCap,   label: "Pitches",             path: "/admin/pitches",      section: "activity" },
  { icon: ShoppingBag,     label: "Revenue",             path: "/admin/revenue",      section: "activity" },
  { icon: ShoppingCart,    label: "Applications",        path: "/admin/applications", section: "activity" },
  { icon: MessageSquare,   label: "Community",           path: "/admin/community",    section: "activity" },
  { icon: BarChart3,       label: "Analytics",           path: "/admin/reports",      section: "system" },
  { icon: Mail,            label: "Support",             path: "/admin/messages",     section: "system" },
  { icon: Settings,        label: "Settings",            path: "/admin/settings",     section: "system" },
];

const sections: { key: string; label: string }[] = [
  { key: "main",     label: "" },
  { key: "people",   label: "People" },
  { key: "activity", label: "Activity" },
  { key: "system",   label: "System" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <>
      {/* Inject font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .eh-sidebar * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }

        .eh-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #6b5fa6;
          text-decoration: none;
          transition: background 0.15s, color 0.15s, transform 0.1s;
          position: relative;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .eh-nav-item:hover {
          background: rgba(124, 58, 237, 0.12);
          color: #c4b5fd;
          transform: translateX(2px);
        }

        .eh-nav-item.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(219, 39, 119, 0.15));
          color: #e9d5ff;
          font-weight: 600;
        }

        .eh-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: linear-gradient(180deg, #7c3aed, #db2777);
          border-radius: 0 3px 3px 0;
        }

        .eh-nav-item .icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }

        .eh-nav-item.active .icon-wrap {
          background: linear-gradient(135deg, #7c3aed, #db2777);
        }

        .eh-nav-item:not(.active) .icon-wrap {
          background: rgba(255,255,255,0.04);
        }

        .eh-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3d3560;
          padding: 14px 12px 4px;
        }

        .eh-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #6b5fa6;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .eh-logout-btn:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #fca5a5;
        }

        .eh-pulse {
          animation: pulse-glow 2.5s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #22c55e; }
          50%       { opacity: 0.6; box-shadow: 0 0 2px #22c55e; }
        }
      `}</style>

      <div
        className="eh-sidebar"
        style={{
          height: "100vh",
          width: 232,
          background: "#0d0b1a",
          borderRight: "1px solid #1e1a33",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow top-left */}
        <div style={{
          position: "absolute", top: -60, left: -60,
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* ── Logo / Brand ── */}
        <div style={{
          padding: "22px 18px 18px",
          borderBottom: "1px solid #1e1a33",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
              flexShrink: 0,
            }}>
              <Sparkles size={18} style={{ color: "#fff" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f5f3ff", letterSpacing: "-0.01em" }}>
                EmpowerHer
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <div
                  className="eh-pulse"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }}
                />
                <p style={{ margin: 0, fontSize: 11, color: "#4a4070", fontWeight: 500 }}>
                  Admin Console
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 10px", scrollbarWidth: "none" }}>
          {sections.map(({ key, label }) => {
            const items = menuItems.filter(m => m.section === key);
            return (
              <div key={key}>
                {label && <p className="eh-section-label">{label}</p>}
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  {items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`eh-nav-item${isActive ? " active" : ""}`}
                        >
                          <div className="icon-wrap">
                            <item.icon
                              size={15}
                              style={{ color: isActive ? "#fff" : "#6b5fa6" }}
                            />
                          </div>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* ── Footer / Logout ── */}
        <div style={{
          padding: "10px",
          borderTop: "1px solid #1e1a33",
        }}>
          <button className="eh-logout-btn" onClick={handleLogout}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <LogOut size={14} style={{ color: "#f87171" }} />
            </div>
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
}