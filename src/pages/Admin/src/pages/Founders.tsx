import { useState, useEffect } from "react";
import { Search, Trash2, CheckCircle, Loader2, RefreshCw, Users, Activity, Clock, Shield, ArrowUpRight, Zap } from "lucide-react";
import { db } from "../../../../firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

interface Founder {
  id: string;
  name: string;
  email: string;
  role: "Founder";
  status: "Active" | "Pending" | "Suspended";
  avatar: string;
  source: string;
}

/* ─── Shared style tokens (mirrors Dashboard) ─── */
const T = {
  page:      { background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  card:      { background: "#16122b", border: "1px solid #2d2050", borderRadius: 16 },
  cardPad:   { padding: "20px 22px" },
  title:     { color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const },
  label:     { color: "#8b7db5", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  value:     { color: "#f5f3ff" },
  muted:     { color: "#6b5fa6" },
  row:       { background: "#0f0c1f", border: "1px solid #1e1a33", borderRadius: 12 },
  badge: (color: string, bg: string) => ({
    background: bg,
    color,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    display: "inline-block",
    border: `1px solid ${color}33`,
  }),
};

const STATUS_CONFIG = {
  Active:    { color: "#4ade80", bg: "#052e16", dot: "#4ade80" },
  Pending:   { color: "#fbbf24", bg: "#3b2a04", dot: "#fbbf24" },
  Suspended: { color: "#f87171", bg: "#3b0a0a", dot: "#f87171" },
};

/* ─── Custom tooltip-style confirm ─── */
function GlowButton({ children, onClick, disabled, accent = "#7c3aed", outline = false, small = false }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: small ? "5px 12px" : "8px 16px",
        borderRadius: 9,
        border: `1px solid ${accent}55`,
        background: hover ? `${accent}22` : outline ? "transparent" : `${accent}18`,
        color: accent,
        fontSize: small ? 12 : 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function Founders() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFounders = async () => {
    setLoading(true);
    try {
const allFounders: Founder[] = [];

const foundersSnap = await getDocs(collection(db, "founders"));
const photoMap = new Map<string, string>();
foundersSnap.docs.forEach((d) => {
  const data = d.data();
  const email = (data.email || "").toLowerCase();
  const photo = data.photoURL || data.photo || data.avatar || "";
  if (email && photo) photoMap.set(email, photo);
});
      const sessionSnap = await getDocs(collection(db, "sessionRequests"));
      const founderEmails = new Set<string>();

      sessionSnap.docs.forEach((d) => {
        const data = d.data();
        const email = data.founder || data.founderEmail || "";
        if (email && !founderEmails.has(email)) {
          founderEmails.add(email);
          allFounders.push({
            id: `founder-${d.id}`,
            name: data.founderName || email.split("@")[0] || "Founder",
            email,
            role: "Founder",
            status: data.status === "accepted" ? "Active" : data.status === "pending" ? "Pending" : "Suspended",
avatar: photoMap.get(email.toLowerCase()) || `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split("@")[0])}&background=7c3aed&color=fff`,
            source: d.id,
          });
        }
      });

      const pitchSnap = await getDocs(collection(db, "pitches"));
      const pitchEmails = new Set(Array.from(founderEmails));
      pitchSnap.docs.forEach((d) => {
        const data = d.data();
        const email = data.founderEmail || "";
        if (email && !pitchEmails.has(email)) {
          pitchEmails.add(email);
          allFounders.push({
            id: `pitch-founder-${d.id}`,
            name: email.split("@")[0] || "Founder",
            email,
            role: "Founder",
            status: "Active",
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split("@")[0])}&background=7c3aed&color=fff`,
            source: d.id,
          });
        }
      });

      setFounders(allFounders);
    } catch (err) {
      console.error("Failed to load founders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFounders(); }, []);

  const handleApprove = async (founder: Founder) => {
    setActionLoading(founder.id);
    try {
      if (founder.source) await updateDoc(doc(db, "sessionRequests", founder.source), { status: "accepted" });
      setFounders(prev => prev.map(u => u.id === founder.id ? { ...u, status: "Active" } : u));
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleSuspend = async (founder: Founder) => {
    setActionLoading(founder.id);
    try {
      if (founder.source) await updateDoc(doc(db, "sessionRequests", founder.source), { status: "suspended" });
      setFounders(prev => prev.map(u => u.id === founder.id ? { ...u, status: "Suspended" } : u));
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleActivate = async (founder: Founder) => {
    setActionLoading(founder.id);
    try {
      if (founder.source) await updateDoc(doc(db, "sessionRequests", founder.source), { status: "accepted" });
      setFounders(prev => prev.map(u => u.id === founder.id ? { ...u, status: "Active" } : u));
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleDelete = async (founder: Founder) => {
    if (!window.confirm(`Delete ${founder.name}?`)) return;
    setActionLoading(founder.id);
    try {
      await deleteDoc(doc(db, "sessionRequests", founder.source));
      setFounders(prev => prev.filter(u => u.id !== founder.id));
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const filteredFounders = founders.filter((u) => {
    const matchesSearch = !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActive    = founders.filter(u => u.status === "Active").length;
  const totalPending   = founders.filter(u => u.status === "Pending").length;
  const totalSuspended = founders.filter(u => u.status === "Suspended").length;

  const stats = [
    { label: "Total Founders", value: founders.length, icon: Users,    accent: "#7c3aed", change: "All time" },
    { label: "Active",         value: totalActive,     icon: Activity, accent: "#4ade80", change: `${Math.round((totalActive / (founders.length || 1)) * 100)}% of total` },
    { label: "Pending",        value: totalPending,    icon: Clock,    accent: "#fbbf24", change: totalPending > 0 ? "Needs review" : "All clear" },
    { label: "Suspended",      value: totalSuspended,  icon: Shield,   accent: "#f87171", change: totalSuspended > 0 ? "Restricted access" : "None" },
  ];

  /* ── Loading skeleton ── */
  if (loading) return (
    <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 16px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #2d1f4f" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        </div>
        <p style={{ color: "#6b5fa6", fontSize: 14 }}>Loading founders…</p>
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
              <span style={{ ...T.muted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Admin Panel
              </span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: 0 }}>Founder Management</h1>
            <p style={{ ...T.muted, fontSize: 13, margin: "4px 0 0" }}>
              {founders.length} founders across all sources
            </p>
          </div>

          <GlowButton onClick={loadFounders} accent="#7c3aed">
            <RefreshCw size={14} />
            Refresh
          </GlowButton>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ ...T.card, ...T.cardPad, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", background: `${s.accent}12` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ ...T.label, margin: 0 }}>{s.label}</p>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={15} style={{ color: s.accent }} />
                  </div>
                </div>
                <p style={{ color: "#f5f3ff", fontSize: 32, fontWeight: 900, margin: "10px 0 4px", lineHeight: 1 }}>{s.value}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowUpRight size={12} style={{ color: s.accent }} />
                  <span style={{ color: s.accent, fontSize: 11, fontWeight: 600 }}>{s.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div style={{ ...T.card, ...T.cardPad, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a4070" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 10,
                color: "#f5f3ff", fontSize: 13, padding: "10px 14px 10px 36px",
                outline: "none",
              }}
            />
          </div>

          {/* Status pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "active", "pending", "suspended"].map((f) => {
              const active = statusFilter === f;
              const accent = f === "active" ? "#4ade80" : f === "pending" ? "#fbbf24" : f === "suspended" ? "#f87171" : "#a78bfa";
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: `1px solid ${active ? accent : "#2d2050"}`,
                    background: active ? `${accent}22` : "transparent",
                    color: active ? accent : "#6b5fa6",
                    cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
                  }}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table Card ── */}
        <div style={{ ...T.card }}>
          {/* Table header */}
          <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ ...T.title, margin: 0 }}>
              All Founders
              <span style={{ color: "#4a4070", marginLeft: 8, fontWeight: 400, textTransform: "none", fontSize: 12 }}>
                ({filteredFounders.length} results)
              </span>
            </p>
            {totalPending > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#ff000015", border: "1px solid #f8717140", borderRadius: 8, padding: "4px 10px" }}>
                <Shield size={11} style={{ color: "#f87171" }} />
                <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>{totalPending} pending approval</span>
              </div>
            )}
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2.5fr 1fr 1fr 1.5fr", gap: 0, padding: "10px 22px", borderBottom: "1px solid #1e1a33" }}>
            {["Founder", "Email", "Role", "Status", "Actions"].map((h, i) => (
              <span key={h} style={{ ...T.label, fontSize: 11, textAlign: i === 4 ? "right" : "left" as any }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredFounders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Search size={36} style={{ color: "#2d2050", margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "#4a4070", fontSize: 14 }}>No founders match your filters.</p>
              </div>
            ) : filteredFounders.map((founder) => {
              const sc = STATUS_CONFIG[founder.status];
              const isLoading = actionLoading === founder.id;

              return (
                <div
                  key={founder.id}
                  style={{
                    ...T.row,
                    display: "grid",
                    gridTemplateColumns: "2fr 2.5fr 1fr 1fr 1.5fr",
                    alignItems: "center",
                    padding: "12px 14px",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b3060")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1a33")}
                >
                  {/* Name + avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
  src={founder.avatar}
  alt={founder.name}
  onError={(e) => {
    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&background=7c3aed&color=fff`;
  }}
  style={{ width: 36, height: 36, borderRadius: 10, display: "block", objectFit: "cover" }}
/>
                      <div style={{
                        position: "absolute", bottom: -2, right: -2,
                        width: 9, height: 9, borderRadius: "50%",
                        background: sc.dot, border: "2px solid #0f0c1f",
                        boxShadow: `0 0 6px ${sc.dot}`,
                      }} />
                    </div>
                    <div>
                      <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 700, margin: 0 }}>{founder.name}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <span style={{ color: "#6b5fa6", fontSize: 12 }}>{founder.email}</span>

                  {/* Role */}
                  <span style={T.badge("#a78bfa", "#2d1f4f")}>Founder</span>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, boxShadow: `0 0 5px ${sc.dot}` }} />
                    <span style={{ color: sc.color, fontSize: 12, fontWeight: 700 }}>{founder.status}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    {isLoading ? (
                      <Loader2 size={14} style={{ color: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <>
                        {founder.status === "Pending" && (
                          <GlowButton small onClick={() => handleApprove(founder)} accent="#4ade80">
                            <CheckCircle size={12} /> Approve
                          </GlowButton>
                        )}
                        {founder.status === "Active" && (
                          <GlowButton small onClick={() => handleSuspend(founder)} accent="#fbbf24">
                            Suspend
                          </GlowButton>
                        )}
                        {founder.status === "Suspended" && (
                          <GlowButton small onClick={() => handleActivate(founder)} accent="#4ade80">
                            Activate
                          </GlowButton>
                        )}
                        <button
                          onClick={() => handleDelete(founder)}
                          style={{
                            background: "transparent", border: "1px solid #f8717130",
                            color: "#f87171", borderRadius: 8, padding: "5px 8px",
                            cursor: "pointer", display: "flex", alignItems: "center",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f8717115")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <Trash2 size={13} />
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