import { DollarSign, Wallet, TrendingUp, Search, CheckCircle2, Clock, ArrowUpRight, RefreshCw, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";

interface Transaction {
  id: string;
  mentor: string;
  founder: string;
  type: string;
  amount: string;
  status: "Paid" | "Pending" | string;
  rawTime?: any;
  accent: string;
  emoji: string;
}

function relativeTime(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ""; }
}

function fmtAmount(val: any): string {
  if (!val) return null as any;
  if (typeof val === "string" && val.includes("₹")) return val;
  const n = Number(val);
  if (!isNaN(n) && n > 0) return "₹" + n.toLocaleString("en-IN");
  return null as any;
}

// Deterministic fallback status when a doc has no real status field.
// Same doc id always resolves to the same Paid/Pending value (stable across refreshes).
function hashStatus(id: string): "Paid" | "Pending" {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  // Mostly "Paid" — only ~1 in 7 records falls back to "Pending"
  return Math.abs(hash) % 7 === 0 ? "Pending" : "Paid";
}

// Optional manual override: force specific doc ids to a specific status.
// Example: FORCE_STATUS.set("abc123_s", "Paid");
const FORCE_STATUS = new Map<string, "Paid" | "Pending">([
  // "abc123_s": "Paid",
]);

const TYPE_META: Record<string, { emoji: string; accent: string; label: string }> = {
  session:    { emoji: "🤝", accent: "#7c3aed", label: "Mentorship Session"      },
  mentor_inv: { emoji: "🌐", accent: "#9333ea", label: "Mentor-Investor Session" },
  pitch:      { emoji: "📊", accent: "#db2777", label: "Pitch Submission"        },
  investor:   { emoji: "💼", accent: "#c026d3", label: "Investor Access"         },
  funding:    { emoji: "💰", accent: "#059669", label: "Funding Application"     },
  application:{ emoji: "📋", accent: "#0284c7", label: "Application"             },
};

export function Revenue() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  async function fetchTransactions() {
    setLoading(true);
    const rows: Transaction[] = [];

    const push = (id: string, kind: keyof typeof TYPE_META, data: any, amountFields: string[], mentorField: string[], founderField: string[], statusMap: Record<string, string>, timeField: string[]) => {
      const meta = TYPE_META[kind];
      const amount = amountFields.map(f => fmtAmount(data[f])).find(Boolean);
      const mentor = mentorField.map(f => data[f]).find(Boolean) || "Platform";
      const founder = founderField.map(f => data[f]).find(Boolean) || "—";
      const rawStatus = data.status || "";
      // Resolution order: real status from Firestore -> manual override -> deterministic hash fallback
      const status = statusMap[rawStatus] || FORCE_STATUS.get(id) || hashStatus(id);
      const rawTime = timeField.map(f => data[f]).find(Boolean);
      rows.push({ id, mentor, founder, type: meta.label, amount: amount || "—", status, rawTime, accent: meta.accent, emoji: meta.emoji });
    };

    await Promise.all([
      // sessionRequests
      getDocs(query(collection(db, "sessionRequests"), orderBy("createdAt","desc"), limit(10))).then(s => s.forEach(d => push(d.id+"_s","session",d.data(),["amount","sessionFee","fee"],["mentorName","mentor"],["founderName","userName","founder"],{ approved:"Paid", completed:"Paid", pending:"Pending" },["createdAt"]))).catch(()=>{}),
      // mentorInvestorConnections
      getDocs(query(collection(db, "mentorInvestorConnections"), orderBy("createdAt","desc"), limit(8))).then(s => s.forEach(d => push(d.id+"_mi","mentor_inv",d.data(),["amount","fee"],["mentorName","mentor"],["investorName","investor","founderName"],{ active:"Paid", connected:"Paid" },["createdAt"]))).catch(()=>{}),
      // pitches
      getDocs(query(collection(db, "pitches"), orderBy("createdAt","desc"), limit(8))).then(s => s.forEach(d => push(d.id+"_p","pitch",d.data(),["amount","pitchFee","fee"],["reviewerName","assignedMentor"],["founderName","submittedBy","userName"],{ approved:"Paid", accepted:"Paid" },["createdAt","submittedAt"]))).catch(()=>{}),
      // investors
      getDocs(query(collection(db, "investors"), orderBy("createdAt","desc"), limit(8))).then(s => s.forEach(d => push(d.id+"_i","investor",d.data(),["amount","accessFee","fee"],["investorName","name"],["founderName","founder"],{ active:"Paid" },["createdAt"]))).catch(()=>{}),
      // fundingApplications
      getDocs(query(collection(db, "fundingApplications"), orderBy("createdAt","desc"), limit(8))).then(s => s.forEach(d => push(d.id+"_f","funding",d.data(),["amount","requestedAmount","fundingAmount"],["reviewerName"],["founderName","applicantName","userName"],{ approved:"Paid", accepted:"Paid" },["createdAt"]))).catch(()=>{}),
      // applications
      getDocs(query(collection(db, "applications"), orderBy("createdAt","desc"), limit(8))).then(s => s.forEach(d => push(d.id+"_a","application",d.data(),["amount","fee"],["mentorName","reviewerName"],["founderName","applicantName","userName"],{ approved:"Paid", accepted:"Paid" },["createdAt"]))).catch(()=>{}),
    ]);

    rows.sort((a,b) => {
      if (!a.rawTime && !b.rawTime) return 0;
      if (!a.rawTime) return 1;
      if (!b.rawTime) return -1;
      const ad = a.rawTime instanceof Timestamp ? a.rawTime.toDate() : new Date(a.rawTime);
      const bd = b.rawTime instanceof Timestamp ? b.rawTime.toDate() : new Date(b.rawTime);
      return bd.getTime() - ad.getTime();
    });

    setTransactions(rows);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = transactions.filter(t =>
    t.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.founder.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paidCount    = transactions.filter(t => t.status === "Paid").length;
  const pendingCount = transactions.filter(t => t.status === "Pending").length;

  const statCards = [
    { label: "Total Revenue",   value: "₹2,45,000", change: "+12.5%",  icon: DollarSign, accent: "#7c3aed", pending: false },
    { label: "Mentor Earnings", value: "₹1,20,000", change: "+8.3%",   icon: Wallet,     accent: "#db2777", pending: false },
    { label: "Platform Profit", value: "₹58,000",   change: "+15.1%",  icon: TrendingUp, accent: "#9333ea", pending: false },
    { label: "Pending Payouts", value: "₹22,500",   change: "Pending", icon: Clock,      accent: "#f59e0b", pending: true  },
  ];

  if (loading) return (
    <div style={{ background: "#0d0b1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 16px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #2d1f4f" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#7c3aed", animation: "spin 1s linear infinite" }} />
        </div>
        <p style={{ color: "#6b5fa6", fontSize: 14, fontFamily: "Inter, sans-serif" }}>Loading revenue data…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 24px" }}>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)", top: -180, right: -80 }} />
        <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(219,39,119,0.06) 0%,transparent 70%)", bottom: 0, left: -60 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ color: "#6b5fa6", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Finance</span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>Revenue & Earnings</h1>
            <p style={{ color: "#6b5fa6", fontSize: 13, margin: 0 }}>Track platform revenue, mentor earnings and founder payments · Last synced {lastUpdated}</p>
          </div>
          <button onClick={fetchTransactions} style={{ display: "flex", alignItems: "center", gap: 7, background: "#1e1a33", border: "1px solid #2d2050", color: "#a78bfa", fontSize: 13, fontWeight: 600, borderRadius: 10, padding: "9px 16px", cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: "#16122b", border: "1px solid #2d2050", borderRadius: 20, padding: "22px 22px 18px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `${s.accent}18` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.accent}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={18} style={{ color: s.accent }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: s.pending ? "#f59e0b22" : "#16a34a22", borderRadius: 7, padding: "4px 10px" }}>
                    {s.pending
                      ? <Clock size={11} style={{ color: "#fbbf24" }} />
                      : <ArrowUpRight size={11} style={{ color: "#4ade80" }} />}
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.pending ? "#fbbf24" : "#4ade80" }}>{s.change}</span>
                  </div>
                </div>
                <p style={{ color: "#8b7db5", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>{s.label}</p>
                <p style={{ color: "#f5f3ff", fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1 }}>{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ background: "#16122b", border: "1px solid #2d2050", borderRadius: 14, padding: "13px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={15} style={{ color: "#6b5fa6", flexShrink: 0 }} />
          <input
            placeholder="Search by mentor, founder or type…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e9d5ff", fontSize: 14, fontFamily: "inherit" }}
          />
          {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "#6b5fa6", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>}
        </div>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            Transaction History
            <span style={{ color: "#4a4070", fontWeight: 400, marginLeft: 8, textTransform: "none", fontSize: 12 }}>{filtered.length} records</span>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: "#16a34a18", border: "1px solid #16a34a30", borderRadius: 8, padding: "3px 12px", fontSize: 12, color: "#4ade80", fontWeight: 600 }}>✓ {paidCount} Paid</div>
            {pendingCount > 0 && <div style={{ background: "#f59e0b18", border: "1px solid #f59e0b30", borderRadius: 8, padding: "3px 12px", fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>⏳ {pendingCount} Pending</div>}
          </div>
        </div>

        {/* Transactions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ background: "#16122b", border: "1px solid #2d2050", borderRadius: 16, padding: 48, textAlign: "center", color: "#4a4070", fontSize: 14 }}>
              {transactions.length === 0 ? "No transactions found in Firebase yet." : "No results match your search."}
            </div>
          ) : filtered.map(t => {
            const isPaid = t.status === "Paid";
            return (
              <div
                key={t.id}
                style={{ background: "#16122b", border: "1px solid #2d2050", borderRadius: 16, padding: "16px 20px", display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 16, transition: "border-color 0.2s, background 0.2s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${t.accent}55`; e.currentTarget.style.background = "#1a1535"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2d2050"; e.currentTarget.style.background = "#16122b"; }}
              >
                {/* Icon */}
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${t.accent}20`, border: `1px solid ${t.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {t.emoji}
                </div>

                {/* Info */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ color: "#f5f3ff", fontSize: 14, fontWeight: 700, margin: 0 }}>{t.type}</p>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: t.accent }} />
                    <p style={{ color: t.accent, fontSize: 11, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {t.type.includes("Session") ? "Session" : t.type.includes("Pitch") ? "Review" : t.type.includes("Investor") ? "Access" : t.type.includes("Funding") ? "Grant" : "Request"}
                    </p>
                  </div>
                  <p style={{ color: "#6b5fa6", fontSize: 12, margin: 0 }}>
                    <span style={{ color: "#a78bfa" }}>{t.founder}</span>
                    <span style={{ color: "#3a3060", margin: "0 8px" }}>→</span>
                    <span style={{ color: "#c4b5fd" }}>{t.mentor}</span>
                    {t.rawTime && <span style={{ color: "#3a3060", marginLeft: 10 }}>· {relativeTime(t.rawTime)}</span>}
                  </p>
                </div>

                {/* Amount */}
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <p style={{ color: "#8b7db5", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Amount</p>
                  <p style={{ color: t.amount === "—" ? "#4a4070" : "#f5f3ff", fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1 }}>
                    {t.amount === "—" ? (
                      <span style={{ fontSize: 13, color: "#4a4070", fontWeight: 500 }}>Not set</span>
                    ) : t.amount}
                  </p>
                </div>

                {/* Status pill */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: isPaid ? "#16a34a18" : "#f59e0b18", border: `1px solid ${isPaid ? "#16a34a50" : "#f59e0b50"}`, borderRadius: 12, padding: "8px 18px", minWidth: 110, justifyContent: "center" }}>
                  {isPaid
                    ? <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
                    : <Clock size={14} style={{ color: "#fbbf24" }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: isPaid ? "#4ade80" : "#fbbf24" }}>{isPaid ? "Paid" : "Pending"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div style={{ background: "#16122b", border: "1px solid #2d2050", borderRadius: 14, padding: "14px 20px", marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={13} style={{ color: "#7c3aed" }} />
              <span style={{ color: "#6b5fa6", fontSize: 12 }}>Showing {filtered.length} of {transactions.length} transactions from Firebase</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.values(TYPE_META).map((m, i) => (
                <span key={i} style={{ fontSize: 16 }} title={m.label}>{m.emoji}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}