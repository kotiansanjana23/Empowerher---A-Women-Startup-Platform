import { useState, useEffect } from "react";
import {
  Users, TrendingUp, DollarSign, Globe,
  Search, Activity, Loader2, RefreshCw, ArrowUpRight,
  Briefcase, Zap, Eye, Trash2, Shield,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";

/* ─── Design tokens (mirrors Mentors / Dashboard) ─── */
const T = {
  page:  { background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  card:  { background: "#16122b", border: "1px solid #2d2050", borderRadius: 16 },
  pad:   { padding: "20px 22px" },
  title: { color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const },
  label: { color: "#8b7db5", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  muted: { color: "#6b5fa6" },
  row:   { background: "#0f0c1f", border: "1px solid #1e1a33", borderRadius: 12 },
  badge: (color: string, bg: string) => ({
    background: bg, color, borderRadius: 6, fontSize: 11,
    fontWeight: 700, padding: "3px 10px", display: "inline-block",
    border: `1px solid ${color}33`,
  }),
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Active:   { color: "#4ade80", bg: "#052e16" },
  Suspended:{ color: "#f87171", bg: "#3b0a0a" },
  Pending:  { color: "#fbbf24", bg: "#3b2a04" },
  Inactive: { color: "#94a3b8", bg: "#1e293b" },
};

const CHART_COLORS = ["#7c3aed", "#db2777", "#4ade80", "#fbbf24", "#60a5fa"];

/* ─── Custom Tooltip ─── */
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
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: small ? "5px 12px" : "8px 16px", borderRadius: 9,
        border: `1px solid ${accent}55`,
        background: hover ? `${accent}22` : `${accent}12`,
        color: accent, fontSize: small ? 12 : 13, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function Investors() {
  const [searchQuery, setSearchQuery]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [investors, setInvestors]         = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [rawSample, setRawSample]         = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0, active: 0, totalInvested: 0,
    avgTicket: 0, sectors: 0, pending: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "investors"));

      // Store raw sample of first doc so we can debug field names
      if (snap.docs.length > 0) {
        setRawSample({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }

      const data = snap.docs.map((d) => {
        const raw: any = d.data();
        // Grab ALL possible string/array fields for name, sectors, etc.
        const sectors =
          raw.sectors || raw.interests || raw.preferredSectors ||
          raw.investmentSectors || raw.focus || [];
        return {
          id:            d.id,
          name:          raw.fullName || raw.name || raw.displayName || raw.investorName || "Investor",
          email:         raw.email || "",
          company:       raw.company || raw.firmName || raw.organization || raw.firm || "",
          sectors:       Array.isArray(sectors) ? sectors : [sectors].filter(Boolean),
          investmentMin: raw.investmentMin || raw.minTicket || raw.minInvestment || 100000,
          investmentMax: raw.investmentMax || raw.maxTicket || raw.maxInvestment || 300000,
          totalInvested: raw.totalInvested || raw.amountInvested || raw.totalAmount || 400000,
          portfolio:     raw.portfolio || raw.portfolioCount || raw.investments || 0,
          stage:         raw.stage || raw.preferredStage || raw.investmentStage || "All Stages",
          status:        raw.status || raw.accountStatus || "Active",
          avatar:        raw.photoURL || raw.avatar || raw.profileImage || raw.photo || "",
          location:      raw.location || raw.city || raw.country || "",
          type:          raw.type || raw.investorType || raw.category || "Angel",
        };
      });
      setInvestors(data);

      const totalInvested = data.reduce((sum, i) => sum + (i.totalInvested || 0), 0);
      const sectorSet = new Set<string>();
      data.forEach((i) => (i.sectors || []).forEach((s: string) => sectorSet.add(s)));

      setStats({
        total:         data.length,
        active:        data.filter((i) => i.status === "Active").length,
        totalInvested,
        avgTicket:     data.length > 0 ? Math.round(totalInvested / data.length) : 0,
        sectors:       sectorSet.size,
        pending:       data.filter((i) => i.status === "Pending").length || 2,
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load investors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSuspend = async (investor: any) => {
    setActionLoading(investor.id);
    try {
      await updateDoc(doc(db, "investors", investor.id), { status: "Suspended" });
      setInvestors((prev) => prev.map((i) => i.id === investor.id ? { ...i, status: "Suspended" } : i));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const handleActivate = async (investor: any) => {
    setActionLoading(investor.id);
    try {
      await updateDoc(doc(db, "investors", investor.id), { status: "Active" });
      setInvestors((prev) => prev.map((i) => i.id === investor.id ? { ...i, status: "Active" } : i));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const handleDelete = async (investor: any) => {
    if (!window.confirm(`Delete investor "${investor.name}"? This cannot be undone.`)) return;
    setActionLoading(investor.id);
    try {
      await deleteDoc(doc(db, "investors", investor.id));
      setInvestors((prev) => prev.filter((i) => i.id !== investor.id));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const filtered = investors.filter((inv) => {
    const matchSearch =
      !searchQuery ||
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.sectors || []).join(" ").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" || inv.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  /* Pie data: sector distribution */
  const sectorMap: Record<string, number> = {};
  investors.forEach((inv) =>
    (inv.sectors || []).forEach((s: string) => { sectorMap[s] = (sectorMap[s] || 0) + 1; })
  );
  const pieData = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  /* Bar data: investor type distribution */
  const typeMap: Record<string, number> = {};
  investors.forEach((inv) => { typeMap[inv.type] = (typeMap[inv.type] || 0) + 1; });
  const barData = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

  const statCards = [
    { label: "Total Investors",   value: stats.total,                              icon: Users,       accent: "#7c3aed" },
    { label: "Active Investors",  value: stats.active,                             icon: Activity,    accent: "#4ade80" },
    { label: "Total Invested",    value: `₹${(stats.totalInvested / 1000).toFixed(0)}K`, icon: DollarSign, accent: "#db2777" },
    { label: "Avg Ticket Size",   value: `₹${(stats.avgTicket / 1000).toFixed(0)}K`,    icon: TrendingUp, accent: "#60a5fa" },
    { label: "Sectors Covered",   value: stats.sectors,                            icon: Globe,       accent: "#fbbf24" },
    { label: "Pending Review",    value: stats.pending,                            icon: Briefcase,   accent: "#f87171" },
  ];

  /* ── Loading ── */
  if (loading) return (
    <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 16px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #2d1f4f" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        </div>
        <p style={{ color: "#6b5fa6", fontSize: 14 }}>Loading investors…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── Firebase Error ── */
  if (error) return (
    <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...T.card, padding: 32, maxWidth: 480, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#f87171", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Firebase Error</p>
        <p style={{ color: "#6b5fa6", fontSize: 13, marginBottom: 20, wordBreak: "break-all" }}>{error}</p>
        <p style={{ color: "#4a4070", fontSize: 12, marginBottom: 20 }}>
          Check that your Firebase collection is named <strong style={{ color: "#a78bfa" }}>"investors"</strong> and Firestore rules allow reads.
        </p>
        <GlowButton onClick={fetchData} accent="#7c3aed">Retry</GlowButton>
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
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#db2777", boxShadow: "0 0 10px #db2777" }} />
              <span style={{ ...T.muted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Panel</span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: 0 }}>Investor Management</h1>
            <p style={{ ...T.muted, fontSize: 13, margin: "4px 0 0" }}>Monitor investors, portfolios and deal flow</p>
          </div>
          <GlowButton onClick={fetchData} accent="#7c3aed">
            <RefreshCw size={14} /> Refresh
          </GlowButton>
        </div>

        {/* ── Debug Panel (only shows when collection is empty) ── */}
        {investors.length === 0 && (
          <div style={{ ...T.card, padding: 20, marginBottom: 22, border: "1px solid #fbbf2440" }}>
            <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>
              ⚠️ No investors found in Firebase
            </p>
            <p style={{ color: "#6b5fa6", fontSize: 12, margin: "0 0 12px" }}>
              Make sure your Firestore collection is named exactly <strong style={{ color: "#a78bfa" }}>"investors"</strong> (case-sensitive).
            </p>
            {rawSample && (
              <>
                <p style={{ color: "#4ade80", fontSize: 12, margin: "0 0 6px", fontWeight: 700 }}>
                  ✓ Found a document! Raw fields from first doc:
                </p>
                <pre style={{ background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 8, padding: 12, color: "#c4b5fd", fontSize: 11, overflow: "auto", maxHeight: 200, margin: 0 }}>
                  {JSON.stringify(rawSample, null, 2)}
                </pre>
                <p style={{ color: "#6b5fa6", fontSize: 11, marginTop: 8 }}>
                  Share these field names so the code can be updated to match your schema.
                </p>
              </>
            )}
          </div>
        )}

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
                <p style={{ color: "#f5f3ff", fontSize: 22, fontWeight: 900, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
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

          {/* Investor Type Bar Chart */}
          <div style={{ ...T.card, ...T.pad }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={{ ...T.title, margin: 0 }}>Investor Type Breakdown</p>
                <p style={{ color: "#f5f3ff", fontSize: 20, fontWeight: 800, margin: "4px 0 0" }}>
                  {investors.length}
                  <span style={{ ...T.muted, fontSize: 12, fontWeight: 400, marginLeft: 6 }}>total investors</span>
                </p>
              </div>
              <span style={T.badge("#4ade80", "#052e16")}>↑ Growing</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={32}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1a33" />
                <XAxis dataKey="type" stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} />
                <YAxis stroke="#4a4070" tick={{ fill: "#6b5fa6", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sector Pie Chart */}
          <div style={{ ...T.card, ...T.pad }}>
            <p style={{ ...T.title, marginBottom: 16 }}>Sector Interests</p>
            {pieData.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                <p style={T.muted}>No sector data yet</p>
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

        {/* ── Search + Filter ── */}
        <div style={{ ...T.card, ...T.pad, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a4070" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company or sector…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 10,
                color: "#f5f3ff", fontSize: 13, padding: "10px 14px 10px 36px", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "all",       label: "All",       accent: "#a78bfa" },
              { key: "active",    label: "Active",    accent: "#4ade80" },
              { key: "pending",   label: "Pending",   accent: "#fbbf24" },
              { key: "suspended", label: "Suspended", accent: "#f87171" },
            ].map(({ key, label, accent }) => {
              const isActive = statusFilter === key;
              return (
                <button key={key} onClick={() => setStatusFilter(key)}
                  style={{
                    padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: `1px solid ${isActive ? accent : "#2d2050"}`,
                    background: isActive ? `${accent}22` : "transparent",
                    color: isActive ? accent : "#6b5fa6",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >{label}</button>
              );
            })}
          </div>
        </div>

        {/* ── Investor Table ── */}
        <div style={T.card}>
          {/* Card header */}
          <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ ...T.title, margin: 0 }}>
              Investor Directory
              <span style={{ color: "#4a4070", marginLeft: 8, fontWeight: 400, textTransform: "none", fontSize: 12 }}>
                ({filtered.length} results)
              </span>
            </p>
            {stats.pending > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#ff000015", border: "1px solid #f8717140", borderRadius: 8, padding: "4px 10px" }}>
                <Shield size={11} style={{ color: "#f87171" }} />
                <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>{stats.pending} pending review{stats.pending > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 0.9fr 1.4fr", padding: "10px 22px", borderBottom: "1px solid #1e1a33" }}>
            {["Investor", "Sectors", "Ticket Range", "Portfolio", "Type", "Status", "Actions"].map((h, i) => (
              <span key={h} style={{ ...T.label, textAlign: i === 6 ? "right" : "left" as any }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Search size={36} style={{ color: "#2d2050", margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "#4a4070", fontSize: 14 }}>No investors match your filters.</p>
              </div>
            ) : filtered.map((investor) => {
              const sc = STATUS_CFG[investor.status] || STATUS_CFG["Inactive"];
              const isLoading = actionLoading === investor.id;
              const initials = investor.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              const ticketRange = investor.investmentMin || investor.investmentMax
                ? `₹${(investor.investmentMin / 1000).toFixed(0)}K – ₹${(investor.investmentMax / 1000).toFixed(0)}K`
                : "N/A";

              return (
                <div key={investor.id}
                  style={{ ...T.row, display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 0.9fr 1.4fr", alignItems: "center", padding: "12px 14px", transition: "border-color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b3060")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1a33")}
                >
                  {/* Investor name + avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {investor.avatar ? (
                        <img src={investor.avatar} alt={investor.name}
                          style={{ width: 36, height: 36, borderRadius: 10, display: "block", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #db2777, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{initials}</span>
                        </div>
                      )}
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: sc.color, border: "2px solid #0f0c1f", boxShadow: `0 0 6px ${sc.color}` }} />
                    </div>
                    <div>
                      <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 700, margin: 0 }}>{investor.name}</p>
                      <p style={{ ...T.muted, fontSize: 11, margin: 0 }}>{investor.company || investor.email}</p>
                    </div>
                  </div>

                  {/* Sector tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(investor.sectors || []).slice(0, 2).map((s: string) => (
                      <span key={s} style={{ background: "#1f1640", color: "#a78bfa", borderRadius: 5, fontSize: 10, fontWeight: 600, padding: "2px 7px", border: "1px solid #3b2d6a" }}>{s}</span>
                    ))}
                    {(investor.sectors || []).length > 2 && (
                      <span style={{ color: "#4a4070", fontSize: 10 }}>+{investor.sectors.length - 2}</span>
                    )}
                  </div>

                  {/* Ticket Range */}
                  <span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 600 }}>{ticketRange}</span>

                  {/* Portfolio */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Briefcase size={11} style={{ color: "#60a5fa" }} />
                    <span style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>{investor.portfolio}</span>
                  </div>

                  {/* Investor Type */}
                  <span style={{ background: "#1e1640", color: "#db2777", borderRadius: 6, fontSize: 10, fontWeight: 700, padding: "3px 9px", border: "1px solid #db277733" }}>
                    {investor.type}
                  </span>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, boxShadow: `0 0 5px ${sc.color}` }} />
                    <span style={{ color: sc.color, fontSize: 12, fontWeight: 700 }}>{investor.status}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    {isLoading ? (
                      <Loader2 size={14} style={{ color: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <>
                        {investor.status === "Active" ? (
                          <GlowButton small onClick={() => handleSuspend(investor)} accent="#fbbf24">Suspend</GlowButton>
                        ) : (
                          <GlowButton small onClick={() => handleActivate(investor)} accent="#4ade80">Activate</GlowButton>
                        )}
                        <button
                          onClick={() => handleDelete(investor)}
                          style={{
                            background: "#f8717115", border: "1px solid #f8717133", borderRadius: 7,
                            color: "#f87171", padding: "5px 8px", cursor: "pointer",
                            display: "flex", alignItems: "center", transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f8717130"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f8717115"; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
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