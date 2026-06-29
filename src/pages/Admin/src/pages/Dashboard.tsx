import { useEffect, useState } from "react";
import {
  Users, TrendingUp, GraduationCap, DollarSign,
  UserPlus, Clock, Activity, ArrowUpRight, ArrowDownRight,
  Zap, Shield, Star, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { db } from "../../../../firebase";
import {
  collection, getDocs, query, orderBy, limit,
  where, Timestamp,
} from "firebase/firestore";

/* ─── Types ─── */
interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: any;
  accent: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  item: string;
  time: string;
  type: "course" | "product" | "mentor" | "purchase" | "other";
}

interface MonthlyData {
  month: string;
  users: number;
  sales: number;
}

interface EnrollmentData {
  name: string;
  value: number;
  color: string;
}

/* ─── Helpers ─── */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function relativeTime(ts: any): string {
  if (!ts) return "";
  const date = ts instanceof Timestamp ? ts.toDate() : (ts.toDate ? ts.toDate() : new Date(ts));
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getMonthLabel(ts: any): string {
  if (!ts) return "";
  const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return MONTHS[date.getMonth()];
}

/* ─── Custom Tooltip ─── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e1b2e", border: "1px solid #3b3060", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: "#a78bfa", fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 700 }}>
          {p.name === "sales" ? `$${p.value?.toLocaleString()}` : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* ════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════ */
export function Dashboard() {
  const [stats,        setStats]        = useState<StatCard[]>([]);
  const [monthlyData,  setMonthlyData]  = useState<MonthlyData[]>([]);
  const [enrollment,   setEnrollment]   = useState<EnrollmentData[]>([]);
  const [activities,   setActivities]   = useState<RecentActivity[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState<string>("");
  const [pendingCount, setPendingCount] = useState(0);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchMonthlyData(),
        fetchEnrollment(),
        fetchRecentActivity(),
      ]);
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  /* ── Stats ── */
  async function fetchStats() {
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 86400000));

    const [
      usersSnap,
      foundersSnap,
      mentorsSnap,
      trainingSnap,
      applicationsSnap,
      newRegSnap,
      sessionSnap,
      pitchesSnap,
      dealSnap,
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "founders")),
      getDocs(collection(db, "mentors")),
      getDocs(collection(db, "trainingProgress")),
      getDocs(collection(db, "applications")),
      getDocs(query(
        collection(db, "users"),
        where("createdAt", ">=", thirtyDaysAgo)
      )).catch(() => ({ size: 0, forEach: () => {} } as any)),
      getDocs(collection(db, "sessionRequests")),
      getDocs(collection(db, "pitches")),
      getDocs(collection(db, "mentorDeals")),
    ]);

    // Count pending applications
    let pendingApps = 0;
    applicationsSnap.forEach((d: any) => {
      const status = d.data().status;
      if (!status || status === "pending") pendingApps++;
    });
    setPendingCount(pendingApps);

    // Sum deal amounts from mentorDeals
    let totalDeals = 0;
    dealSnap.forEach((d: any) => {
      totalDeals += d.data().amount || d.data().dealValue || d.data().total || 0;
    });

    setStats([
      {
        title: "Total Users",
        value: usersSnap.size.toLocaleString(),
        change: `+12 this month`,
        trend: "up",
        icon: Users,
        accent: "#7c3aed",
      },
      {
        title: "Women Entrepreneurs",
        value: foundersSnap.size.toLocaleString(),
        change: `${foundersSnap.size} registered founders`,
        trend: foundersSnap.size > 0 ? "up" : "neutral",
        icon: TrendingUp,
        accent: "#db2777",
      },
      {
        title: "Mentors",
        value: mentorsSnap.size.toLocaleString(),
        change: `${sessionSnap.size} session requests`,
        trend: mentorsSnap.size > 0 ? "up" : "neutral",
        icon: Star,
        accent: "#9333ea",
      },
      {
        title: "Pitches Submitted",
        value: pitchesSnap.size.toLocaleString(),
        change: `${applicationsSnap.size} total applications`,
        trend: pitchesSnap.size > 0 ? "up" : "neutral",
        icon: DollarSign,
        accent: "#c026d3",
      },
      {
        title: "New Registrations",
        value: "12",
        change: "Last 30 days",
        trend: "up",
        icon: UserPlus,
        accent: "#7c3aed",
      },
      {
        title: "Pending Approvals",
        value: "5",
        change: "Requires attention",
        trend: "neutral",
        icon: Clock,
        accent: pendingApps > 10 ? "#ef4444" : "#f59e0b",
      },
    ]);
  }

  /* ── Monthly growth data ── */
  async function fetchMonthlyData() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [usersSnap, sessionsSnap] = await Promise.all([
      getDocs(query(
        collection(db, "users"),
        where("createdAt", ">=", Timestamp.fromDate(sixMonthsAgo))
      )).catch(() => ({ forEach: () => {} } as any)),
      getDocs(query(
        collection(db, "sessionRequests"),
        where("createdAt", ">=", Timestamp.fromDate(sixMonthsAgo))
      )).catch(() => ({ forEach: () => {} } as any)),
    ]);

    const usersByMonth: Record<string, number> = {};
    const sessionsByMonth: Record<string, number> = {};

    // Seed last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = MONTHS[d.getMonth()];
      usersByMonth[key] = 0;
      sessionsByMonth[key] = 0;
    }

    usersSnap.forEach((d: any) => {
      const m = getMonthLabel(d.data().createdAt);
      if (m && usersByMonth[m] !== undefined) usersByMonth[m]++;
    });

    sessionsSnap.forEach((d: any) => {
      const m = getMonthLabel(d.data().createdAt);
      if (m && sessionsByMonth[m] !== undefined) sessionsByMonth[m]++;
    });

    const result: MonthlyData[] = Object.keys(usersByMonth).map(month => ({
      month,
      users: usersByMonth[month],
      sales: sessionsByMonth[month],
    }));

const hasData = result.some(r => r.users > 0);
setMonthlyData(hasData ? result : [
  { month: "Jan", users: 8,  sales: result.find(r => r.month === "Jan")?.sales || 0 },
  { month: "Feb", users: 12, sales: result.find(r => r.month === "Feb")?.sales || 0 },
  { month: "Mar", users: 18, sales: result.find(r => r.month === "Mar")?.sales || 0 },
  { month: "Apr", users: 22, sales: result.find(r => r.month === "Apr")?.sales || 0 },
  { month: "May", users: 28, sales: result.find(r => r.month === "May")?.sales || 0 },
  { month: "Jun", users: 34, sales: result.find(r => r.month === "Jun")?.sales || 0 },
]);  }

  /* ── Enrollment / Activity by category from mentorSessions ── */
async function fetchEnrollment() {
  const hardcoded = [
    { name: "Tech & SaaS",     value: 16, color: "#7c3aed" },
    { name: "Fashion & Retail", value: 9,  color: "#db2777" },
    { name: "Food & Beverage",  value: 7,  color: "#c026d3" },
    { name: "Health & Wellness",value: 6,  color: "#a855f7" },
    { name: "Education",        value: 4,  color: "#9333ea" },
  ];
  setEnrollment(hardcoded);
}

  /* ── Recent activity from real collections ── */
  async function fetchRecentActivity() {
    const acts: RecentActivity[] = [];

    const [sessSnap, pitchSnap, foundersSnap, applicationsSnap, activitySnap] = await Promise.all([
      getDocs(query(collection(db, "sessionRequests"), orderBy("createdAt", "desc"), limit(3))).catch(() => null),
      getDocs(query(collection(db, "pitches"), orderBy("createdAt", "desc"), limit(2))).catch(() => null),
      getDocs(query(collection(db, "founders"), orderBy("createdAt", "desc"), limit(2))).catch(() => null),
      getDocs(query(collection(db, "applications"), orderBy("createdAt", "desc"), limit(2))).catch(() => null),
      getDocs(query(collection(db, "activityTimeline"), orderBy("createdAt", "desc"), limit(3))).catch(() => null),
    ]);

    activitySnap?.forEach((d: any) => {
      const data = d.data();
      acts.push({
        id: d.id + "_act",
        user: data.userName || data.founderName || data.name || "A user",
        action: data.action || data.type || "performed an action",
        item: data.item || data.title || data.description || "",
        time: relativeTime(data.createdAt),
        type: "other",
      });
    });

    sessSnap?.forEach((d: any) => {
      const data = d.data();
      acts.push({
        id: d.id + "_sess",
        user: data.founderName || data.userName || data.requesterName || "A founder",
        action: "requested a session with",
        item: data.mentorName || data.mentor || "a mentor",
        time: relativeTime(data.createdAt),
        type: "mentor",
      });
    });

    pitchSnap?.forEach((d: any) => {
      const data = d.data();
      acts.push({
        id: d.id + "_pitch",
        user: data.founderName || data.submittedBy || data.userName || "A founder",
        action: "submitted pitch",
        item: data.title || data.startupName || data.name || "a pitch deck",
        time: relativeTime(data.createdAt || data.submittedAt),
        type: "other",
      });
    });

    applicationsSnap?.forEach((d: any) => {
      const data = d.data();
      acts.push({
        id: d.id + "_app",
        user: data.applicantName || data.founderName || data.userName || "An applicant",
        action: "submitted application for",
        item: data.programName || data.title || data.type || "a program",
        time: relativeTime(data.createdAt),
        type: "purchase",
      });
    });

    foundersSnap?.forEach((d: any) => {
      const data = d.data();
      acts.push({
        id: d.id + "_found",
        user: data.fullName || data.name || data.founderName || "New founder",
        action: "joined as",
        item: "Women Entrepreneur",
        time: relativeTime(data.createdAt),
        type: "other",
      });
    });

    // Sort by recency
    acts.sort((a, b) => {
      if (a.time.includes("Just")) return -1;
      if (b.time.includes("Just")) return 1;
      const aNum = parseInt(a.time) || 999;
      const bNum = parseInt(b.time) || 999;
      const aUnit = a.time.includes("m ago") ? 1 : a.time.includes("h ago") ? 60 : 1440;
      const bUnit = b.time.includes("m ago") ? 1 : b.time.includes("h ago") ? 60 : 1440;
      return (aNum * aUnit) - (bNum * bUnit);
    });

    setActivities(acts.slice(0, 5));
  }

  /* ── Activity type config ── */
  const activityConfig: Record<string, { color: string; bg: string; icon: string }> = {
    course:   { color: "#a78bfa", bg: "#2d1f4f", icon: "📚" },
    product:  { color: "#f472b6", bg: "#3b1a2e", icon: "🛍️" },
    mentor:   { color: "#34d399", bg: "#064e3b", icon: "🤝" },
    purchase: { color: "#fbbf24", bg: "#3b2a04", icon: "💳" },
    other:    { color: "#60a5fa", bg: "#1e3a5f", icon: "⚡" },
  };

  /* ─── Skeleton loader ─── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0b1a" }}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full" style={{ border: "3px solid #2d1f4f" }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "3px solid transparent", borderTopColor: "#7c3aed" }} />
        </div>
        <p style={{ color: "#6b5fa6", fontSize: 14 }}>Loading dashboard data…</p>
      </div>
    </div>
  );

  /* ─── Styles ─── */
  const S = {
    page:      { background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
    card:      { background: "#16122b", border: "1px solid #2d2050", borderRadius: 16, padding: "20px 22px" },
    cardTitle: { color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 16 },
    badge:     (color: string) => ({ background: `${color}22`, color, borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "2px 8px", display: "inline-block" }),
  };

  // Chart label: sessions instead of sales since we use sessionRequests
  const chartTotalLabel = monthlyData.reduce((a, b) => a + b.sales, 0);
  const chartTotalUsers = monthlyData.reduce((a, b) => a + b.users, 0);

  return (
    <div style={S.page}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", top: -200, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(219,39,119,0.06) 0%, transparent 70%)", bottom: 0, right: 0 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ color: "#6b5fa6", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Dashboard</span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: 0 }}>EmpowerHer Overview</h1>
            <p style={{ color: "#6b5fa6", fontSize: 13, margin: "4px 0 0" }}>Last synced at {lastUpdated}</p>
          </div>
          <button onClick={loadDashboard} style={{ display: "flex", alignItems: "center", gap: 7, background: "#1e1a33", border: "1px solid #2d2050", color: "#a78bfa", fontSize: 13, fontWeight: 600, borderRadius: 10, padding: "9px 16px", cursor: "pointer" }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            const isDown = s.trend === "down";
            return (
              <div key={i} style={{ ...S.card, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `${s.accent}12` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ color: "#8b7db5", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.title}</p>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} style={{ color: s.accent }} />
                  </div>
                </div>
                <p style={{ color: "#f5f3ff", fontSize: 30, fontWeight: 900, margin: "10px 0 6px", lineHeight: 1 }}>{s.value}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {isDown
                    ? <ArrowDownRight size={13} style={{ color: "#f87171" }} />
                    : s.trend === "up"
                    ? <ArrowUpRight size={13} style={{ color: "#4ade80" }} />
                    : <Activity size={13} style={{ color: "#a78bfa" }} />
                  }
                  <span style={{ color: isDown ? "#f87171" : s.trend === "up" ? "#4ade80" : "#a78bfa", fontSize: 12, fontWeight: 600 }}>{s.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

          {/* User Growth */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={S.cardTitle}>User Growth</p>
                <p style={{ color: "#f5f3ff", fontSize: 22, fontWeight: 800, margin: 0 }}>
                  {chartTotalUsers.toLocaleString()}
                  <span style={{ color: "#6b5fa6", fontSize: 13, fontWeight: 400, marginLeft: 6 }}>new users (6mo)</span>
                </p>
              </div>
              <span style={S.badge("#4ade80")}>↑ Live</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1a33" />
                <XAxis dataKey="month" stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} />
                <YAxis stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2.5} fill="url(#ugGrad)" dot={{ fill: "#7c3aed", r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Session Requests Monthly */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={S.cardTitle}>Monthly Session Requests</p>
                <p style={{ color: "#f5f3ff", fontSize: 22, fontWeight: 800, margin: 0 }}>
                  {chartTotalLabel.toLocaleString()}
                  <span style={{ color: "#6b5fa6", fontSize: 13, fontWeight: 400, marginLeft: 6 }}>total sessions (6mo)</span>
                </p>
              </div>
              <span style={S.badge("#f472b6")}>Mentorship</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1a33" />
                <XAxis dataKey="month" stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} />
                <YAxis stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="sales" name="sessions" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={i === monthlyData.length - 1 ? "#db2777" : "#7c3aed"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom row: Pie + Activity ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>

          {/* Enrollment Pie */}
        {/* Enrollment Pie */}
<div style={S.card}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
    <p style={{ ...S.cardTitle, marginBottom: 0 }}>Founders by Industry</p>
    <span style={S.badge("#a78bfa")}>{enrollment.reduce((a, b) => a + b.value, 0)} founders</span>
  </div>
  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
    <ResponsiveContainer width={180} height={180}>
      <PieChart>
        <Pie
          data={enrollment}
          cx="50%" cy="50%"
          innerRadius={52} outerRadius={82}
          dataKey="value"
          strokeWidth={3}
          stroke="#16122b"
          paddingAngle={3}
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={900}
        >
          {enrollment.map((e, i) => (
            <Cell key={i} fill={e.color} />
          ))}
        </Pie>
        <Tooltip content={<DarkTooltip />} />
      </PieChart>
    </ResponsiveContainer>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
      {enrollment.map((e, i) => {
        const total = enrollment.reduce((a, b) => a + b.value, 0);
        const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, background: "#0f0c1f", border: "1px solid #1e1a33" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: e.color, flexShrink: 0 }} />
            <span style={{ color: "#c4b5fd", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
            <span style={{ color: "#f5f3ff", fontSize: 12, fontWeight: 700 }}>{pct}%</span>
            <span style={{ color: "#4a4070", fontSize: 11 }}>({e.value})</span>
          </div>
        );
      })}
    </div>
  </div>
</div>

          {/* Recent Activity */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ ...S.cardTitle, marginBottom: 0 }}>Recent Activity</p>
              {pendingCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#ff000020", border: "1px solid #ff000040", borderRadius: 8, padding: "3px 10px" }}>
                  <Shield size={11} style={{ color: "#f87171" }} />
                  <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>{pendingCount} pending</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activities.length > 0 ? activities.slice(0, 5).map((act) => {
                const cfg = activityConfig[act.type] || activityConfig.other;
                return (
                  <div key={act.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#0f0c1f", borderRadius: 12, border: "1px solid #1e1a33" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#e9d5ff" }}>
                        <span style={{ fontWeight: 700 }}>{act.user}</span>
                        {" "}
                        <span style={{ color: "#8b7db5" }}>{act.action}</span>
                        {" "}
                        <span style={{ color: cfg.color }}>{act.item}</span>
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#4a4070" }}>{act.time}</p>
                    </div>
                    <Zap size={12} style={{ color: "#2d2050", flexShrink: 0 }} />
                  </div>
                );
              }) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "#4a4070", fontSize: 13 }}>
                  No recent activity found
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}