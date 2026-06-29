import { useState, useEffect } from "react";
import {
  Users, Star, Calendar, AlertTriangle, DollarSign,
  Search, Activity, Loader2, RefreshCw, ArrowUpRight,
  Shield, Zap,
} from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";

/* ─── Design tokens (mirrors Dashboard) ─── */
const T = {
  page:    { background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  card:    { background: "#16122b", border: "1px solid #2d2050", borderRadius: 16 },
  pad:     { padding: "20px 22px" },
  title:   { color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const },
  label:   { color: "#8b7db5", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  muted:   { color: "#6b5fa6" },
  row:     { background: "#0f0c1f", border: "1px solid #1e1a33", borderRadius: 12 },
  badge:   (color: string, bg: string) => ({
    background: bg, color, borderRadius: 6, fontSize: 11,
    fontWeight: 700, padding: "3px 10px", display: "inline-block",
    border: `1px solid ${color}33`,
  }),
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Active:    { color: "#4ade80", bg: "#052e16" },
  Suspended: { color: "#f87171", bg: "#3b0a0a" },
  Inactive:  { color: "#fbbf24", bg: "#3b2a04" },
};

const CHART_COLORS = ["#7c3aed","#db2777","#4ade80","#fbbf24","#60a5fa"];

const sessionGrowthData = [
  { month: "Jan", sessions: 45 },
  { month: "Feb", sessions: 62 },
  { month: "Mar", sessions: 78 },
  { month: "Apr", sessions: 91 },
  { month: "May", sessions: 110 },
  { month: "Jun", sessions: 134 },
];

const mockReports = [{ id: 1, mentor: "Jennifer Kim", issue: "Missed session", severity: "medium" }];

/* ─── Custom tooltip ─── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e1b2e", border: "1px solid #3b3060", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: "#a78bfa", fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 700 }}>{p.value}</p>
      ))}
    </div>
  );
};

/* ─── GlowButton ─── */
function GlowButton({ children, onClick, disabled, accent = "#7c3aed", small = false }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: small ? "5px 12px" : "8px 16px", borderRadius: 9,
        border: `1px solid ${accent}55`,
        background: hover ? `${accent}22` : `${accent}12`,
        color: accent, fontSize: small ? 12 : 13, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >{children}</button>
  );
}

export function Mentors() {
  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mentors, setMentors]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, sessions: 0, rating: 4.8, reports: 0, revenue: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const mentorsSnap = await getDocs(collection(db, "mentors"));
      const mentorsData = mentorsSnap.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          name: data.fullName || data.name || "Mentor",
          email: data.email || "",
expertise: Array.isArray(data.skills) ? data.skills
  : Array.isArray(data.expertise) ? data.expertise
  : typeof data.skills === "string" ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
  : typeof data.expertise === "string" ? data.expertise.split(",").map((s: string) => s.trim()).filter(Boolean)
  : [],
            industry: data.industry || "General",
          students: data.students || 0,
          sessions: data.sessions || 0,
          rating: data.rating || 4.8,
          revenueGenerated: data.revenueGenerated || 0,
          status: data.status || "Active",
          avatar: data.photoURL || "",
        };
      });
      setMentors(mentorsData);
      const sessSnap = await getDocs(collection(db, "sessionRequests"));
      setStats({
        total: mentorsData.length,
        active: mentorsData.filter((m) => m.status === "Active").length,
        sessions: sessSnap.size || 134,
        rating: 4.8,
        reports: mockReports.length,
        revenue: mentorsData.length * 150,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSuspend = async (mentor: any) => {
    setActionLoading(mentor.id);
    try {
      await updateDoc(doc(db, "mentors", mentor.id), { status: "Suspended" });
      setMentors((prev) => prev.map((m) => m.id === mentor.id ? { ...m, status: "Suspended" } : m));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const handleActivate = async (mentor: any) => {
    setActionLoading(mentor.id);
    try {
      await updateDoc(doc(db, "mentors", mentor.id), { status: "Active" });
      setMentors((prev) => prev.map((m) => m.id === mentor.id ? { ...m, status: "Active" } : m));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const filtered = mentors.filter((m) => {
    const matchSearch = !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expertise.join(" ").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  /* Pie data from expertise */
  const expMap: Record<string, number> = {};
  mentors.forEach((m) => (m.expertise || []).forEach((e: string) => { expMap[e] = (expMap[e] || 0) + 1; }));
  const pieData = Object.entries(expMap).slice(0, 5).map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: "Total Mentors",       value: stats.total,            icon: Users,         accent: "#7c3aed" },
    { label: "Active Mentors",      value: stats.active,           icon: Activity,      accent: "#4ade80" },
    { label: "Sessions This Week",  value: stats.sessions,         icon: Calendar,      accent: "#60a5fa" },
    { label: "Avg Rating",          value: stats.rating,           icon: Star,          accent: "#fbbf24" },
    { label: "Pending Reports",     value: stats.reports,          icon: AlertTriangle, accent: "#f87171" },
    { label: "Revenue Generated",   value: `₹${stats.revenue}`,   icon: DollarSign,    accent: "#db2777" },
  ];

  /* ── Loading ── */
  if (loading) return (
    <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 16px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #2d1f4f" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        </div>
        <p style={{ color: "#6b5fa6", fontSize: 14 }}>Loading mentors…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={T.page}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", top: -200, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(219,39,119,0.06) 0%, transparent 70%)", bottom: 0, right: 0 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 10px #7c3aed" }} />
              <span style={{ ...T.muted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Panel</span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: 0 }}>Mentor Management</h1>
            <p style={{ ...T.muted, fontSize: 13, margin: "4px 0 0" }}>Monitor mentor performance and sessions</p>
          </div>
          <GlowButton onClick={fetchData} accent="#7c3aed">
            <RefreshCw size={14} /> Refresh
          </GlowButton>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 22 }}>
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ ...T.card, ...T.pad, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: `${s.accent}12` }} />
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon size={14} style={{ color: s.accent }} />
                </div>
                <p style={{ color: "#f5f3ff", fontSize: 24, fontWeight: 900, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
                <p style={{ ...T.muted, fontSize: 11, margin: 0 }}>{s.label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6 }}>
                  <ArrowUpRight size={11} style={{ color: s.accent }} />
                  <span style={{ color: s.accent, fontSize: 10, fontWeight: 700 }}>Live</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* Session Growth */}
          <div style={{ ...T.card, ...T.pad }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={{ ...T.title, margin: 0 }}>Session Growth</p>
                <p style={{ color: "#f5f3ff", fontSize: 20, fontWeight: 800, margin: "4px 0 0" }}>
                  {sessionGrowthData.reduce((a, b) => a + b.sessions, 0)}
                  <span style={{ ...T.muted, fontSize: 12, fontWeight: 400, marginLeft: 6 }}>sessions (6mo)</span>
                </p>
              </div>
              <span style={T.badge("#4ade80", "#052e16")}>↑ Growing</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sessionGrowthData}>
                <defs>
                  <linearGradient id="sessGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1a33" />
                <XAxis dataKey="month" stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} />
                <YAxis stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="sessions" stroke="url(#sessGrad)" strokeWidth={2.5}
                  dot={{ fill: "#7c3aed", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#db2777" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expertise Breakdown */}
          <div style={{ ...T.card, ...T.pad }}>
            <p style={{ ...T.title, marginBottom: 16 }}>Expertise Breakdown</p>
            {pieData.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                <p style={T.muted}>No expertise data yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={72}
                      dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                  {pieData.map((e, i) => {
                    const total = pieData.reduce((a, b) => a + b.value, 0);
                    const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: "#c4b5fd", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                        <span style={{ color: "#f5f3ff", fontSize: 11, fontWeight: 700 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Search + Filter Pills (matching the screenshot) ── */}
        <div style={{ ...T.card, ...T.pad, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a4070" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or expertise…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 10,
                color: "#f5f3ff", fontSize: 13, padding: "10px 14px 10px 36px", outline: "none",
              }}
            />
          </div>

          {/* Status pills — matches the screenshot exactly */}
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "all",       label: "All",       accent: "#a78bfa" },
              { key: "active",    label: "Active",    accent: "#4ade80" },
              { key: "suspended", label: "Suspended", accent: "#f87171" },
            ].map(({ key, label, accent }) => {
              const active = statusFilter === key;
              return (
                <button key={key} onClick={() => setStatusFilter(key)}
                  style={{
                    padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: `1px solid ${active ? accent : "#2d2050"}`,
                    background: active ? `${accent}22` : "transparent",
                    color: active ? accent : "#6b5fa6",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >{label}</button>
              );
            })}
          </div>
        </div>

        {/* ── Mentor Table ── */}
        <div style={T.card}>
          {/* Card header */}
          <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ ...T.title, margin: 0 }}>
              Mentor Performance
              <span style={{ color: "#4a4070", marginLeft: 8, fontWeight: 400, textTransform: "none", fontSize: 12 }}>
                ({filtered.length} results)
              </span>
            </p>
            {stats.reports > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#ff000015", border: "1px solid #f8717140", borderRadius: 8, padding: "4px 10px" }}>
                <Shield size={11} style={{ color: "#f87171" }} />
                <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>{stats.reports} pending report{stats.reports > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding: "10px 22px", borderBottom: "1px solid #1e1a33" }}>
            {["Mentor", "Expertise", "Students", "Sessions", "Rating", "Status", "Actions"].map((h, i) => (
              <span key={h} style={{ ...T.label, textAlign: i === 6 ? "right" : "left" as any }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Search size={36} style={{ color: "#2d2050", margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "#4a4070", fontSize: 14 }}>No mentors match your filters.</p>
              </div>
            ) : filtered.map((mentor) => {
              const sc = STATUS_CFG[mentor.status] || STATUS_CFG["Inactive"];
              const isLoading = actionLoading === mentor.id;
              const initials = mentor.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

              return (
                <div key={mentor.id}
                  style={{ ...T.row, display: "grid", gridTemplateColumns: "2fr 2fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", alignItems: "center", padding: "12px 14px", transition: "border-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b3060")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1a33")}
                >
                  {/* Mentor name + avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {mentor.avatar ? (
                        <img src={mentor.avatar} alt={mentor.name}
                          style={{ width: 36, height: 36, borderRadius: 10, display: "block", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #db2777)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{initials}</span>
                        </div>
                      )}
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: sc.color, border: "2px solid #0f0c1f", boxShadow: `0 0 6px ${sc.color}` }} />
                    </div>
                    <div>
                      <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 700, margin: 0 }}>{mentor.name}</p>
                      <p style={{ ...T.muted, fontSize: 11, margin: 0 }}>{mentor.industry}</p>
                    </div>
                  </div>

                  {/* Expertise tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(mentor.expertise || []).slice(0, 2).map((e: string) => (
                      <span key={e} style={{ background: "#2d1f4f", color: "#a78bfa", borderRadius: 5, fontSize: 10, fontWeight: 600, padding: "2px 7px", border: "1px solid #3b2d6a" }}>{e}</span>
                    ))}
                    {mentor.expertise.length > 2 && (
                      <span style={{ color: "#4a4070", fontSize: 10 }}>+{mentor.expertise.length - 2}</span>
                    )}
                  </div>

                  {/* Students */}
                  <span style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600 }}>{mentor.students}</span>

                  {/* Sessions */}
                  <span style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600 }}>{mentor.sessions}</span>

                  {/* Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                    <span style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700 }}>{mentor.rating}</span>
                  </div>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, boxShadow: `0 0 5px ${sc.color}` }} />
                    <span style={{ color: sc.color, fontSize: 12, fontWeight: 700 }}>{mentor.status}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    {isLoading ? (
                      <Loader2 size={14} style={{ color: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
                    ) : mentor.status === "Active" ? (
                      <GlowButton small onClick={() => handleSuspend(mentor)} accent="#fbbf24">Suspend</GlowButton>
                    ) : (
                      <GlowButton small onClick={() => handleActivate(mentor)} accent="#4ade80">Activate</GlowButton>
                    )}
                    <Zap size={11} style={{ color: "#2d2050" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4a4070; }
        input:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 2px rgba(124,58,237,0.2); }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}