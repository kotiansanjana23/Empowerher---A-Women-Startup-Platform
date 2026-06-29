import { useState, useEffect } from "react";
import {
  Mail, AlertTriangle, RefreshCw, Search,
  ArrowUpRight, CheckCircle, Clock, Loader2,
  MessageSquare, Bug, User, Calendar, Tag,
  ChevronDown, ChevronUp, Shield,
} from "lucide-react";
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "../../../../firebase";

/* ─── Design tokens ─── */
const T = {
  page:  { background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  card:  { background: "#16122b", border: "1px solid #2d2050", borderRadius: 16 },
  pad:   { padding: "20px 22px" },
  title: { color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const },
  label: { color: "#8b7db5", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  muted: { color: "#6b5fa6" },
  row:   { background: "#0f0c1f", border: "1px solid #1e1a33", borderRadius: 12 },
};

const SOURCE_CFG: Record<string, { color: string; bg: string; label: string }> = {
  landing_page: { color: "#60a5fa", bg: "#1e3a5f", label: "Landing Page" },
  founder:      { color: "#a78bfa", bg: "#2d1f4f", label: "Founder" },
  mentor:       { color: "#4ade80", bg: "#052e16", label: "Mentor" },
  investor:     { color: "#fbbf24", bg: "#3b2a04", label: "Investor" },
  default:      { color: "#94a3b8", bg: "#1e293b", label: "Unknown" },
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  pending:  { color: "#fbbf24", bg: "#3b2a04" },
  resolved: { color: "#4ade80", bg: "#052e16" },
  rejected: { color: "#f87171", bg: "#3b0a0a" },
};

const CATEGORY_COLORS = [
  "#7c3aed", "#db2777", "#4ade80", "#fbbf24", "#60a5fa", "#f97316",
];

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

/* ─── Expandable row ─── */
function ExpandableRow({ children, expanded, onClick }: any) {
  return (
    <div
      onClick={onClick}
      style={{
        ...T.row, padding: "14px 16px", cursor: "pointer",
        transition: "border-color 0.15s",
        borderColor: expanded ? "#3b3060" : "#1e1a33",
      }}
      onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.borderColor = "#2d2050"; }}
      onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.borderColor = "#1e1a33"; }}
    >
      {children}
    </div>
  );
}

export function Messages() {
  const [tab, setTab]               = useState<"contact" | "issues">("contact");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contactMsgs, setContactMsgs]   = useState<any[]>([]);
  const [reportedIssues, setReportedIssues] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalContact: 0, totalIssues: 0, pendingIssues: 0, resolvedIssues: 0,
  });

 const fetchData = async () => {
    setLoading(true);
    try {
      /* Build a photo map from founders/mentors/investors */
      const photoMap = new Map<string, string>();
      const [foundersSnap, mentorsSnap, investorsSnap] = await Promise.all([
        getDocs(collection(db, "founders")).catch(() => null),
        getDocs(collection(db, "mentors")).catch(() => null),
        getDocs(collection(db, "investors")).catch(() => null),
      ]);
      [foundersSnap, mentorsSnap, investorsSnap].forEach((snap) => {
        snap?.docs.forEach((d) => {
          const data: any = d.data();
          const photo = data.photoURL || data.photo || data.avatar || "";
          if (photo) photoMap.set(d.id, photo);
        });
      });


      /* contactMessages */
const contactSnap = await getDocs(collection(db, "contactMessages"));

const contacts = contactSnap.docs.map((d) => {
  const r: any = d.data();
  const email = r.mentorEmail || r.founderEmail || r.investorEmail || r.email || "";
  const senderId = r.mentorId || r.founderId || r.investorId || "";
  return {
    id:          d.id,
    name:        r.name || email.split("@")[0] || "Anonymous",
    email,
    message:     r.message || "",
    source:      r.mentorId ? "mentor" : r.investorId ? "investor" : r.founderId ? "founder" : (r.source || "default"),
    submittedAt: r.createdAt?.toDate?.() || r.submittedAt?.toDate?.() || new Date(),
    photo:       photoMap.get(senderId) || "",
  };
}).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      /* reportedIssues */
      const issuesSnap = await getDocs(
        query(collection(db, "reportedIssues"), orderBy("createdAt", "desc"))
      ).catch(() => getDocs(collection(db, "reportedIssues")));

      const issues = issuesSnap.docs.map((d) => {
        const r: any = d.data();
        return {
          id:               d.id,
          founderEmail:     r.founderEmail || r.investorEmail || r.mentorEmail || r.email || r.userEmail || "",
          founderId:        r.founderId || r.investorId || r.mentorId || r.userId || "",
                    photo:            photoMap.get(r.founderId || r.investorId || r.mentorId || r.userId || "") || "",
          issueCategory:    r.issueCategory || r.category || "General",
          issueDescription: r.issueDescription || r.description || r.message || "",
          status:           r.status || "pending",
          createdAt:        r.createdAt?.toDate?.() || new Date(),
        };
      });

      setContactMsgs(contacts);
      setReportedIssues(issues);
      setStats({
        totalContact:   contacts.length,
        totalIssues:    issues.length,
        pendingIssues:  issues.filter((i) => i.status === "pending").length,
        resolvedIssues: issues.filter((i) => i.status === "resolved").length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "reportedIssues", id), { status: newStatus });
      setReportedIssues((prev) =>
        prev.map((i) => i.id === id ? { ...i, status: newStatus } : i)
      );
      setStats((prev) => ({
        ...prev,
        pendingIssues:  prev.pendingIssues  + (newStatus === "pending"  ?  1 : -1),
        resolvedIssues: prev.resolvedIssues + (newStatus === "resolved" ?  1 :  0),
      }));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const fmt = (d: Date) =>
    d?.toLocaleDateString?.("en-IN", { day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit" }) ?? "—";

  /* Filtered lists */
  const filteredContacts = contactMsgs.filter((m) =>
    !searchQuery ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIssues = reportedIssues.filter((i) => {
    const matchSearch = !searchQuery ||
      i.founderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.issueCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* Category colors */
  const categoryList = [...new Set(reportedIssues.map((i) => i.issueCategory))];
  const catColor = (cat: string) => CATEGORY_COLORS[categoryList.indexOf(cat) % CATEGORY_COLORS.length];

  /* ── Loading ── */
  if (loading) return (
    <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 16px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #2d1f4f" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        </div>
        <p style={{ color: "#6b5fa6", fontSize: 14 }}>Loading messages…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={T.page}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", top: -200, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)", bottom: 0, right: 0 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 10px #60a5fa" }} />
              <span style={{ ...T.muted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Panel</span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: 0 }}>Messages & Support</h1>
            <p style={{ ...T.muted, fontSize: 13, margin: "4px 0 0" }}>Contact enquiries and reported issues from all users</p>
          </div>
          <GlowButton onClick={fetchData} accent="#7c3aed">
            <RefreshCw size={14} /> Refresh
          </GlowButton>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Contact Messages", value: stats.totalContact,   icon: Mail,          accent: "#60a5fa" },
            { label: "Total Issues",     value: stats.totalIssues,    icon: Bug,           accent: "#7c3aed" },
            { label: "Pending Issues",   value: stats.pendingIssues,  icon: Clock,         accent: "#fbbf24" },
            { label: "Resolved Issues",  value: stats.resolvedIssues, icon: CheckCircle,   accent: "#4ade80" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ ...T.card, ...T.pad, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: `${s.accent}12` }} />
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon size={14} style={{ color: s.accent }} />
                </div>
                <p style={{ color: "#f5f3ff", fontSize: 28, fontWeight: 900, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
                <p style={{ ...T.muted, fontSize: 11, margin: 0 }}>{s.label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6 }}>
                  <ArrowUpRight size={11} style={{ color: s.accent }} />
                  <span style={{ color: s.accent, fontSize: 10, fontWeight: 700 }}>Live</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tab Bar ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {([
            { key: "contact", label: "Contact Messages", icon: Mail,          count: stats.totalContact,  accent: "#60a5fa" },
            { key: "issues",  label: "Reported Issues",  icon: AlertTriangle,  count: stats.pendingIssues, accent: "#fbbf24" },
          ] as const).map(({ key, label, icon: Icon, count, accent }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => { setTab(key); setSearchQuery(""); setStatusFilter("all"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  border: `1px solid ${active ? accent + "55" : "transparent"}`,
                  background: active ? `${accent}18` : "transparent",
                  color: active ? accent : "#6b5fa6",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Icon size={14} />
                {label}
                <span style={{
                  background: active ? `${accent}30` : "#1e1a33",
                  color: active ? accent : "#4a4070",
                  borderRadius: 6, fontSize: 11, fontWeight: 800,
                  padding: "1px 7px", minWidth: 20, textAlign: "center",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search + Filter ── */}
        <div style={{ ...T.card, ...T.pad, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a4070" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tab === "contact" ? "Search by name, email or message…" : "Search by email, category or description…"}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 10,
                color: "#f5f3ff", fontSize: 13, padding: "10px 14px 10px 36px", outline: "none",
              }}
            />
          </div>

          {/* Status filter — only for issues tab */}
          {tab === "issues" && (
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all",      label: "All",      accent: "#a78bfa" },
                { key: "pending",  label: "Pending",  accent: "#fbbf24" },
                { key: "resolved", label: "Resolved", accent: "#4ade80" },
                { key: "rejected", label: "Rejected", accent: "#f87171" },
              ].map(({ key, label, accent }) => {
                const active = statusFilter === key;
                return (
                  <button key={key} onClick={() => setStatusFilter(key)}
                    style={{
                      padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: `1px solid ${active ? accent : "#2d2050"}`,
                      background: active ? `${accent}22` : "transparent",
                      color: active ? accent : "#6b5fa6",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >{label}</button>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════ CONTACT MESSAGES TAB ══════════ */}
        {tab === "contact" && (
          <div style={T.card}>
            <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ ...T.title, margin: 0 }}>
                Contact Enquiries
                <span style={{ color: "#4a4070", marginLeft: 8, fontWeight: 400, textTransform: "none", fontSize: 12 }}>
                  ({filteredContacts.length} messages)
                </span>
              </p>
            </div>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 3fr 1.2fr 1.5fr", padding: "10px 22px", borderBottom: "1px solid #1e1a33" }}>
              {["Sender", "Email", "Message", "Source", "Date"].map((h) => (
                <span key={h} style={T.label}>{h}</span>
              ))}
            </div>

            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredContacts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <Mail size={36} style={{ color: "#2d2050", margin: "0 auto 12px", display: "block" }} />
                  <p style={{ color: "#4a4070", fontSize: 14 }}>No contact messages found.</p>
                </div>
              ) : filteredContacts.map((msg) => {
                const src = SOURCE_CFG[msg.source] || SOURCE_CFG["default"];
                const isExpanded = expandedId === msg.id;
                return (
                  <ExpandableRow key={msg.id} expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : msg.id)}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 3fr 1.2fr 1.5fr", alignItems: "center" }}>
                      {/* Sender */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {msg.photo ? (
                          <img src={msg.photo} alt={msg.name}
                            style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover", flexShrink: 0 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #60a5fa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
                              {msg.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 700, margin: 0 }}>{msg.name}</p>
                      </div>

                      {/* Email */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Mail size={11} style={{ color: "#4a4070", flexShrink: 0 }} />
                        <span style={{ color: "#8b7db5", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.email}</span>
                      </div>

                      {/* Message preview */}
                      <span style={{ color: "#c4b5fd", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "normal" : "nowrap", paddingRight: 8 }}>
                        {msg.message}
                      </span>

                      {/* Source badge */}
                      <span style={{ background: src.bg, color: src.color, borderRadius: 6, fontSize: 10, fontWeight: 700, padding: "3px 9px", border: `1px solid ${src.color}33`, display: "inline-block" }}>
                        {src.label}
                      </span>

                      {/* Date + expand icon */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#4a4070", fontSize: 11 }}>{fmt(msg.submittedAt)}</span>
                        {isExpanded ? <ChevronUp size={14} style={{ color: "#4a4070" }} /> : <ChevronDown size={14} style={{ color: "#4a4070" }} />}
                      </div>
                    </div>

                    {/* Expanded message */}
                    {isExpanded && (
                      <div style={{ marginTop: 14, padding: "14px 16px", background: "#0a0818", borderRadius: 10, border: "1px solid #2d2050" }}
                        onClick={(e) => e.stopPropagation()}>
                        <p style={{ ...T.label, marginBottom: 8 }}>Full Message</p>
                        <p style={{ color: "#c4b5fd", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{msg.message}</p>
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                          <a href={`mailto:${msg.email}`} style={{ textDecoration: "none" }}>
                            <GlowButton small accent="#60a5fa">
                              <Mail size={12} /> Reply via Email
                            </GlowButton>
                          </a>
                        </div>
                      </div>
                    )}
                  </ExpandableRow>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ REPORTED ISSUES TAB ══════════ */}
        {tab === "issues" && (
          <div style={T.card}>
            <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ ...T.title, margin: 0 }}>
                Reported Issues
                <span style={{ color: "#4a4070", marginLeft: 8, fontWeight: 400, textTransform: "none", fontSize: 12 }}>
                  ({filteredIssues.length} issues)
                </span>
              </p>
              {stats.pendingIssues > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#fbbf2415", border: "1px solid #fbbf2440", borderRadius: 8, padding: "4px 10px" }}>
                  <Shield size={11} style={{ color: "#fbbf24" }} />
                  <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>{stats.pendingIssues} awaiting review</span>
                </div>
              )}
            </div>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 3fr 1.2fr 1.5fr 1.4fr", padding: "10px 22px", borderBottom: "1px solid #1e1a33" }}>
              {["Reporter", "Category", "Description", "Status", "Date", "Actions"].map((h, i) => (
                <span key={h} style={{ ...T.label, textAlign: i === 5 ? "right" : "left" as any }}>{h}</span>
              ))}
            </div>

            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredIssues.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <AlertTriangle size={36} style={{ color: "#2d2050", margin: "0 auto 12px", display: "block" }} />
                  <p style={{ color: "#4a4070", fontSize: 14 }}>No issues match your filters.</p>
                </div>
              ) : filteredIssues.map((issue) => {
                const sc = STATUS_CFG[issue.status] || STATUS_CFG["pending"];
                const cc = catColor(issue.issueCategory);
                const isExpanded = expandedId === issue.id;
                const isLoading = actionLoading === issue.id;

                return (
                  <ExpandableRow key={issue.id} expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : issue.id)}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 3fr 1.2fr 1.5fr 1.4fr", alignItems: "center" }}>
                      {/* Reporter */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {issue.photo ? (
                          <img src={issue.photo} alt={issue.founderEmail}
                            style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover", flexShrink: 0 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #7c3aed, #db2777)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={14} style={{ color: "#fff" }} />
                          </div>
                        )}
                        <div>
                          <p style={{ color: "#e9d5ff", fontSize: 12, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                            {issue.founderEmail}
                          </p>
                          <p style={{ ...T.muted, fontSize: 10, margin: 0 }}>Founder</p>
                        </div>
                      </div>

                      {/* Category */}
                      <span style={{ background: `${cc}18`, color: cc, borderRadius: 6, fontSize: 10, fontWeight: 700, padding: "3px 9px", border: `1px solid ${cc}33`, display: "inline-block" }}>
                        {issue.issueCategory}
                      </span>

                      {/* Description preview */}
                      <span style={{ color: "#8b7db5", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "normal" : "nowrap", paddingRight: 8 }}>
                        {issue.issueDescription}
                      </span>

                      {/* Status */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, boxShadow: `0 0 5px ${sc.color}` }} />
                        <span style={{ color: sc.color, fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{issue.status}</span>
                      </div>

                      {/* Date */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={10} style={{ color: "#4a4070" }} />
                        <span style={{ color: "#4a4070", fontSize: 11 }}>{fmt(issue.createdAt)}</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}
                        onClick={(e) => e.stopPropagation()}>
                        {isLoading ? (
                          <Loader2 size={14} style={{ color: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
                        ) : issue.status === "pending" ? (
                          <>
                            <GlowButton small accent="#4ade80" onClick={() => handleStatusChange(issue.id, "resolved")}>
                              <CheckCircle size={11} /> Resolve
                            </GlowButton>
                            <GlowButton small accent="#f87171" onClick={() => handleStatusChange(issue.id, "rejected")}>
                              Reject
                            </GlowButton>
                          </>
                        ) : issue.status === "resolved" ? (
                          <GlowButton small accent="#fbbf24" onClick={() => handleStatusChange(issue.id, "pending")}>
                            Reopen
                          </GlowButton>
                        ) : (
                          <GlowButton small accent="#fbbf24" onClick={() => handleStatusChange(issue.id, "pending")}>
                            Reopen
                          </GlowButton>
                        )}
                        {isExpanded
                          ? <ChevronUp size={14} style={{ color: "#4a4070" }} />
                          : <ChevronDown size={14} style={{ color: "#4a4070" }} />
                        }
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ marginTop: 14, padding: "14px 16px", background: "#0a0818", borderRadius: 10, border: "1px solid #2d2050" }}
                        onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 12 }}>
                          <div>
                            <p style={{ ...T.label, marginBottom: 4 }}>Reporter Email</p>
                            <p style={{ color: "#c4b5fd", fontSize: 13, margin: 0 }}>{issue.founderEmail}</p>
                          </div>
                          <div>
                            <p style={{ ...T.label, marginBottom: 4 }}>Category</p>
                            <p style={{ color: cc, fontSize: 13, margin: 0, fontWeight: 700 }}>{issue.issueCategory}</p>
                          </div>
                          <div>
                            <p style={{ ...T.label, marginBottom: 4 }}>Current Status</p>
                            <p style={{ color: sc.color, fontSize: 13, margin: 0, fontWeight: 700, textTransform: "capitalize" }}>{issue.status}</p>
                          </div>
                        </div>
                        <p style={{ ...T.label, marginBottom: 6 }}>Full Description</p>
                        <p style={{ color: "#c4b5fd", fontSize: 13, lineHeight: 1.7, margin: "0 0 12px" }}>{issue.issueDescription}</p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <a href={`mailto:${issue.founderEmail}`} style={{ textDecoration: "none" }}>
                            <GlowButton small accent="#60a5fa">
                              <Mail size={12} /> Reply via Email
                            </GlowButton>
                          </a>
                        </div>
                      </div>
                    )}
                  </ExpandableRow>
                );
              })}
            </div>
          </div>
        )}
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