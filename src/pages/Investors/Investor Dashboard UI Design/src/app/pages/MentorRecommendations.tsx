"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BadgeCheck, X, Linkedin, Globe, Award, CheckCircle2, XCircle,
  Loader2, ExternalLink, MapPin, Shield, Sparkles, ArrowUpRight,
  MessageCircle, Twitter, ChevronRight, Users, Star,
} from "lucide-react";
import { useInvestorNav } from "../context/NavigationContext";
import {
  collection, query, where, onSnapshot, updateDoc,
  doc, addDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../../../../firebase";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
interface MentorRequest {
  id: string;
  fromId: string;
  fromName: string;
  status: "pending" | "Accepted" | "Rejected";
}

interface ProfileDoc {
  id: string;
  [key: string]: unknown;
}

/* ══════════════════════════════════════════
   FIELD UTILS — fully dynamic, no hardcoding
══════════════════════════════════════════ */
const META_FIELDS = new Set([
  "id","uid","createdAt","updatedAt","password","passwordHash",
  "__typename","fromRole","toId","fromId","status","role",
]);

const IDENTITY_FIELDS = new Set([
  "name","fullName","founderName","displayName",
  "photo","photoURL","image","avatar","profileImage","founderPhoto",
  "bio","description","about","summary",
  "headline","expertise","specialization","title","position",
  "location","city","country",
]);

function humanLabel(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, s => s.toUpperCase()).trim();
}

function isTimestamp(v: unknown): v is { toDate: () => Date } {
  return !!v && typeof v === "object" && "toDate" in (v as object) && typeof (v as { toDate: unknown }).toDate === "function";
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (isTimestamp(v)) return v.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function isUrl(v: unknown): v is string {
  return typeof v === "string" && /^https?:\/\//.test(v);
}

function isImageField(k: string, v: unknown): boolean {
  return typeof v === "string" && /^https?:\/\//.test(v) && /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|$)/i.test(v);
}

function isLinkField(k: string): boolean {
  return /linkedin|twitter|github|website|url|portfolio|social/i.test(k);
}

function getSectionFor(k: string, v: unknown): string {
  if (isLinkField(k)) return "Links";
  if (/achieve|award|feature|certif|partner|recogni/i.test(k)) return "Achievements";
  if (Array.isArray(v)) return "Tags";
  if (/year|exp|mentor|fund|invest|startup|success|rate|raise|stage/i.test(k)) return "Experience";
  if (/revenue|growth|mrr|arr|traction|user|metric|kpi/i.test(k)) return "Traction";
  if (/industry|sector|portfolio|focus|domain/i.test(k)) return "Focus";
  return "Details";
}

const SECTION_ORDER = ["Focus","Experience","Traction","Tags","Achievements","Links","Details"];

/* ══════════════════════════════════════════
   PROFILE SLIDE-OVER DRAWER
══════════════════════════════════════════ */
function ProfileDrawer({ profileId, collection: col, onClose }: {
  profileId: string;
  collection: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ProfileDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, col, profileId), snap => {
      setData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, [profileId, col]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Identity */
  const name = String(data?.name || data?.fullName || data?.founderName || data?.displayName || "Profile");
  const avatar = String(data?.photo || data?.photoURL || data?.image || data?.avatar || data?.profileImage || "");
  const bio = String(data?.bio || data?.description || data?.about || data?.summary || "");
  const headline = String(data?.headline || data?.expertise || data?.specialization || data?.title || data?.position || "");
  const location = String(data?.location || data?.city || "");

  /* Group remaining fields */
  const sections: Record<string, [string, unknown][]> = {};
  if (data) {
    Object.entries(data).forEach(([k, v]) => {
      if (META_FIELDS.has(k) || IDENTITY_FIELDS.has(k)) return;
      if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return;
      if (isImageField(k, v)) return;
      const sec = getSectionFor(k, v);
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push([k, v]);
    });
  }

  const orderedSections = [
    ...SECTION_ORDER.filter(s => sections[s]?.length),
    ...Object.keys(sections).filter(s => !SECTION_ORDER.includes(s)),
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose}
        style={{ animation: "fadeIn 0.18s ease" }} />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] flex flex-col overflow-hidden"
        style={{
          animation: "slideInRight 0.32s cubic-bezier(0.32,0.72,0,1)",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(32px) saturate(1.8)",
          borderLeft: "1px solid rgba(167,139,250,0.2)",
          boxShadow: "-24px 0 80px rgba(139,92,246,0.08), -4px 0 20px rgba(0,0,0,0.06)",
        }}
      >
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #a78bfa, #f472b6, #818cf8, #a78bfa)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(244,114,182,0.2))" }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#a78bfa" }} />
              </div>
              <p className="text-sm" style={{ color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>Loading profile…</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: "#9ca3af" }}>Profile not found</p>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="flex-shrink-0 px-7 pt-8 pb-6">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-4">
                  {avatar ? (
                    <img src={avatar} alt={name}
                      className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                      style={{ boxShadow: "0 0 0 3px rgba(167,139,250,0.25), 0 8px 24px rgba(139,92,246,0.15)" }} />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-semibold text-xl flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #a78bfa, #f472b6)", boxShadow: "0 0 0 3px rgba(167,139,250,0.25)" }}>
                      {name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-xl leading-tight" style={{ color: "#1e1b4b", fontFamily: "'Playfair Display', Georgia, serif" }}>{name}</h2>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: "rgba(167,139,250,0.12)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.25)" }}>
                        <BadgeCheck className="w-3 h-3" /> Verified
                      </div>
                    </div>
                    {headline && <p className="text-sm mt-0.5 font-medium" style={{ color: "#a78bfa" }}>{headline}</p>}
                    {location && (
                      <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#9ca3af" }}>
                        <MapPin className="w-3 h-3" />{location}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={onClose}
                  className="p-2 rounded-xl flex-shrink-0 transition-all hover:scale-105"
                  style={{ background: "rgba(0,0,0,0.05)", color: "#6b7280", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bio && (
                <p className="text-sm leading-relaxed" style={{ color: "#4b5563", fontFamily: "'DM Sans', sans-serif" }}>{bio}</p>
              )}
            </div>

            {/* Divider */}
            <div className="mx-7 h-px flex-shrink-0" style={{ background: "linear-gradient(90deg, rgba(167,139,250,0.2), rgba(244,114,182,0.1), rgba(167,139,250,0.05))" }} />

            {/* Dynamic sections */}
            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6" style={{ scrollbarWidth: "none" }}>
              {orderedSections.map(section => (
                <div key={section}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#c4b5fd" }}>{section}</p>

                  {section === "Links" && (
                    <div className="flex flex-wrap gap-2">
                      {sections[section].map(([k, v]) => (
                        isUrl(v) ? (
                          <a key={k} href={v} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.03]"
                            style={{ background: "rgba(167,139,250,0.08)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.2)" }}>
                            {/linkedin/i.test(k) ? <Linkedin className="w-3 h-3" /> : /twitter/i.test(k) ? <Twitter className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {humanLabel(k)} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                          </a>
                        ) : null
                      ))}
                    </div>
                  )}

                  {section === "Tags" && (
                    <div className="flex flex-wrap gap-1.5">
                      {sections[section].flatMap(([, v]) =>
                        (Array.isArray(v) ? v : [v]).map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: "rgba(167,139,250,0.1)", color: "#6d28d9", border: "1px solid rgba(167,139,250,0.2)" }}>
                            {String(tag)}
                          </span>
                        ))
                      )}
                    </div>
                  )}

                  {section === "Achievements" && (
                    <div className="space-y-2">
                      {sections[section].map(([k, v]) =>
                        (Array.isArray(v) ? v : [String(v)]).map((item, i) => (
                          <div key={`${k}-${i}`} className="flex items-start gap-2.5 px-3 py-2 rounded-xl"
                            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
                            <Award className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                            <span className="text-sm" style={{ color: "#374151" }}>{String(item)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {!["Links","Tags","Achievements"].includes(section) && (
                    <div className="grid grid-cols-2 gap-2">
                      {sections[section].map(([k, v]) => (
                        <div key={k} className="px-3 py-2.5 rounded-xl"
                          style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.1)" }}>
                          <p className="text-[10px] mb-0.5" style={{ color: "#a78bfa" }}>{humanLabel(k)}</p>
                          {isUrl(v) ? (
                            <a href={v} target="_blank" rel="noreferrer" className="text-xs font-medium underline" style={{ color: "#7c3aed" }}>Visit link</a>
                          ) : (
                            <p className="text-sm font-medium leading-snug" style={{ color: "#1e1b4b" }}>{renderValue(v)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {orderedSections.length === 0 && !bio && (
                <div className="text-center py-8" style={{ color: "#d1d5db" }}>
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No additional details available</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideInRight { from { transform:translateX(40px); opacity:0 } to { transform:translateX(0); opacity:1 } }
        @keyframes shimmer { 0%{background-position:0% 0} 100%{background-position:200% 0} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,0.4)} 50%{box-shadow:0 0 0 8px rgba(167,139,250,0)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

/* ══════════════════════════════════════════
   STATUS BADGE — reads directly from Firebase status string
══════════════════════════════════════════ */
function StatusBadge({ status }: { status: string }) {
  if (status === "Accepted") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)", animation: "pulseGlow 2.5s ease-in-out infinite" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
    </span>
  );
  if (status === "Rejected") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: "rgba(239,68,68,0.07)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
      <XCircle className="w-3 h-3" /> Declined
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: "rgba(245,158,11,0.08)", color: "#d97706", border: "1px solid rgba(245,158,11,0.18)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Pending
    </span>
  );
}

/* ══════════════════════════════════════════
   MENTOR REQUEST CARD
══════════════════════════════════════════ */
function MentorCard({
  req, idx, onViewProfile, onAccept, onReject,
}: {
  req: MentorRequest & { mentorData?: ProfileDoc };
  idx: number;
  onViewProfile: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const name = req.fromName;
  const data = req.mentorData;
  const avatar = String(data?.photo || data?.photoURL || data?.image || data?.avatar || "");
  const headline = String(data?.expertise || data?.specialization || data?.headline || data?.title || "");
  const bio = String(data?.bio || data?.description || data?.about || "");
  const location = String(data?.location || data?.city || "");
const industries = Array.isArray(data?.industries)
  ? data.industries
  : typeof data?.industries === "string"
  ? data.industries.split(",").map(i => i.trim())
  : [];
    const successRate = data?.successRate as number | undefined;
  const yearsExp = data?.yearsExp as number | undefined;
  const startupsMentored = data?.startupsMentored as number | undefined;
  const linkedin = String(data?.linkedin || data?.linkedinProfile || "");

  const isAccepted = req.status === "Accepted";
  const isRejected = req.status === "Rejected";

  return (
    <div
      className="group relative rounded-3xl overflow-hidden transition-all duration-500"
      style={{
        background: isAccepted
          ? "linear-gradient(135deg, rgba(236,253,245,0.95) 0%, rgba(255,255,255,0.97) 60%, rgba(240,253,250,0.93) 100%)"
          : isRejected
          ? "rgba(255,255,255,0.6)"
          : "linear-gradient(135deg, rgba(245,243,255,0.97) 0%, rgba(255,255,255,0.99) 60%, rgba(253,242,248,0.95) 100%)",
        backdropFilter: "blur(24px) saturate(1.6)",
        border: isAccepted
          ? "1px solid rgba(16,185,129,0.25)"
          : isRejected
          ? "1px solid rgba(0,0,0,0.06)"
          : "1px solid rgba(167,139,250,0.22)",
        boxShadow: isAccepted
          ? "0 4px 32px rgba(16,185,129,0.08), 0 1px 0 rgba(255,255,255,0.8) inset"
          : isRejected
          ? "0 2px 12px rgba(0,0,0,0.04)"
          : "0 4px 32px rgba(139,92,246,0.07), 0 1px 0 rgba(255,255,255,0.9) inset",
        opacity: isRejected ? 0.55 : 1,
        animation: `cardIn 0.4s ${idx * 0.07}s cubic-bezier(0.32,0.72,0,1) both`,
      }}
    >
      {/* Animated gradient top rim */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{
          background: isAccepted
            ? "linear-gradient(90deg, transparent, rgba(16,185,129,0.5), rgba(52,211,153,0.4), transparent)"
            : "linear-gradient(90deg, transparent, rgba(167,139,250,0.55), rgba(244,114,182,0.45), transparent)",
        }} />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(167,139,250,0.05), transparent 70%)" }} />

      <div className="relative p-6">
        {/* Top row: avatar + identity + status */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="w-14 h-14 rounded-2xl object-cover"
                style={{ boxShadow: isAccepted ? "0 0 0 2px rgba(16,185,129,0.3)" : "0 0 0 2px rgba(167,139,250,0.25)" }} />
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-semibold text-xl"
                style={{ background: "linear-gradient(135deg, #a78bfa, #f472b6)", boxShadow: "0 0 0 2px rgba(167,139,250,0.25)" }}>
                {name[0]}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ background: isAccepted ? "#10b981" : "#a78bfa" }}>
              {isAccepted ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <Shield className="w-2.5 h-2.5 text-white" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-base leading-tight" style={{ color: "#1e1b4b", fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {name}
                  </h3>
                  <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#a78bfa" }} />
                </div>
                {headline && <p className="text-xs mt-0.5 font-medium" style={{ color: "#7c3aed" }}>{headline}</p>}
                {location && (
                  <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                    <MapPin className="w-3 h-3" />{location}
                  </p>
                )}
              </div>
              <StatusBadge status={req.status} />
            </div>
          </div>
        </div>

        {/* Bio snippet */}
        {bio && (
          <p className="text-xs leading-relaxed mb-4 line-clamp-2"
            style={{ color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
            {bio}
          </p>
        )}

        {/* Metrics row */}
        {(successRate || yearsExp || startupsMentored) && (
          <div className="flex gap-2 mb-4">
            {yearsExp ? (
              <div className="flex-1 px-2.5 py-2 rounded-xl text-center"
                style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.12)" }}>
                <p className="text-sm font-bold" style={{ color: "#7c3aed" }}>{yearsExp}+</p>
                <p className="text-[9px]" style={{ color: "#a78bfa" }}>Yrs Exp</p>
              </div>
            ) : null}
            {startupsMentored ? (
              <div className="flex-1 px-2.5 py-2 rounded-xl text-center"
                style={{ background: "rgba(244,114,182,0.07)", border: "1px solid rgba(244,114,182,0.12)" }}>
                <p className="text-sm font-bold" style={{ color: "#db2777" }}>{startupsMentored}</p>
                <p className="text-[9px]" style={{ color: "#f472b6" }}>Mentored</p>
              </div>
            ) : null}
            {successRate ? (
              <div className="flex-1 px-2.5 py-2 rounded-xl text-center"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <p className="text-sm font-bold" style={{ color: "#059669" }}>{successRate}%</p>
                <p className="text-[9px]" style={{ color: "#34d399" }}>Success</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Industry tags */}
        {industries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {industries.slice(0, 4).map(ind => (
              <span key={ind} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: "rgba(167,139,250,0.1)", color: "#6d28d9", border: "1px solid rgba(167,139,250,0.18)" }}>
                {ind}
              </span>
            ))}
            {industries.length > 4 && (
              <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ color: "#a78bfa" }}>+{industries.length - 4}</span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px mb-4" style={{ background: "rgba(167,139,250,0.1)" }} />

        {/* Action row */}
        <div className="flex items-center gap-2">
          {/* View Profile always shown */}
          <button onClick={onViewProfile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            style={{ background: "rgba(167,139,250,0.1)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.2)" }}>
            View Profile <ChevronRight className="w-3 h-3" />
          </button>

          {linkedin && (
            <a href={linkedin} target="_blank" rel="noreferrer"
              className="p-2 rounded-xl transition-all hover:scale-105"
              style={{ background: "rgba(167,139,250,0.07)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.15)" }}>
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Pending: Accept + Reject */}
          {req.status === "pending" && (
            <>
              <button onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #a78bfa, #f472b6)", color: "#fff", boxShadow: "0 4px 14px rgba(167,139,250,0.3)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Accept
              </button>
              <button onClick={onReject}
                className="p-2 rounded-xl transition-all hover:scale-105"
                style={{ background: "rgba(239,68,68,0.07)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Connected: Message button */}
          {req.status === "Accepted" && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>
              <Sparkles className="w-3.5 h-3.5" /> Collaboration Active
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function MentorRecommendations() {
  const { navigate } = useInvestorNav();

  const [investorId,     setInvestorId]     = useState("");
  const [mentorRequests, setMentorRequests] = useState<MentorRequest[]>([]);
  const [mentorProfiles, setMentorProfiles] = useState<Record<string, ProfileDoc>>({});
  const [loading,        setLoading]        = useState(true);
  const [profileOpen,    setProfileOpen]    = useState<{ id: string; col: string } | null>(null);

  /* ── Auth ── */
  useEffect(() => {
    return onAuthStateChanged(auth, user => { if (user) setInvestorId(user.uid); });
  }, []);

  /* ── Fetch connection requests sent TO this investor by mentors ── */
  useEffect(() => {
    if (!investorId) return;
    const unsub = onSnapshot(
      query(collection(db, "connectionRequests"), where("toId", "==", investorId), where("fromRole", "==", "mentor")),
      async snap => {
        const requests: MentorRequest[] = snap.docs.map(d => ({
          id:       d.id,
          fromId:   d.data().fromId   || "",
          fromName: d.data().fromName || d.data().mentorName || "Mentor",
          status:   d.data().status   || "pending",
        }));
        setMentorRequests(requests);
        setLoading(false);

        // Fetch mentor profile docs for rich card data
        const profileMap: Record<string, ProfileDoc> = {};
        await Promise.all(requests.map(async req => {
          if (!req.fromId) return;
          try {
            const snap = await getDoc(doc(db, "mentors", req.fromId));
            if (snap.exists()) profileMap[req.fromId] = { id: snap.id, ...snap.data() };
          } catch {}
        }));
        setMentorProfiles(profileMap);
      },
      err => { console.error("connectionRequests listener", err); setLoading(false); }
    );
    return unsub;
  }, [investorId]);

  /* ── Accept ── */
  async function acceptRequest(req: MentorRequest) {
    try {
      await updateDoc(doc(db, "connectionRequests", req.id), { status: "Accepted" });
      await addDoc(collection(db, "mentorInvestorConnections"), {
        mentorId:     req.fromId,
        mentorName:   req.fromName,
        investorId,
        investorName: auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Investor",
        status:       "Accepted",
        createdAt:    serverTimestamp(),
      });
    } catch (e) { console.error("accept", e); }
  }

  /* ── Reject ── */
  async function rejectRequest(id: string) {
    try {
      await updateDoc(doc(db, "connectionRequests", id), { status: "Rejected" });
    } catch (e) { console.error("reject", e); }
  }

  const pending  = mentorRequests.filter(r => r.status === "pending");
  const accepted = mentorRequests.filter(r => r.status === "Accepted");
  const rejected = mentorRequests.filter(r => r.status === "Rejected");

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(244,114,182,0.12))", border: "1px solid rgba(167,139,250,0.2)" }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#a78bfa" }} />
          </div>
          <p className="text-sm" style={{ color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>Loading mentor network…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Ambient mesh background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 65%)", filter: "blur(1px)" }} />
        <div className="absolute bottom-0 -left-24 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(244,114,182,0.05) 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 space-y-10">

        {/* ── PAGE HEADER ── */}
        <div style={{ animation: "cardIn 0.4s ease both" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(167,139,250,0.1)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.2)" }}>
              <Shield className="w-3 h-3" /> EmpowerHer Network
            </div>
          </div>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#1e1b4b", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em" }}>
                Mentor Requests
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>
                Mentors who want to collaborate with you and your portfolio.
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex items-center gap-2.5">
              <div className="px-4 py-2.5 rounded-2xl text-center"
                style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)" }}>
                <p className="text-2xl font-bold" style={{ color: "#7c3aed", fontFamily: "'Playfair Display', serif" }}>{pending.length}</p>
                <p className="text-[10px] font-medium" style={{ color: "#a78bfa" }}>Pending</p>
              </div>
              <div className="px-4 py-2.5 rounded-2xl text-center"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p className="text-2xl font-bold" style={{ color: "#059669", fontFamily: "'Playfair Display', serif" }}>{accepted.length}</p>
                <p className="text-[10px] font-medium" style={{ color: "#34d399" }}>Connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── EMPTY STATE ── */}
        {mentorRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ animation: "cardIn 0.4s ease both" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
              <Users className="w-7 h-7" style={{ color: "#c4b5fd" }} />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold" style={{ color: "#374151", fontFamily: "'Playfair Display', serif" }}>No requests yet</p>
              <p className="text-sm mt-1 max-w-xs" style={{ color: "#9ca3af" }}>
                When mentors send you connection requests, they'll appear here.
              </p>
            </div>
          </div>
        )}

        {/* ── PENDING REQUESTS ── */}
        {pending.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
                New Requests · {pending.length}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pending.map((req, i) => (
                <MentorCard
                  key={req.id}
                  req={{ ...req, mentorData: mentorProfiles[req.fromId] }}
                  idx={i}
                  onViewProfile={() => setProfileOpen({ id: req.fromId, col: "mentors" })}
                  onAccept={() => acceptRequest(req)}
                  onReject={() => rejectRequest(req.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── CONNECTED ── */}
        {accepted.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#34d399" }}>
                Connected · {accepted.length}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {accepted.map((req, i) => (
                <MentorCard
                  key={req.id}
                  req={{ ...req, mentorData: mentorProfiles[req.fromId] }}
                  idx={i}
                  onViewProfile={() => setProfileOpen({ id: req.fromId, col: "mentors" })}
                  onAccept={() => acceptRequest(req)}
                  onReject={() => rejectRequest(req.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── DECLINED (collapsed, minimal) ── */}
        {rejected.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#d1d5db" }}>
                Declined · {rejected.length}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejected.map((req, i) => (
                <MentorCard
                  key={req.id}
                  req={{ ...req, mentorData: mentorProfiles[req.fromId] }}
                  idx={i}
                  onViewProfile={() => setProfileOpen({ id: req.fromId, col: "mentors" })}
                  onAccept={() => acceptRequest(req)}
                  onReject={() => rejectRequest(req.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── PROFILE DRAWER ── */}
      {profileOpen && (
        <ProfileDrawer
          profileId={profileOpen.id}
          collection={profileOpen.col}
          onClose={() => setProfileOpen(null)}
        />
      )}

      <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.35)} 50%{box-shadow:0 0 0 6px rgba(16,185,129,0)} }
        @keyframes shimmer { 0%{background-position:0% 0} 100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideInRight { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
    </>
  );
}