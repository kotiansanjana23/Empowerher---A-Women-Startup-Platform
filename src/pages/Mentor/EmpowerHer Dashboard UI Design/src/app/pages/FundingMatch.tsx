import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../../../../../../firebase";
import {
  collection, query, where, onSnapshot, addDoc,
  doc, serverTimestamp, deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowLeft, Building2, MapPin, Mail, Users,
  DollarSign, Clock, BadgeCheck,
  Sparkles, Zap, UserPlus, Check, X,
  Globe, RotateCcw, Rocket,
  Search, Eye, Shield,
  Target, Briefcase, ExternalLink,
  Star, TrendingUp,
} from "lucide-react";
import { Loader2 } from "lucide-react";

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
type ConnectionStatus = "none" | "pending" | "accepted" | "rejected";
interface AuthUser { uid: string; displayName: string; email: string; }

/* ══════════════════════════════════════════════════════
   CARD ACCENTS
══════════════════════════════════════════════════════ */
const CARD_ACCENTS = [
  { from: "#7B61FF", to: "#EC4899", mid: "#a855f7" },
  { from: "#9333ea", to: "#ec4899", mid: "#c026d3" },
  { from: "#7c3aed", to: "#f472b6", mid: "#a855f7" },
  { from: "#8b5cf6", to: "#ec4899", mid: "#a855f7" },
  { from: "#a21caf", to: "#7c3aed", mid: "#9333ea" },
  { from: "#7B61FF", to: "#f472b6", mid: "#9333ea" },
];

/* ══════════════════════════════════════════════════════
   CURRENCY HELPER
   Converts any "$" present in funding-related strings to "₹".
══════════════════════════════════════════════════════ */
function toINR(value?: string | null): string {
  if (!value) return "";
  return String(value).replace(/\$/g, "₹");
}

/* ══════════════════════════════════════════════════════
   MATCH SCORE
══════════════════════════════════════════════════════ */
function computeMatchScore(investor: any): number {
  let score = 60 + (Math.abs(investor.id?.charCodeAt(0) || 65) % 30);
  if (investor.availabilityStatus?.toLowerCase().includes("open")) score = Math.min(99, score + 10);
  if (investor.funding) score = Math.min(99, score + 5);
  return score;
}

/* ══════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════ */
function Avatar({ src, name, size = "md", className = "" }: {
  src?: string; name: string; size?: "sm"|"md"|"lg"|"xl"|"2xl"; className?: string;
}) {
  const sz: Record<string, string> = {
    sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-sm", lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl", "2xl": "w-28 h-28 text-3xl",
  };
  return src
    ? <img src={src} alt={name} className={`${sz[size]} rounded-2xl object-cover flex-shrink-0 ${className}`} />
    : <div className={`${sz[size]} rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black flex-shrink-0 ${className}`}>
        {name?.[0]?.toUpperCase() || "?"}
      </div>;
}

function Toast({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-[999]" style={{ animation: "slideUp 0.4s ease" }}>
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <p className="text-sm font-semibold text-gray-800">{msg}</p>
        <button onClick={onDismiss} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function PulsingDot({ color = "bg-emerald-400" }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

function MatchRing({ score, accent }: { score: number; accent?: { from: string; to: string } }) {
  const r = 22, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = accent ? accent.from : (score >= 85 ? "#10b981" : score >= 70 ? "#8b5cf6" : "#f59e0b");
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#ede9fe" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-black text-purple-800 leading-none">{score}%</span>
        <span className="text-[8px] text-purple-400 font-bold tracking-wide">match</span>
      </div>
    </div>
  );
}

function GlassCard({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={style}
      className={`bg-white border border-purple-100 rounded-3xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STAGE BADGE
══════════════════════════════════════════════════════ */
function StageBadge({ investor }: { investor: any }) {
  const funding = investor.funding || "";
  const stage = investor.stage || investor.focusStage || "";
  const label = stage || (
    funding.includes("5M") ? "Series A" :
    funding.includes("2M") ? "Seed" :
    funding.includes("500K") ? "Pre-Seed" : "All Stages"
  );
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <span className="px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white"
        style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.35)" }}>
        {label}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   INVESTOR PROFILE PAGE
══════════════════════════════════════════════════════ */
function InvestorProfile({ authUser, investors, connections, onConnect, onWithdraw, connDocIds }: any) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sending, setSending] = useState(false);
  const [investorData, setInvestorData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const baseInvestor = investors.find((i: any) => i.id === id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "investors", id), (snap) => {
      if (snap.exists()) setInvestorData({ id: snap.id, ...snap.data() });
      else if (baseInvestor) setInvestorData(baseInvestor);
      setLoading(false);
    }, () => { if (baseInvestor) setInvestorData(baseInvestor); setLoading(false); });
    return () => unsub();
  }, [id]);

  if (loading || !investorData) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading profile…</p>
      </div>
    </div>
  );

  const inv = investorData;
  const name = inv.fullName || inv.name || "Investor";
  const conn: ConnectionStatus = connections[id!] ?? "none";
  const matchScore = computeMatchScore(inv);

  const SYSTEM_FIELDS = new Set(["id","uid","createdAt","updatedAt","photoURL","fullName","name",
    "email","bio","availabilityStatus","funding","location","investmentInterests","interests",
    "company","linkedin","phone","portfolio"]);

  const extraFields = Object.entries(inv).filter(([key, val]) =>
    !SYSTEM_FIELDS.has(key) && val !== null && val !== undefined &&
    val !== "" && val !== "0" && typeof val !== "object"
  );

  const interests: string[] = (() => {
    const raw = inv.investmentInterests || inv.interests || "";
    if (!raw || raw === "0") return [];
    return raw.split(/[,;\/]/).map((s: string) => s.trim()).filter(Boolean);
  })();

  const portfolio: string[] = (() => {
    const raw = inv.portfolio || "";
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw.split(/[,;\/]/).map((s: string) => s.trim()).filter(Boolean);
  })();

  const handleConnect = async () => {
    if (!authUser || sending) return;
    setSending(true); await onConnect(inv); setSending(false);
  };

  const CHIP_STYLES = [
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    "bg-sky-50 text-sky-700 border-sky-200",
    "bg-pink-50 text-pink-700 border-pink-200",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/mentor/funding-match")}
          className="group flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-900 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-white border border-purple-100 flex items-center justify-center group-hover:border-purple-300 group-hover:bg-purple-50 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Funding Match
        </button>
        <div className="flex items-center gap-3">
          {conn === "accepted" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          )}
          {conn === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
              <Loader2 className="w-3 h-3 animate-spin" /> Pending
            </span>
          )}
          {(conn === "none" || conn === "rejected") && authUser && (
            <button onClick={handleConnect} disabled={sending}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 disabled:opacity-60 transition-opacity shadow-md shadow-purple-200">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {sending ? "Sending…" : "Connect"}
            </button>
          )}
          {conn === "pending" && (
            <button onClick={() => onWithdraw(id!)}
              className="px-5 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-bold flex items-center gap-2 hover:bg-amber-100 transition-colors">
              <RotateCcw className="w-4 h-4" /> Withdraw
            </button>
          )}
        </div>
      </div>

      {/* HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative p-8 pb-10">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="relative flex-shrink-0">
              <Avatar src={inv.photoURL} name={name} size="2xl" className="border-4 border-white/20 shadow-2xl" />
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center border-2 border-white bg-emerald-500 shadow-lg">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">{name}</h1>
              {inv.company && (
                <p className="text-white/75 text-sm font-medium flex items-center gap-1.5 mb-3">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> {inv.company}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {inv.location && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 bg-white/15 border border-white/15">
                    <MapPin className="w-3 h-3" /> {inv.location}
                  </span>
                )}
                {inv.availabilityStatus && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 bg-white/15 border border-white/15">
                    <PulsingDot color={inv.availabilityStatus.toLowerCase().includes("open") ? "bg-emerald-300" : "bg-amber-300"} />
                    {inv.availabilityStatus}
                  </span>
                )}
                {inv.email && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 bg-white/15 border border-white/15">
                    <Mail className="w-3 h-3" /> {inv.email}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="p-2.5 rounded-2xl border border-white/20 bg-white/15">
                <MatchRing score={matchScore} />
              </div>
              <span className="text-[9px] font-bold text-white/75 uppercase tracking-widest">AI Match</span>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/15 bg-black/15">
          <div className="grid grid-cols-2 divide-x divide-white/15">
            {[
              { icon: <DollarSign className="w-4 h-4" />, label: "Funding Range", value: toINR(inv.funding) || "–" },
              { icon: <Target className="w-4 h-4" />, label: "Focus Areas", value: interests.length > 0 ? `${interests.length} sectors` : "–" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 px-6 py-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white/80 bg-white/10">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-black text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          {inv.bio && (
            <GlassCard className="p-6">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                </div>
                About
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">{inv.bio}</p>
            </GlassCard>
          )}
          {interests.length > 0 && (
            <GlassCard className="p-6">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                  <Target className="w-3.5 h-3.5 text-purple-600" />
                </div>
                Investment Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest: string, i: number) => (
                  <span key={interest}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border text-xs font-bold ${CHIP_STYLES[i % CHIP_STYLES.length]}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {interest}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}
          {extraFields.length > 0 && (
            <GlassCard className="p-6">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                  <Star className="w-3.5 h-3.5 text-purple-600" />
                </div>
                Additional Information
              </h2>
              <div className="space-y-2">
                {extraFields.map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-2.5 border-b border-purple-50 last:border-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 pt-0.5">
                      {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 text-right">{String(value)}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        <div className="space-y-5">
          <GlassCard className="p-5 overflow-hidden">
            <div className="h-1 rounded-full mb-5 -mx-5 -mt-5 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400" />
            <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
              </div>
              Details
            </h2>
            <div className="space-y-3">
              {[
                { icon: <DollarSign className="w-4 h-4" />, label: "Funding Range", value: toINR(inv.funding), color: "#10b981" },
                { icon: <MapPin className="w-4 h-4" />, label: "Location", value: inv.location, color: "#7B61FF" },
                { icon: <Mail className="w-4 h-4" />, label: "Email", value: inv.email, color: "#0ea5e9" },
                { icon: <Clock className="w-4 h-4" />, label: "Availability", value: inv.availabilityStatus, color: "#f59e0b" },
                { icon: <Building2 className="w-4 h-4" />, label: "Company", value: inv.company, color: "#ec4899" },
                { icon: <ExternalLink className="w-4 h-4" />, label: "LinkedIn", value: inv.linkedin, color: "#6366f1" },
                { icon: <Mail className="w-4 h-4" />, label: "Phone", value: inv.phone, color: "#8b5cf6" },
              ].filter(item => item.value && item.value !== "0").map(item => (
                <div key={item.label} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}18`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                    {item.label === "LinkedIn" && item.value
                      ? <a href={item.value.startsWith("http") ? item.value : `https://${item.value}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-sm font-semibold text-indigo-600 truncate block hover:underline">
                          {item.value}
                        </a>
                      : <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {(conn === "none" || conn === "rejected") && authUser && (
            <div className="relative rounded-2xl overflow-hidden p-5 text-center bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white/20 border border-white/20">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <p className="font-black text-white mb-1">Connect with {name.split(" ")[0]}</p>
                <p className="text-white/75 text-xs mb-4 leading-relaxed">Build a relationship and explore investment opportunities.</p>
                <button onClick={handleConnect} disabled={sending}
                  className="w-full py-2.5 rounded-xl bg-white text-purple-700 text-sm font-black hover:bg-purple-50 disabled:opacity-60 transition-colors shadow-lg">
                  {sending ? "Sending…" : "Send Request"}
                </button>
              </div>
            </div>
          )}

          {conn === "accepted" && (
<div className="relative rounded-2xl overflow-hidden p-5 text-center bg-gradient-to-br from-purple-600 to-pink-500">
                <div className="relative">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white/20 border border-white/20">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <p className="font-black text-white mb-1">You're connected!</p>
<p className="text-white/75 text-xs">Your connection with {name.split(" ")[0]} is active.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   INVESTOR CARD
══════════════════════════════════════════════════════ */
function InvestorCard({ investor, conn, matchScore, onConnect, onWithdraw, onViewProfile, idx }: {
  investor: any; conn: ConnectionStatus; matchScore: number;
  onConnect: () => Promise<void>; onWithdraw: () => void; onViewProfile: () => void; idx: number;
}) {
  const [connecting, setConnecting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
  const name = investor.fullName || investor.name || "Investor";
  const isConnected = conn === "accepted";
  const isPending = conn === "pending";

  const interests: string[] = (() => {
    const raw = investor.investmentInterests || investor.interests || "";
    if (!raw || raw === "0") return [];
    return raw.split(/[,;\/]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
  })();

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connecting || conn === "pending") return;
    setConnecting(true);
    try { await onConnect(); } finally { setTimeout(() => setConnecting(false), 3000); }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onViewProfile}
      className="relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col bg-white border"
      style={{
borderColor: "#f3e8ff",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
       boxShadow: hovered
  ? "0 20px 44px rgba(124,58,237,0.16)"
  : "0 2px 12px rgba(124,58,237,0.06)",
      }}>

      {/* Gradient header */}
      <div className="relative flex-shrink-0 overflow-hidden"
        style={{
          height: 80,
          background: `linear-gradient(135deg,${accent.from},${accent.mid || accent.to},${accent.to})`,
        }}>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 left-8 w-20 h-20 rounded-full bg-white/5" />

        {isConnected && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-white bg-white/25 border border-white/35">
            <Check className="w-2.5 h-2.5" />
            CONNECTED
          </div>
        )}
        {isPending && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-white/20 border border-white/30">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            PENDING
          </div>
        )}
        {!isConnected && !isPending && (
          <div className="absolute top-3 right-3">
            <StageBadge investor={investor} />
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-5" style={{ marginTop: -22 }}>
        <div className="relative inline-block">
          <Avatar src={investor.photoURL} name={name} size="md" className="ring-4 ring-white shadow-lg" />
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 pt-2 pb-2 flex-1">
        <div className="flex items-center gap-1 mb-0.5">
          <h3 className="font-black text-gray-900 text-sm truncate">{name}</h3>
          <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isConnected ? "#10b981" : "#a855f7" }} />
        </div>

        {investor.company && (
          <p className="text-[11px] text-gray-500 truncate flex items-center gap-0.5 mb-0.5">
            <Building2 className="w-2.5 h-2.5 flex-shrink-0 text-purple-400" /> {investor.company}
          </p>
        )}
        {investor.location && (
          <p className="text-[11px] text-gray-400 truncate flex items-center gap-0.5 mb-3">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {investor.location}
          </p>
        )}

        {investor.bio && (
          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-3">{investor.bio}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {investor.funding && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
    {toINR(investor.funding)}
            </span>
          )}
          {interests.map((t: string) => (
            <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
              {t}
            </span>
          ))}
          {investor.availabilityStatus && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
              style={{
                background: investor.availabilityStatus.toLowerCase().includes("open") ? "#f0fdf4" : "#fffbeb",
                color: investor.availabilityStatus.toLowerCase().includes("open") ? "#065f46" : "#92400e",
                borderColor: investor.availabilityStatus.toLowerCase().includes("open") ? "#bbf7d0" : "#fde68a",
              }}>
              <PulsingDot color={investor.availabilityStatus.toLowerCase().includes("open") ? "bg-emerald-400" : "bg-amber-400"} />
              {investor.availabilityStatus}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        {isConnected ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100">
<span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Connected · Workspace unlocked
            </div>
           <button
  onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white hover:opacity-90 transition-opacity shadow-md bg-gradient-to-r from-purple-600 to-pink-500">
  <Zap className="w-3.5 h-3.5" /> Open Workspace
</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all">
              <Eye className="w-3.5 h-3.5" /> View Profile
            </button>

            {conn === "none" && (
              <button onClick={handleConnect} disabled={connecting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-70 hover:opacity-90 shadow-md bg-gradient-to-r from-purple-600 to-pink-500">
                {connecting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Connect</>}
              </button>
            )}
            {isPending && (
              <button onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Withdraw
              </button>
            )}
            {conn === "rejected" && (
              <button onClick={handleConnect} disabled={connecting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <UserPlus className="w-3.5 h-3.5" /> Re-connect
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function FundingMatch() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [authUser, setAuthUser]       = useState<AuthUser | null>(null);
  const [authReady, setAuthReady]     = useState(false);
  const [investors, setInvestors]     = useState<any[]>([]);
  const [loadingInv, setLoadingInv]   = useState(true);
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({});
  const [connDocIds, setConnDocIds]   = useState<Record<string, string>>({});
  const [filter, setFilter]           = useState<"all"|"connected"|"pending">("all");
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  // ── FIX: Use refs to hold per-source maps so listeners don't overwrite each other ──
  const srcMaps = useRef<{
    sent: Record<string, ConnectionStatus>;
    sentDocs: Record<string, string>;
    received: Record<string, ConnectionStatus>;
    receivedDocs: Record<string, string>;
    mentorConn: Record<string, ConnectionStatus>;
    mentorConnDocs: Record<string, string>;
  }>({
    sent: {}, sentDocs: {},
    received: {}, receivedDocs: {},
    mentorConn: {}, mentorConnDocs: {},
  });

  // Merge all source maps into a single connections state.
  // Priority: mentorConn > sent > received  (so explicit "accepted" wins)
  const flushConnections = useCallback(() => {
    const { sent, sentDocs, received, receivedDocs, mentorConn, mentorConnDocs } = srcMaps.current;
    const merged: Record<string, ConnectionStatus> = {};
    const mergedDocs: Record<string, string> = {};

    // Apply in priority order (lowest first, highest last)
    for (const [k, v] of Object.entries(received))   { merged[k] = v; }
    for (const [k, v] of Object.entries(receivedDocs)) { mergedDocs[k] = v; }
    for (const [k, v] of Object.entries(sent))        { merged[k] = v; }
    for (const [k, v] of Object.entries(sentDocs))    { mergedDocs[k] = v; }
    for (const [k, v] of Object.entries(mentorConn))  { merged[k] = v; }
    for (const [k, v] of Object.entries(mentorConnDocs)) { mergedDocs[k] = v; }

    setConnections({ ...merged });
    setConnDocIds({ ...mergedDocs });
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setAuthUser(user ? {
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Mentor",
        email: user.email || ""
      } : null);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(query(collection(db, "investors")), snap => {
      setInvestors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingInv(false);
    }, () => setLoadingInv(false));
  }, []);

  useEffect(() => {
    if (!authUser) return;

    // Reset all source maps when user changes
    srcMaps.current = {
      sent: {}, sentDocs: {},
      received: {}, receivedDocs: {},
      mentorConn: {}, mentorConnDocs: {},
    };

    // Listener 1: requests sent BY this mentor
    const u1 = onSnapshot(
      query(collection(db, "connectionRequests"), where("fromId", "==", authUser.uid)),
      snap => {
        const map: Record<string, ConnectionStatus> = {};
        const docs: Record<string, string> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.toId) {
map[data.toId] = (data.status as string).toLowerCase() as ConnectionStatus;
            docs[data.toId] = d.id;
          }
        });
        srcMaps.current.sent = map;
        srcMaps.current.sentDocs = docs;
        flushConnections();
      }
    );

    // Listener 2: requests received BY this mentor that are accepted
    const u2 = onSnapshot(
      query(
        collection(db, "connectionRequests"),
        where("toId", "==", authUser.uid),
where("status", "in", ["accepted", "Accepted"])
      ),
      snap => {
        const map: Record<string, ConnectionStatus> = {};
        const docs: Record<string, string> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.fromId) {
            map[data.fromId] = "accepted";
            docs[data.fromId] = d.id;
          }
        });
        srcMaps.current.received = map;
        srcMaps.current.receivedDocs = docs;
        flushConnections();
      }
    );

    // Listener 3: mentorConnections where this user is the mentor
    const u3 = onSnapshot(
      query(collection(db, "mentorConnections"), where("mentorId", "==", authUser.uid)),
      snap => {
        const map: Record<string, ConnectionStatus> = {};
        const docs: Record<string, string> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          const iid = data.investorId || data.uid2;
          if (iid && data.status) {
map[iid] = (data.status as string).toLowerCase() as ConnectionStatus;
            docs[iid] = d.id;
          }
        });
        srcMaps.current.mentorConn = map;
        srcMaps.current.mentorConnDocs = docs;
        flushConnections();
      }
    );

    // Listener 4: mentorConnections where this user is the investor side
    const u4 = onSnapshot(
      query(collection(db, "mentorConnections"), where("investorId", "==", authUser.uid)),
      snap => {
        snap.docs.forEach(d => {
          const data = d.data();
          const oid = data.mentorId || data.uid1;
          if (oid && data.status) {
            srcMaps.current.mentorConn[oid] = data.status as ConnectionStatus;
          }
        });
        flushConnections();
      }
    );

    return () => { u1(); u2(); u3(); u4(); };
  }, [authUser, flushConnections]);

  const handleConnect = async (investor: any): Promise<void> => {
    if (!authUser) { alert("Please log in."); return; }
    const current = connections[investor.id];
    if (current && current !== "none" && current !== "rejected") return;
    try {
      await addDoc(collection(db, "connectionRequests"), {
        fromId: authUser.uid, fromName: authUser.displayName, fromRole: "mentor",
        toId: investor.id, toName: investor.fullName || investor.name || "",
        toRole: "investor", status: "pending", createdAt: serverTimestamp(),
      });
      showToast(`Request sent to ${investor.fullName || investor.name}!`);
    } catch (e: any) {
      console.error(e?.code, e?.message);
      if (e?.code === "permission-denied") alert("Permission denied. Check Firestore rules.");
    }
  };

  const handleWithdraw = async (investorId: string): Promise<void> => {
    const docId = connDocIds[investorId];
    if (!docId) return;
    try {
      await deleteDoc(doc(db, "connectionRequests", docId));
      // Remove from sent map immediately for snappy UI
      delete srcMaps.current.sent[investorId];
      delete srcMaps.current.sentDocs[investorId];
      flushConnections();
      showToast("Request withdrawn.");
    } catch (e) { console.error(e); }
  };

  const connectedCount = Object.values(connections).filter(c => c === "accepted").length;
  const pendingCount   = Object.values(connections).filter(c => c === "pending").length;

  const filteredInvestors = investors.filter(inv => {
    if (filter === "connected" && connections[inv.id] !== "accepted") return false;
    if (filter === "pending"   && connections[inv.id] !== "pending")  return false;
    if (search) {
      const q = search.toLowerCase();
      return (inv.fullName || inv.name || "").toLowerCase().includes(q) ||
             (inv.company || "").toLowerCase().includes(q) ||
             (inv.investmentInterests || inv.interests || "").toLowerCase().includes(q);
    }
    return true;
  });

  if (id) {
    if (!authReady) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-500 w-8 h-8" />
      </div>
    );
    return (
      <InvestorProfile authUser={authUser} investors={investors}
        connections={connections} connDocIds={connDocIds}
        onConnect={handleConnect} onWithdraw={handleWithdraw} />
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onDismiss={() => setToast(null)} />}
      <style>{`
        @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
      `}</style>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Sparkles size={13} /> EmpowerHer Network
            </span>
            <h1 className="text-3xl font-bold text-white mt-1.5">Funding Match</h1>
            <p className="text-white/75 mt-1 text-sm max-w-md">
              Discover the right investors for your founders, and build lasting partnerships.
            </p>
            {authUser && (
              <p className="text-white/60 text-xs mt-3 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Signed in as <span className="text-white font-semibold">{authUser.displayName}</span>
              </p>
            )}
          </div>

          {/* Stat chips */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: "Investors", value: investors.length, icon: <Globe className="w-4 h-4" /> },
              { label: "Connected", value: connectedCount,   icon: <Check className="w-4 h-4" /> },
              { label: "Pending",   value: pendingCount,     icon: <Clock className="w-4 h-4" /> },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/15 border border-white/20">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 text-white shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login warning */}
      {authReady && !authUser && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-amber-800 text-sm font-semibold">You must be logged in to connect with investors.</p>
        </div>
      )}

      {/* ── SEARCH + FILTER BAR ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, or sector…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-purple-100 bg-white text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 placeholder-purple-300 shadow-sm transition-all" />
        </div>

        <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-purple-100 p-1.5 shadow-sm">
          {([
            { key: "all",       label: "All",       count: investors.length },
            { key: "connected", label: "Connected", count: connectedCount },
            { key: "pending",   label: "Pending",   count: pendingCount },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f.key ? "text-white shadow-md bg-gradient-to-r from-purple-600 to-pink-500" : "text-gray-500 hover:text-gray-700 hover:bg-purple-50"
              }`}>
              {f.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                filter === f.key ? "bg-white/25 text-white" : "bg-purple-100 text-purple-600"
              }`}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── INVESTOR GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {filteredInvestors.length} investor{filteredInvestors.length !== 1 ? "s" : ""}
            {search && <span className="ml-2 normal-case font-semibold text-gray-500">matching "{search}"</span>}
          </p>
          {connectedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-purple-50 border border-purple-100 text-purple-600">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              {connectedCount} active connection{connectedCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {loadingInv ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
            <p className="text-sm font-semibold text-gray-400">Loading investors…</p>
          </div>
        ) : filteredInvestors.length === 0 ? (
          <Card_Empty filter={filter} search={search} onClear={() => { setFilter("all"); setSearch(""); }} />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredInvestors.map((inv, idx) => (
              <InvestorCard
                key={inv.id}
                investor={inv}
                idx={idx}
                conn={connections[inv.id] || "none"}
                matchScore={computeMatchScore(inv)}
                onConnect={() => handleConnect(inv)}
                onWithdraw={() => handleWithdraw(inv.id)}
                onViewProfile={() => navigate(`/mentor/funding-match/${inv.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card_Empty({ filter, search, onClear }: { filter: string; search: string; onClear: () => void }) {
  return (
    <div className="text-center py-24 rounded-3xl bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-purple-100">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white border border-purple-100 shadow-sm">
        <Users className="w-7 h-7 text-purple-300" />
      </div>
      <p className="font-semibold text-gray-700">No investors found</p>
      <p className="text-sm text-gray-400 mt-1">{filter !== "all" || search ? "Try adjusting your search or filters" : "Registered investors will appear here"}</p>
      {(filter !== "all" || search) && (
        <button onClick={onClear}
          className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors">
          Clear filters
        </button>
      )}
    </div>
  );
}