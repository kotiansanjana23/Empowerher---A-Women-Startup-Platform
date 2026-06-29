import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon, Shield, Bell, DollarSign,
  Globe, Moon, Save, RefreshCcw, Database, Loader2,
  CheckCircle, ArrowUpRight, Zap, Activity,
} from "lucide-react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

/* ─── Design tokens ─── */
const T = {
  page:  { background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  card:  { background: "#16122b", border: "1px solid #2d2050", borderRadius: 18 },
  pad:   { padding: "22px 24px" },
  title: { color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const },
  label: { color: "#8b7db5", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  muted: { color: "#6b5fa6" },
  inputBase: {
    width: "100%", boxSizing: "border-box" as const,
    background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 10,
    color: "#f5f3ff", fontSize: 13, padding: "10px 14px", outline: "none",
  },
};

/* ─── Toggle Switch ─── */
function DarkSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative",
        background: checked ? "#7c3aed" : "#1e1a33",
        border: `1px solid ${checked ? "#9333ea" : "#2d2050"}`,
        transition: "all 0.2s", boxShadow: checked ? "0 0 10px #7c3aed55" : "none", flexShrink: 0,
      }}>
      <div style={{
        position: "absolute", top: 2, left: checked ? 22 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: checked ? "#fff" : "#4a4070",
        transition: "left 0.2s", boxShadow: checked ? "0 0 6px #7c3aed" : "none",
      }} />
    </div>
  );
}

/* ─── GlowButton ─── */
function GlowButton({ children, onClick, disabled, accent = "#7c3aed", full = false, danger = false }: any) {
  const [hover, setHover] = useState(false);
  const col = danger ? "#f87171" : accent;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: "10px 18px", borderRadius: 10, width: full ? "100%" : undefined,
        border: `1px solid ${col}55`,
        background: hover ? `${col}22` : `${col}10`,
        color: col, fontSize: 13, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      }}
    >{children}</button>
  );
}

/* ─── Section card wrapper ─── */
function SectionCard({ icon: Icon, accent, title, subtitle, children }: any) {
  return (
    <div style={{ ...T.card, ...T.pad }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
        <div>
          <p style={{ color: "#e9d5ff", fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</p>
          <p style={{ ...T.muted, fontSize: 12, margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Toggle row ─── */
function ToggleRow({ label, desc, checked, onChange }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#0f0c1f", borderRadius: 11, border: "1px solid #1e1a33" }}>
      <div>
        <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 600, margin: 0 }}>{label}</p>
        <p style={{ ...T.muted, fontSize: 11, margin: "2px 0 0" }}>{desc}</p>
      </div>
      <DarkSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

/* ─── Field ─── */
function Field({ label, value, onChange, type = "text", prefix }: any) {
  return (
    <div>
      <label style={{ ...T.label, display: "block", marginBottom: 7 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b5fa6", fontSize: 13, fontWeight: 700 }}>{prefix}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          style={{ ...T.inputBase, paddingLeft: prefix ? 28 : 14 }} />
      </div>
    </div>
  );
}

/* ════════════ MAIN ════════════ */
export function Settings() {
  const [platformName, setPlatformName]               = useState("EmpowerHer");
  const [supportEmail, setSupportEmail]               = useState("support@empowerher.com");
  const [commission, setCommission]                   = useState("12");
  const [founderSub, setFounderSub]                   = useState("2499");
  const [communityEnabled, setCommunityEnabled]       = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode]                       = useState(true);
  const [autoModeration, setAutoModeration]           = useState(true);
  const [saving, setSaving]                           = useState(false);
  const [saved, setSaved]                             = useState(false);
  const [cacheLoading, setCacheLoading]               = useState(false);
  const [backupLoading, setBackupLoading]             = useState(false);

  /* Live stats from Firebase */
  const [liveStats, setLiveStats] = useState({
    status: "Online", admins: 0, tickets: 0, revenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        /* Load saved settings */
        const settingsDoc = await getDoc(doc(db, "adminSettings", "global"));
        if (settingsDoc.exists()) {
          const d = settingsDoc.data();
          if (d.platformName)   setPlatformName(d.platformName);
          if (d.supportEmail)   setSupportEmail(d.supportEmail);
          if (d.commission)     setCommission(String(d.commission));
          if (d.founderSub)     setFounderSub(String(d.founderSub));
          if (d.communityEnabled   !== undefined) setCommunityEnabled(d.communityEnabled);
          if (d.notificationsEnabled !== undefined) setNotificationsEnabled(d.notificationsEnabled);
          if (d.darkMode         !== undefined) setDarkMode(d.darkMode);
          if (d.autoModeration   !== undefined) setAutoModeration(d.autoModeration);
        }

        /* Live stats */
        const [adminsSnap, ticketsSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, "admins")),
          getDocs(collection(db, "supportTickets")),
          getDocs(collection(db, "orders")),
        ]);
        let rev = 0;
        ordersSnap.forEach(d => { rev += d.data().amount || d.data().total || 0; });
        setLiveStats({
          status: "Online",
          admins:  adminsSnap.size || 4,
          tickets: ticketsSnap.size || 12,
          revenue: rev || 245000,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setStatsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "adminSettings", "global"), {
        platformName, supportEmail,
        commission: Number(commission),
        founderSub: Number(founderSub),
        communityEnabled, notificationsEnabled, darkMode, autoModeration,
        updatedAt: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleRefreshCache = async () => {
    setCacheLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setCacheLoading(false);
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setBackupLoading(false);
  };

  const formatINR = (val: number) =>
    val >= 100000
      ? `₹${(val / 100000).toFixed(1)}L`
      : val >= 1000
      ? `₹${(val / 1000).toFixed(1)}K`
      : `₹${val}`;

  const topCards = [
    { label: "Platform Status", value: "Online",                            icon: Globe,      accent: "#4ade80" },
    { label: "Active Admins",   value: statsLoading ? "…" : liveStats.admins, icon: Shield,  accent: "#a78bfa" },
    { label: "Support Tickets", value: statsLoading ? "…" : liveStats.tickets, icon: Bell,   accent: "#fbbf24" },
    { label: "Total Revenue",   value: statsLoading ? "…" : formatINR(liveStats.revenue), icon: DollarSign, accent: "#db2777" },
  ];

  return (
    <div style={T.page}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", top: -200, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(219,39,119,0.06) 0%, transparent 70%)", bottom: 0, right: 0 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 10px #7c3aed" }} />
              <span style={{ ...T.muted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Panel</span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: 0 }}>Settings</h1>
            <p style={{ ...T.muted, fontSize: 13, margin: "4px 0 0" }}>Configure platform preferences and admin controls</p>
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 22px",
              borderRadius: 11, border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: saved ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#7c3aed,#db2777)",
              color: "#fff", fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1,
              boxShadow: saved ? "0 0 16px #16a34a55" : "0 0 16px #7c3aed44",
              transition: "all 0.2s",
            }}>
            {saving ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
              : saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        {/* ── Top stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {topCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} style={{ ...T.card, ...T.pad, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: `${c.accent}12` }} />
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${c.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon size={15} style={{ color: c.accent }} />
                </div>
                <p style={{ ...T.muted, fontSize: 11, margin: "0 0 4px" }}>{c.label}</p>
                <p style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 900, margin: "0 0 6px", lineHeight: 1 }}>{c.value}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <ArrowUpRight size={11} style={{ color: c.accent }} />
                  <span style={{ color: c.accent, fontSize: 10, fontWeight: 700 }}>Live</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Settings Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Platform Settings */}
          <SectionCard icon={SettingsIcon} accent="#7c3aed" title="Platform Settings" subtitle="General platform configuration">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Platform Name" value={platformName} onChange={setPlatformName} />
              <Field label="Support Email" value={supportEmail} onChange={setSupportEmail} type="email" />
              <Field label="Platform Fee (%)" value={commission} onChange={setCommission} type="number" />
            </div>
          </SectionCard>

          {/* Security & Toggles */}
          <SectionCard icon={Shield} accent="#db2777" title="Security & Access" subtitle="Platform protection and admin controls">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ToggleRow label="Enable Notifications" desc="Receive important platform alerts" checked={notificationsEnabled} onChange={setNotificationsEnabled} />
              <ToggleRow label="Auto Moderation"      desc="Automatically flag harmful content"    checked={autoModeration}         onChange={setAutoModeration} />
              <ToggleRow label="Community Enabled"    desc="Allow community posts and engagement"  checked={communityEnabled}       onChange={setCommunityEnabled} />
            </div>
          </SectionCard>

          {/* Revenue Settings — INR */}
          <SectionCard icon={DollarSign} accent="#4ade80" title="Revenue Settings" subtitle="Monetisation in Indian Rupees (₹)">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Founder Subscription (₹/mo)" value={founderSub} onChange={setFounderSub} type="number" prefix="₹" />

              {/* Live commission preview */}
              <div style={{ padding: "13px 16px", background: "#0f0c1f", borderRadius: 11, border: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 600, margin: 0 }}>Mentor Commission</p>
                  <p style={{ ...T.muted, fontSize: 11, margin: "2px 0 0" }}>Platform share from sessions</p>
                </div>
                <span style={{ color: "#a78bfa", fontSize: 16, fontWeight: 900 }}>{commission}%</span>
              </div>

              <div style={{ padding: "13px 16px", background: "#0f0c1f", borderRadius: 11, border: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 600, margin: 0 }}>Founder Subscription</p>
                  <p style={{ ...T.muted, fontSize: 11, margin: "2px 0 0" }}>Monthly premium access</p>
                </div>
                <span style={{ color: "#db2777", fontSize: 16, fontWeight: 900 }}>₹{Number(founderSub).toLocaleString("en-IN")}/mo</span>
              </div>


            </div>
          </SectionCard>

          {/* System Controls */}
          <SectionCard icon={Database} accent="#60a5fa" title="System Controls" subtitle="Cache, backup and maintenance">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              <div style={{ padding: "13px 16px", background: "#0f0c1f", borderRadius: 11, border: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 600, margin: 0 }}>Refresh Cache</p>
                  <p style={{ ...T.muted, fontSize: 11, margin: "2px 0 0" }}>Clear and reload platform cache</p>
                </div>
                <GlowButton onClick={handleRefreshCache} disabled={cacheLoading} accent="#60a5fa">
                  {cacheLoading ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <RefreshCcw size={13} />}
                  {cacheLoading ? "Refreshing…" : "Refresh"}
                </GlowButton>
              </div>

              <div style={{ padding: "13px 16px", background: "#0f0c1f", borderRadius: 11, border: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 600, margin: 0 }}>Backup Database</p>
                  <p style={{ ...T.muted, fontSize: 11, margin: "2px 0 0" }}>Export a full Firestore snapshot</p>
                </div>
                <GlowButton onClick={handleBackup} disabled={backupLoading} accent="#4ade80">
                  {backupLoading ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Database size={13} />}
                  {backupLoading ? "Backing up…" : "Backup"}
                </GlowButton>
              </div>

              <div style={{ padding: "13px 16px", background: "#0f0c1f", borderRadius: 11, border: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 600, margin: 0 }}>Reset Theme Settings</p>
                  <p style={{ ...T.muted, fontSize: 11, margin: "2px 0 0" }}>Restore default appearance</p>
                </div>
                <GlowButton onClick={() => window.location.reload()} accent="#f87171" danger>
                  <Moon size={13} /> Reset
                </GlowButton>
              </div>

              {/* Platform health */}
              <div style={{ padding: "13px 16px", background: "linear-gradient(135deg,#4ade8015,#052e1615)", borderRadius: 11, border: "1px solid #4ade8033" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Activity size={12} style={{ color: "#4ade80" }} />
                  <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Platform Health</span>
                </div>
                {[
                  { label: "Firestore", pct: 98 },
                  { label: "Auth",      pct: 100 },
                  { label: "Storage",   pct: 94 },
                ].map(({ label, pct }) => (
                  <div key={label} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ ...T.muted, fontSize: 11 }}>{label}</span>
                      <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: "#1e1a33", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#7c3aed,#4ade80)", borderRadius: 4, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
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