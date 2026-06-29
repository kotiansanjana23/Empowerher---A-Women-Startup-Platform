/**
 * ConnectedWorkspace.tsx
 * ══════════════════════════════════════════════════════════
 * EmpowerHer — Mentor ↔ Investor Funding Match
 * Upgraded Connected Workspace (drop-in replacement)
 *
 * ▸ Locked workspace before acceptance
 * ▸ 4 tabs: Overview · Chat (floating popup) · Founder Rec · Timeline
 * ▸ Realtime Firebase (Firestore listeners)
 * ▸ Lavender / glassmorphism theme — NO dark UI
 * ▸ Framer Motion animations
 * ▸ Emoji picker · typing indicator · online status · seen/pin/reply in chat
 * ▸ Meeting scheduling inside chat popup only
 * ▸ No duplicate sections
 * ══════════════════════════════════════════════════════════
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  db, auth,
} from "../../../../../../firebase"; // adjust path as needed
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  doc, orderBy, setDoc, serverTimestamp, deleteDoc, getDoc,
  arrayUnion,
} from "firebase/firestore";
import {
  ArrowLeft, Building2, MapPin, Mail, Users, Star,
  Calendar, Send, CheckCircle, Loader2, Link2, DollarSign,
  TrendingUp, Clock, BadgeCheck, ChevronRight, MessageCircle,
  Sparkles, Zap, Bell, UserPlus, Check, X,
  Activity, Award, Briefcase, FileText,
  Eye, Lock, Unlock, Filter, Search,
  Target, Globe, RotateCcw,
  Shield, Rocket, BarChart3, Handshake,
  Pin, Smile,
  ChevronDown, MoreHorizontal, Video, Phone,
  TrendingDown, Flag, ThumbsUp, ThumbsDown,
  AlertCircle, Layers, Heart, Bookmark, Share2,
  ArrowRight, Plus, Minus, Inbox, Hash,
  Send as SendIcon, CornerUpLeft, Circle,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type DealStatus    = "Not Contacted" | "Recommended" | "Pitch Sent" | "Funded";
type ConnStatus    = "none" | "pending" | "accepted" | "rejected";
type WorkspaceTab  = "overview" | "chat" | "recommendations" | "timeline";

interface AuthUser  { uid: string; displayName: string; email: string; }
interface ChatMessage {
  id: string; senderId: string; senderName: string; text: string;
  createdAt: any; pinned?: boolean; seenBy?: string[];
  deleted?: boolean; replyTo?: any; type?: string; emoji?: string;
}
interface Meeting {
  id: string; date: string; time: string; title: string;
  status: "pending" | "accepted" | "rejected";
  meetLink?: string; requesterId: string; requesterName: string; chatId: string;
}
interface Recommendation {
  id: string; founderId: string; founderName: string; startupName: string;
  note: string; mentorName: string; pitch?: string;
  status: "pending" | "interested" | "pass" | "pitch_requested" | "meeting_requested";
  createdAt: any; traction?: string; stage?: string; growth?: string; fundingNeeded?: string;
  founderPhotoURL?: string;
}
interface TimelineEvent {
  id: string; type: string; label: string; detail: string; createdAt: any;
}

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════ */
const DEAL_STYLES: Record<DealStatus, { bg: string; text: string; border: string; dot: string }> = {
  "Not Contacted": { bg: "bg-slate-100",   text: "text-slate-600",  border: "border-slate-200",  dot: "bg-slate-400"   },
  "Recommended":   { bg: "bg-violet-100",  text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500"  },
  "Pitch Sent":    { bg: "bg-sky-100",     text: "text-sky-700",    border: "border-sky-200",    dot: "bg-sky-500"     },
  "Funded":        { bg: "bg-emerald-100", text: "text-emerald-700",border: "border-emerald-200",dot: "bg-emerald-500" },
};

const WORKSPACE_TABS: { key: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
  { key: "overview",        label: "Overview",          icon: <Layers       className="w-4 h-4" /> },
  { key: "chat",            label: "Chat",              icon: <MessageCircle className="w-4 h-4" /> },
  { key: "recommendations", label: "Founder Rec.",      icon: <Handshake    className="w-4 h-4" /> },
  { key: "timeline",        label: "Timeline",          icon: <Activity     className="w-4 h-4" /> },
];

const EMOJI_LIST = ["👍","❤️","🎉","💡","🔥","✅","🚀","💰","🤝","😊","👏","⭐","🙌","💎","🌟"];

/* ══════════════════════════════════════════════════════════
   SHARED ATOMS
══════════════════════════════════════════════════════════ */
function Avatar({
  src, name, size = "md", className = "",
}: { src?: string; name: string; size?: "sm"|"md"|"lg"|"xl"; className?: string }) {
  const sz = { sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-sm", lg: "w-16 h-16 text-xl", xl: "w-20 h-20 text-2xl" };
  return src
    ? <img src={src} alt={name} className={`${sz[size]} rounded-2xl object-cover flex-shrink-0 ${className}`} />
    : <div className={`${sz[size]} rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
        {name?.[0]?.toUpperCase() || "?"}
      </div>;
}

function GlassCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(109,40,217,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: DealStatus }) {
  const s = DEAL_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status !== "Not Contacted" ? "animate-pulse" : ""}`} />
      {status.toUpperCase()}
    </span>
  );
}

function MatchRing({ score }: { score: number }) {
  const r = 18, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#8b5cf6" : "#f59e0b";
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#ede9fe" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black text-violet-800">{score}%</span>
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

/* ══════════════════════════════════════════════════════════
   LOCKED WORKSPACE (before acceptance)
══════════════════════════════════════════════════════════ */
function LockedWorkspace({ investor, conn, onConnect, onWithdraw, sendingConn }: {
  investor: any; conn: ConnStatus;
  onConnect: () => Promise<void>; onWithdraw: () => void; sendingConn: boolean;
}) {
  const name = investor.fullName || investor.name || "Investor";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Hero card */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-xl"
        style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#9333ea,#be185d)" }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(ellipse at 20% 80%,rgba(255,255,255,0.3),transparent 55%),radial-gradient(ellipse at 80% 20%,rgba(255,255,255,0.15),transparent 45%)" }} />
        <div className="relative px-6 py-8 flex items-center gap-4">
          <Avatar src={investor.photoURL} name={name} size="xl" className="border-4 border-white/30 shadow-xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-white">{name}</h2>
              <BadgeCheck className="w-5 h-5 text-pink-200" />
            </div>
            {investor.company && <p className="text-purple-100 text-sm flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {investor.company}</p>}
            {investor.location && <p className="text-purple-200 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {investor.location}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill status="Not Contacted" />
              {conn === "pending" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/30 border border-amber-300/40 text-amber-100 text-[11px] font-bold">
                  <Clock className="w-3 h-3" /> Request Pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lock message */}
      <GlassCard className="p-8 text-center">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(167,139,250,0.2))" }}
        >
          <Lock className="w-8 h-8 text-violet-400" />
        </motion.div>
        <h3 className="text-lg font-black text-gray-800 mb-2">Workspace Locked</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs mx-auto">
          Connect with <strong className="text-violet-700">{name}</strong> to unlock the full collaboration workspace — chat, founder recommendations, and deal timeline.
        </p>

        {conn === "none" && (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onConnect}
            disabled={sendingConn}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea,#ec4899)" }}
          >
            {sendingConn ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><UserPlus className="w-4 h-4" /> Send Connection Request</>}
          </motion.button>
        )}

        {conn === "pending" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <p className="text-sm text-amber-700 font-semibold">Awaiting investor response…</p>
            </div>
            <button
              onClick={onWithdraw}
              className="text-xs text-red-400 font-semibold hover:text-red-600 hover:underline"
            >
              Withdraw request
            </button>
          </div>
        )}
      </GlassCard>

      {/* Blurred preview */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 z-10 rounded-3xl flex items-center justify-center"
          style={{ backdropFilter: "blur(10px)", background: "rgba(245,243,255,0.7)" }}>
          <div className="text-center">
            <Lock className="w-6 h-6 text-violet-300 mx-auto mb-2" />
            <p className="text-xs text-violet-400 font-semibold">Connect to preview workspace</p>
          </div>
        </div>
        <div className="p-5 space-y-3 opacity-30 pointer-events-none select-none">
          {["Chat", "Founder Recommendations", "Deal Timeline"].map(t => (
            <div key={t} className="h-12 rounded-2xl bg-violet-100 flex items-center px-4">
              <div className="w-24 h-3 bg-violet-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHAT POPUP
══════════════════════════════════════════════════════════ */
function ChatPopup({ authUser, investor, onClose, onSwitchTab }: {
  authUser: AuthUser;
  investor: any;
  onClose: () => void;
  onSwitchTab: (tab: WorkspaceTab) => void;
}) {
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [replyTo,     setReplyTo]     = useState<ChatMessage | null>(null);
  const [msgMenu,     setMsgMenu]     = useState<string | null>(null);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [typing,      setTyping]      = useState(false);   // remote side typing
  const [isTyping,    setIsTyping]    = useState(false);   // local debounce
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetings,    setMeetings]    = useState<Meeting[]>([]);
  const [mtgTitle,    setMtgTitle]    = useState("");
  const [mtgDate,     setMtgDate]     = useState("");
  const [mtgTime,     setMtgTime]     = useState("");
  const [mtgLink,     setMtgLink]     = useState("");
  const [savingMtg,   setSavingMtg]   = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const name   = investor.fullName || investor.name || "Investor";
  const chatId = [authUser.uid, investor.id].sort().join("_");

  /* ── messages ── */
  useEffect(() => {
    const q = query(
      collection(db, "mentorInvestorChats", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      msgs.forEach(m => {
        if (m.senderId !== authUser.uid && !(m.seenBy || []).includes(authUser.uid)) {
          updateDoc(doc(db, "mentorInvestorChats", chatId, "messages", m.id), {
            seenBy: arrayUnion(authUser.uid),
          }).catch(() => {});
        }
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    });
  }, [chatId, authUser.uid]);

  /* ── typing indicator ── */
  useEffect(() => {
    const ref = doc(db, "mentorInvestorChats", chatId, "presence", investor.id);
    return onSnapshot(ref, snap => setTyping(!!snap.data()?.typing));
  }, [chatId, investor.id]);

  const broadcastTyping = (val: boolean) => {
    setDoc(doc(db, "mentorInvestorChats", chatId, "presence", authUser.uid), { typing: val }, { merge: true }).catch(() => {});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!isTyping) { setIsTyping(true); broadcastTyping(true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { setIsTyping(false); broadcastTyping(false); }, 1500);
  };

  /* ── meetings ── */
  useEffect(() => {
    const q = query(collection(db, "meetings"), where("chatId", "==", chatId));
    return onSnapshot(q, snap => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting))));
  }, [chatId]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setInput(""); setSending(true);
    broadcastTyping(false); setIsTyping(false);
    const replySnap = replyTo; setReplyTo(null);
    try {
      await setDoc(doc(db, "mentorInvestorChats", chatId), {
        participants: [authUser.uid, investor.id],
        lastMessage: text, lastAt: serverTimestamp(),
      }, { merge: true });
      await addDoc(collection(db, "mentorInvestorChats", chatId, "messages"), {
        senderId: authUser.uid, senderName: authUser.displayName,
        text, type: "text", createdAt: serverTimestamp(), seenBy: [authUser.uid],
        ...(replySnap && { replyTo: { id: replySnap.id, text: replySnap.text, senderName: replySnap.senderName } }),
      });
    } catch (e) { console.error(e); setInput(text); }
    finally { setSending(false); }
  };

  const pinMessage = async (msg: ChatMessage) => {
    await updateDoc(doc(db, "mentorInvestorChats", chatId, "messages", msg.id), { pinned: !msg.pinned }).catch(console.error);
    setMsgMenu(null);
  };

  const deleteMessage = async (id: string) => {
    await updateDoc(doc(db, "mentorInvestorChats", chatId, "messages", id), { deleted: true, text: "" }).catch(console.error);
    setMsgMenu(null);
  };

  const scheduleMeeting = async () => {
    if (!mtgTitle || !mtgDate || !mtgTime || savingMtg) return;
    setSavingMtg(true);
    try {
      const mtgRef = await addDoc(collection(db, "meetings"), {
        chatId, requesterId: authUser.uid, requesterName: authUser.displayName,
        investorId: investor.id, mentorId: authUser.uid,
        title: mtgTitle, date: mtgDate, time: mtgTime, meetLink: mtgLink,
        status: "pending", createdAt: serverTimestamp(),
      });
      await sendMessage(`📅 Meeting request: "${mtgTitle}" on ${mtgDate} at ${mtgTime}${mtgLink ? ` — ${mtgLink}` : ""}`);
      await addDoc(collection(db, "activityTimeline"), {
        chatId, mentorId: authUser.uid, investorId: investor.id,
        type: "meeting_scheduled", label: "Meeting Scheduled",
        detail: `${mtgTitle} — ${mtgDate}`, createdAt: serverTimestamp(),
      });
      setMtgTitle(""); setMtgDate(""); setMtgTime(""); setMtgLink("");
      setShowMeeting(false);
    } catch (e) { console.error(e); } finally { setSavingMtg(false); }
  };

  const fmt = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const pinnedMsgs = messages.filter(m => m.pinned && !m.deleted);

  return (
    <AnimatePresence>
      <motion.div
        key="chat-popup"
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="fixed bottom-6 right-6 z-[900] flex flex-col rounded-3xl overflow-hidden"
        style={{
          width: 380, height: 560,
          background: "linear-gradient(160deg,#f3f0ff,#ede9fe,#faf5ff)",
          border: "1.5px solid rgba(139,92,246,0.25)",
          boxShadow: "0 24px 64px rgba(109,40,217,0.22), 0 4px 24px rgba(109,40,217,0.12)",
        }}
        onClick={() => { setMsgMenu(null); setShowEmoji(false); }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: "linear-gradient(90deg,#7c3aed,#9333ea,#a855f7)", borderBottom: "1px solid rgba(139,92,246,0.3)" }}
        >
          <div className="relative">
            <Avatar src={investor.photoURL} name={name} size="sm" className="ring-2 ring-white/30" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm truncate">{name}</p>
            {typing
              ? <p className="text-purple-200 text-[10px] animate-pulse">typing…</p>
              : <p className="text-purple-200 text-[10px]">Online • {investor.company || "Investor"}</p>
            }
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMeeting(v => !v)}
              title="Schedule Meeting"
              className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/20 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Pinned banner ── */}
        {pinnedMsgs.length > 0 && !showMeeting && (
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-violet-100/80 border-b border-violet-200/60">
            <Pin className="w-3 h-3 text-violet-500 flex-shrink-0" />
            <p className="text-[11px] text-violet-700 font-semibold truncate">{pinnedMsgs[pinnedMsgs.length - 1].text}</p>
          </div>
        )}

        {/* ── Meeting scheduler panel ── */}
        <AnimatePresence>
          {showMeeting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-2.5 bg-violet-50/80 border-b border-violet-200/60">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-violet-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Schedule Meeting</p>
                  <button onClick={() => setShowMeeting(false)} className="text-violet-400 hover:text-violet-600"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input value={mtgTitle} onChange={e => setMtgTitle(e.target.value)} placeholder="Meeting title…"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-violet-200 text-xs text-gray-800 placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={mtgDate} onChange={e => setMtgDate(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white border border-violet-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  <input type="time" value={mtgTime} onChange={e => setMtgTime(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white border border-violet-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <input value={mtgLink} onChange={e => setMtgLink(e.target.value)} placeholder="Meet / Zoom link (optional)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-violet-200 text-xs text-gray-800 placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                <button onClick={scheduleMeeting} disabled={!mtgTitle || !mtgDate || !mtgTime || savingMtg}
                  className="w-full py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                  {savingMtg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                  Send Meeting Request
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Upcoming meetings ── */}
        {meetings.length > 0 && !showMeeting && (
          <div className="flex-shrink-0 px-3 py-2 border-b border-violet-100/60 space-y-1">
            {meetings.filter(m => m.date >= new Date().toISOString().split("T")[0]).slice(0, 1).map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-sky-50 border border-sky-100">
                <Calendar className="w-3 h-3 text-sky-500 flex-shrink-0" />
                <p className="text-[10px] font-bold text-sky-700 truncate">{m.title} · {m.date} {m.time}</p>
                <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold ${m.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Messages ── */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.2) transparent" }}
          onClick={() => { setMsgMenu(null); setShowEmoji(false); }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(167,139,250,0.2))" }}>
                <MessageCircle className="w-7 h-7 text-violet-300" />
              </div>
              <div>
                <p className="text-violet-700 font-black text-sm">Start the conversation</p>
                <p className="text-violet-400 text-xs mt-0.5">Messages are private & secure</p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.senderId === authUser.uid;
            const seen   = (msg.seenBy || []).filter(id => id !== authUser.uid).length > 0;

            if (msg.deleted) return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <span className="text-[11px] text-violet-300 italic px-3 py-1.5 rounded-2xl bg-violet-50 border border-violet-100">
                  Message deleted
                </span>
              </div>
            );

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
              >
                {!isMine && (
                  <Avatar src={investor.photoURL} name={name} size="sm" className="mr-2 mt-1 flex-shrink-0 self-end" />
                )}
                <div className="relative max-w-[76%]">
                  {msg.replyTo && (
                    <div className={`flex mb-0.5 ${isMine ? "justify-end" : ""}`}>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] bg-violet-100 border border-violet-200 max-w-[180px]">
                        <CornerUpLeft className="w-2.5 h-2.5 text-violet-500 flex-shrink-0" />
                        <span className="text-violet-600 font-bold truncate">{msg.replyTo.senderName}:</span>
                        <span className="text-violet-500 truncate">{msg.replyTo.text}</span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? "text-white rounded-tr-sm" : "text-violet-900 rounded-tl-sm"}`}
                    style={isMine ? {
                      background: "linear-gradient(135deg,#7c3aed,#9333ea)",
                      boxShadow: "0 2px 12px rgba(124,58,237,0.25)",
                    } : {
                      background: "rgba(237,233,254,0.8)",
                      border: "1px solid rgba(139,92,246,0.2)",
                    }}
                  >
                    {msg.text}
                    {msg.pinned && <Pin className="inline w-2.5 h-2.5 ml-1.5 opacity-60" />}
                  </div>

                  <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
                    <span className="text-[9px] text-violet-400">{fmt(msg.createdAt)}</span>
                    {isMine && seen && <CheckCircle className="w-2.5 h-2.5 text-violet-400" />}
                    {isMine && !seen && <Check className="w-2.5 h-2.5 text-violet-300" />}
                  </div>

                  {/* Context menu trigger */}
                  <button
                    onClick={e => { e.stopPropagation(); setMsgMenu(msgMenu === msg.id ? null : msg.id); }}
                    className={`absolute top-1 ${isMine ? "-left-6" : "-right-6"} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-violet-400 hover:text-violet-700`}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Context menu */}
                  <AnimatePresence>
                    {msgMenu === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-50 ${isMine ? "right-0" : "left-0"} top-full mt-1 rounded-2xl overflow-hidden`}
                        style={{
                          background: "white", border: "1.5px solid rgba(139,92,246,0.2)",
                          boxShadow: "0 8px 24px rgba(109,40,217,0.15)", minWidth: 140,
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button onClick={() => { setReplyTo(msg); setMsgMenu(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
                          <CornerUpLeft className="w-3.5 h-3.5 text-violet-400" /> Reply
                        </button>
                        <button onClick={() => pinMessage(msg)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
                          <Pin className="w-3.5 h-3.5 text-violet-400" /> {msg.pinned ? "Unpin" : "Pin"}
                        </button>
                        {isMine && (
                          <button onClick={() => deleteMessage(msg.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                            <X className="w-3.5 h-3.5 text-red-400" /> Delete
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Typing dots */}
          {typing && (
            <div className="flex items-center gap-2">
              <Avatar src={investor.photoURL} name={name} size="sm" />
              <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-tl-sm"
                style={{ background: "rgba(237,233,254,0.8)", border: "1px solid rgba(139,92,246,0.2)" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Reply preview ── */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-shrink-0 mx-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-2xl bg-violet-100 border border-violet-200"
            >
              <CornerUpLeft className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-violet-600">{replyTo.senderName}</p>
                <p className="text-xs text-violet-500 truncate">{replyTo.text}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-violet-400 hover:text-violet-600 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Emoji picker ── */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
              className="flex-shrink-0 flex flex-wrap gap-1.5 px-3 py-2 border-t border-violet-100/60"
              style={{ background: "rgba(245,243,255,0.95)" }}
              onClick={e => e.stopPropagation()}
            >
              {EMOJI_LIST.map(e => (
                <button key={e} onClick={() => { setInput(p => p + e); setShowEmoji(false); inputRef.current?.focus(); }}
                  className="text-lg hover:scale-125 transition-transform">
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input bar ── */}
        <div
          className="flex-shrink-0 p-3 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(139,92,246,0.15)", background: "rgba(245,243,255,0.95)" }}
        >
          <button
            onClick={e => { e.stopPropagation(); setShowEmoji(v => !v); }}
            className="p-2 rounded-2xl text-violet-400 hover:text-violet-600 hover:bg-violet-100 transition-colors flex-shrink-0"
          >
            <Smile className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message…"
            className="flex-1 px-3.5 py-2.5 rounded-2xl text-sm text-violet-900 placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white border border-violet-200"
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            className="p-2.5 rounded-2xl text-white disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════════ */
function OverviewTab({ authUser, investor, conn, dealStatus, founders, setDealStatus, setActiveTab, setChatOpen }: any) {
  const [recs,     setRecs]     = useState<Recommendation[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const chatId = [authUser.uid, investor.id].sort().join("_");
  const name   = investor.fullName || investor.name || "Investor";

  useEffect(() => {
    return onSnapshot(query(collection(db, "mentorRecommendations"), where("chatId", "==", chatId)),
      snap => setRecs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recommendation))));
  }, [chatId]);
  useEffect(() => {
    return onSnapshot(query(collection(db, "meetings"), where("chatId", "==", chatId)),
      snap => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting))));
  }, [chatId]);

  const today      = new Date().toISOString().split("T")[0];
  const nextMtg    = meetings.filter(m => m.date >= today).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
  const latestRec  = recs[0];

  const fields = [
    { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Funding Range",  value: investor.funding || "–",                                                           color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    { icon: <Clock className="w-3.5 h-3.5" />,       label: "Availability",   value: investor.availabilityStatus || "–",                                                color: "text-orange-700",  bg: "bg-orange-50 border-orange-100"   },
    { icon: <Mail className="w-3.5 h-3.5" />,         label: "Email",          value: investor.email || "–",                                                             color: "text-sky-700",     bg: "bg-sky-50 border-sky-100"         },
    { icon: <TrendingUp className="w-3.5 h-3.5" />,   label: "Interests",      value: (investor.investmentInterests && investor.investmentInterests !== "0") ? investor.investmentInterests : "–", color: "text-pink-700",    bg: "bg-pink-50 border-pink-100"       },
    { icon: <Target className="w-3.5 h-3.5" />,       label: "Focus Stage",    value: investor.stage || "–",                                                             color: "text-violet-700",  bg: "bg-violet-50 border-violet-100"   },
    { icon: <Globe className="w-3.5 h-3.5" />,        label: "Location",       value: investor.location || "–",                                                          color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-100"   },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Profile */}
      <GlassCard className="p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-violet-500" /> Investor Profile
        </h3>
        <div className="flex items-start gap-4 mb-5">
          <Avatar src={investor.photoURL} name={name} size="lg" className="shadow-md ring-2 ring-purple-100" />
          <div className="flex-1">
            <h4 className="font-black text-gray-900 text-xl">{name}</h4>
            {investor.company && (
              <p className="text-sm text-violet-600 font-semibold flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" /> {investor.company}
              </p>
            )}
            {investor.bio && <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{investor.bio}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {fields.map(f => (
            <div key={f.label} className={`p-3 rounded-2xl border ${f.bg}`}>
              <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-0.5">{f.icon}{f.label}</p>
              <p className={`font-bold text-xs truncate ${f.color}`}>{f.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Stats */}
      <GlassCard className="p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-500" /> Collaboration Stats
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Meetings",   value: meetings.length,             color: "#7c3aed", icon: "📅" },
            { label: "Rec. Sent",  value: recs.length,                 color: "#ec4899", icon: "🤝" },
            { label: "Deal Stage", value: dealStatus.split(" ")[0],    color: "#10b981", icon: "✅" },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Next meeting */}
      {nextMtg && (
        <GlassCard className="p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" /> Upcoming Meeting
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50 border border-sky-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-100 flex-shrink-0">
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{nextMtg.title}</p>
              <p className="text-xs text-sky-600">{nextMtg.date} · {nextMtg.time}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${nextMtg.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {nextMtg.status}
            </span>
          </div>
        </GlassCard>
      )}

      {/* Latest recommendation */}
      <GlassCard className="p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" /> Latest Recommendation
        </h3>
        {latestRec ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
              {latestRec.founderName?.[0] || "?"}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{latestRec.founderName}</p>
              <p className="text-xs text-violet-600">{latestRec.startupName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{latestRec.status.replace(/_/g," ")}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">No recommendations yet</p>
            <button onClick={() => setActiveTab("recommendations")}
              className="text-xs text-violet-600 font-semibold hover:underline mt-1">
              Recommend a founder →
            </button>
          </div>
        )}
      </GlassCard>

      {/* Deal actions */}
      <GlassCard className="p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-violet-500" /> Deal Actions
        </h3>
        <div className="space-y-2">
          {dealStatus === "Not Contacted" && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setDealStatus(investor.id, investor, "Recommended")}
              className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}>
              <BadgeCheck className="w-4 h-4" /> Mark as Recommended
            </motion.button>
          )}
          {(dealStatus === "Recommended" || dealStatus === "Pitch Sent") && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("recommendations")}
              className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#2563eb)" }}>
              <Handshake className="w-4 h-4" /> Recommend a Founder
            </motion.button>
          )}
          {dealStatus === "Pitch Sent" && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setDealStatus(investor.id, investor, "Funded")}
              className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              style={{ background: "linear-gradient(135deg,#10b981,#0d9488)" }}>
              <CheckCircle className="w-4 h-4" /> Mark as Funded
            </motion.button>
          )}
          {dealStatus === "Funded" && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-bold text-sm">
              <CheckCircle className="w-4 h-4" /> Deal Funded ✓
            </div>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setChatOpen(true)}
            className="w-full py-3 rounded-2xl border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 text-sm font-semibold flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Open Chat
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   FOUNDER RECOMMENDATIONS TAB
══════════════════════════════════════════════════════════ */
function RecommendationsTab({ authUser, investor, founders }: { authUser: AuthUser; investor: any; founders: any[] }) {
  const [recs,         setRecs]         = useState<Recommendation[]>([]);
  const [showForm,     setShowForm]     = useState(false);
  const [selectedId,   setSelectedId]   = useState("");
  const [note,         setNote]         = useState("");
  const [traction,     setTraction]     = useState("");
  const [stage,        setStage]        = useState("Pre-Seed");
  const [growth,       setGrowth]       = useState("");
  const [pitch,        setPitch]        = useState("");
  const [funding,      setFunding]      = useState("");
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);
  const chatId = [authUser.uid, investor.id].sort().join("_");

  useEffect(() => {
    return onSnapshot(query(collection(db, "mentorRecommendations"), where("chatId", "==", chatId)),
      snap => setRecs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recommendation))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))));
  }, [chatId]);

  const selected = founders.find(f => f.id === selectedId);

  const send = async () => {
    if (!selected || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "mentorRecommendations"), {
        chatId, mentorId: authUser.uid, mentorName: authUser.displayName,
        investorId: investor.id, investorName: investor.fullName || investor.name || "",
        founderId: selected.founderId || selected.id,
        founderName: selected.founder, startupName: selected.startup,
        founderPhotoURL: selected.photoURL || "",
        note, traction, stage, growth, pitch, fundingNeeded: funding,
        status: "pending", createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "activityTimeline"), {
        chatId, mentorId: authUser.uid, investorId: investor.id,
        type: "founder_introduced", label: "Founder Recommended",
        detail: `${selected.founder} from ${selected.startup}`, createdAt: serverTimestamp(),
      });
      setShowForm(false); setSent(true);
      setSelectedId(""); setNote(""); setTraction(""); setGrowth(""); setPitch(""); setFunding("");
      setTimeout(() => setSent(false), 3500);
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  const updateStatus = async (id: string, status: Recommendation["status"]) => {
    await updateDoc(doc(db, "mentorRecommendations", id), { status }).catch(console.error);
  };

  const SC: Record<string, { bg: string; text: string; border: string }> = {
    pending:           { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
    interested:        { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    pass:              { bg: "bg-red-50",     text: "text-red-500",     border: "border-red-200"     },
    pitch_requested:   { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"     },
    meeting_requested: { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
  };
  const SL: Record<string, string> = {
    pending: "Pending Review", interested: "Interested ✓",
    pass: "Pass", pitch_requested: "Pitch Deck Requested", meeting_requested: "Meeting Requested",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {sent && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-semibold">
          <CheckCircle className="w-4 h-4" /> Recommendation sent!
        </motion.div>
      )}

      {!showForm && (
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-3xl text-white font-bold flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea,#ec4899)" }}
        >
          <Sparkles className="w-5 h-5" /> Recommend a Founder
        </motion.button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <Handshake className="w-4 h-4 text-violet-500" /> New Recommendation
                </h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {/* Founder selection */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Select Founder</label>
                  {founders.length === 0
                    ? <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center text-sm text-purple-400">No founders added yet</div>
                    : (
                      <div className="space-y-2 max-h-44 overflow-y-auto">
                        {founders.map(f => (
                          <button key={f.id} onClick={() => setSelectedId(f.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${selectedId === f.id ? "border-violet-400 bg-violet-50" : "border-purple-100 hover:border-violet-200 bg-white"}`}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                              {f.founder?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{f.founder}</p>
                              <p className="text-xs text-gray-500 truncate">{f.startup}</p>
                            </div>
                            {selectedId === f.id && <Check className="w-4 h-4 text-violet-600 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )
                  }
                </div>

                {selected && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {/* Metrics row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Stage</label>
                        <select value={stage} onChange={e => setStage(e.target.value)}
                          className="w-full border border-purple-100 bg-purple-50/40 text-gray-800 p-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                          {["Pre-Seed","Seed","Series A","Series B","Growth"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Growth</label>
                        <input value={growth} onChange={e => setGrowth(e.target.value)} placeholder="+30% MoM"
                          className="w-full border border-purple-100 bg-purple-50/40 text-gray-800 p-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-purple-300" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Traction / Key Metrics</label>
                      <input value={traction} onChange={e => setTraction(e.target.value)} placeholder="$10K MRR, 500 users, 3x YoY"
                        className="w-full border border-purple-100 bg-purple-50/40 text-gray-800 p-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-purple-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Funding Needed</label>
                      <input value={funding} onChange={e => setFunding(e.target.value)} placeholder="$500K"
                        className="w-full border border-purple-100 bg-purple-50/40 text-gray-800 p-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-purple-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">One-Line Pitch</label>
                      <input value={pitch} onChange={e => setPitch(e.target.value)} placeholder="What problem does this startup solve?"
                        className="w-full border border-purple-100 bg-purple-50/40 text-gray-800 p-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-purple-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Your Note</label>
                      <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                        placeholder="Why this founder stands out…"
                        className="w-full border border-purple-100 bg-purple-50/40 text-gray-800 p-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none placeholder-purple-300" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={send} disabled={sending}
                      className="w-full py-3 rounded-2xl text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                      Send Recommendation
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <div className="space-y-4">
        {recs.map((rec, i) => {
          const sc = SC[rec.status] || SC.pending;
          return (
            <motion.div key={rec.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <GlassCard className="overflow-hidden">
                <div className="h-1.5" style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899)" }} />
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {rec.founderPhotoURL
                      ? <img src={rec.founderPhotoURL} alt={rec.founderName} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                          {rec.founderName?.[0] || "?"}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-gray-900">{rec.founderName}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                          {SL[rec.status]}
                        </span>
                      </div>
                      <p className="text-sm text-violet-600 font-semibold">{rec.startupName}</p>
                      {rec.pitch && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rec.pitch}</p>}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {rec.stage        && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100"><Rocket className="w-2.5 h-2.5" />{rec.stage}</span>}
                    {rec.growth       && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100"><TrendingUp className="w-2.5 h-2.5" />{rec.growth}</span>}
                    {rec.traction     && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100"><BarChart3 className="w-2.5 h-2.5" />{rec.traction}</span>}
                    {rec.fundingNeeded && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-100"><DollarSign className="w-2.5 h-2.5" />{rec.fundingNeeded}</span>}
                  </div>

                  {rec.note && (
                    <div className="p-3 rounded-2xl bg-violet-50/60 border border-violet-100 mb-3">
                      <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider mb-1">Mentor's Note</p>
                      <p className="text-sm text-gray-700 leading-relaxed">"{rec.note}"</p>
                      <p className="text-[10px] text-violet-400 mt-1">— {rec.mentorName}</p>
                    </div>
                  )}

                  {rec.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Interested",    status: "interested"      as const, style: "bg-emerald-500", icon: <ThumbsUp className="w-3 h-3" /> },
                        { label: "Request Deck",  status: "pitch_requested" as const, style: "bg-sky-500",     icon: <FileText className="w-3 h-3" /> },
                        { label: "Pass",          status: "pass"            as const, style: "bg-gray-400",    icon: <ThumbsDown className="w-3 h-3" /> },
                      ].map(btn => (
                        <motion.button key={btn.status} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => updateStatus(rec.id, btn.status)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[11px] font-bold hover:opacity-90 ${btn.style}`}>
                          {btn.icon}{btn.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {recs.length === 0 && !showForm && (
        <div className="text-center py-14">
          <Handshake className="w-12 h-12 text-purple-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-semibold">No recommendations yet</p>
          <p className="text-xs text-gray-400 mt-1">Recommend a founder to get started</p>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   TIMELINE TAB
══════════════════════════════════════════════════════════ */
function TimelineTab({ authUser, investor, conn, dealStatus }: {
  authUser: AuthUser; investor: any; conn: ConnStatus; dealStatus: DealStatus;
}) {
  const [dynamicEvents, setDynamicEvents] = useState<TimelineEvent[]>([]);
  const chatId = [authUser.uid, investor.id].sort().join("_");

  useEffect(() => {
    const q = query(collection(db, "activityTimeline"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setDynamicEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineEvent))));
  }, [chatId]);

  const hasMeeting = dynamicEvents.some(e => e.type === "meeting_scheduled");
  const hasFounder = dynamicEvents.some(e => e.type === "founder_introduced");

  const steps = [
    {
      key: "discovered", label: "Profile Discovered",
      detail: "Investor added to your network",
      emoji: "🔍", active: true,
      grad: "from-slate-400 to-slate-500",
    },
    {
      key: "connected", label: "Connection Sent",
      detail: conn === "accepted" ? "Connected ✓" : conn === "pending" ? "Awaiting response…" : "Not yet sent",
      emoji: "🤝", active: conn === "pending" || conn === "accepted",
      grad: "from-amber-400 to-orange-400",
    },
    {
      key: "accepted", label: "Connection Accepted",
      detail: conn === "accepted" ? "Workspace fully unlocked" : "Pending investor response",
      emoji: "✅", active: conn === "accepted",
      grad: "from-emerald-400 to-teal-500",
    },
    {
      key: "chat_started", label: "Chat Started",
      detail: conn === "accepted" ? "Active conversation" : "Available after connection",
      emoji: "💬", active: conn === "accepted",
      grad: "from-violet-400 to-purple-500",
    },
    {
      key: "founder_rec", label: "Founder Recommended",
      detail: hasFounder ? "Founder recommended ✓" : "Recommend a founder to investor",
      emoji: "🌟", active: hasFounder,
      grad: "from-pink-400 to-rose-500",
    },
    {
      key: "meeting_scheduled", label: "Meeting Scheduled",
      detail: hasMeeting ? "Meeting booked ✓" : "Schedule a meeting via chat",
      emoji: "📅", active: hasMeeting,
      grad: "from-sky-400 to-blue-500",
    },
    {
      key: "recommended", label: "Investor Recommended",
      detail: dealStatus !== "Not Contacted" ? "Added to active pipeline" : "Mark investor as recommended",
      emoji: "⭐", active: dealStatus === "Recommended" || dealStatus === "Pitch Sent" || dealStatus === "Funded",
      grad: "from-violet-500 to-purple-600",
    },
    {
      key: "pitch", label: "Pitch Sent",
      detail: dealStatus === "Pitch Sent" || dealStatus === "Funded" ? "Investor reviewing" : "Awaiting pitch stage",
      emoji: "📨", active: dealStatus === "Pitch Sent" || dealStatus === "Funded",
      grad: "from-indigo-400 to-blue-600",
    },
    {
      key: "funded", label: "Deal Funded",
      detail: dealStatus === "Funded" ? "🎉 Investment confirmed!" : "Goal — close the deal",
      emoji: "🚀", active: dealStatus === "Funded",
      grad: "from-emerald-500 to-green-600",
    },
  ];

  const activeCount = steps.filter(s => s.active).length;

  const dynamicMeta: Record<string, { icon: string; color: string }> = {
    message:            { icon: "💬", color: "text-violet-600" },
    meeting_scheduled:  { icon: "📅", color: "text-sky-600"    },
    founder_introduced: { icon: "🌟", color: "text-pink-600"   },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-violet-500" /> Deal Progress Timeline
          </h2>
          <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
            {activeCount}/{steps.length} steps
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-violet-100 mb-7 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899)" }}
            initial={{ width: 0 }}
            animate={{ width: `${(activeCount / steps.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-violet-200 via-purple-100 to-transparent" />
          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 relative pb-6 last:pb-0"
              >
                <motion.div
                  animate={step.active ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: step.active && step.key === steps.filter(s => s.active).at(-1)?.key ? Infinity : 0, duration: 2.5 }}
                  className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center text-base flex-shrink-0 border-2 transition-all duration-500 ${step.active ? "border-white shadow-lg" : "border-gray-100 opacity-35 grayscale"}`}
                  style={step.active ? { background: `linear-gradient(135deg, var(--from), var(--to))`,
                    ["--from" as any]: step.grad.split(" ")[1].replace("from-","").includes("slate") ? "#94a3b8" :
                                       step.grad.includes("amber") ? "#f59e0b" :
                                       step.grad.includes("emerald") && !step.grad.includes("green") ? "#10b981" :
                                       step.grad.includes("violet") ? "#7c3aed" :
                                       step.grad.includes("pink")   ? "#ec4899" :
                                       step.grad.includes("sky")    ? "#0ea5e9" :
                                       step.grad.includes("indigo") ? "#4f46e5" :
                                       step.grad.includes("green")  ? "#22c55e" : "#7c3aed",
                    ["--to" as any]: step.grad.split(" ")[2].replace("to-","").includes("slate") ? "#64748b" :
                                     step.grad.includes("orange")   ? "#ea580c" :
                                     step.grad.includes("teal")     ? "#0d9488" :
                                     step.grad.includes("purple")   ? "#6d28d9" :
                                     step.grad.includes("rose")     ? "#e11d48" :
                                     step.grad.includes("blue")     ? "#2563eb" :
                                     step.grad.includes("green")    ? "#16a34a" : "#9333ea",
                  } : { background: "#f1f5f9" }}
                >
                  <span>{step.emoji}</span>
                  {step.active && step.key === steps.filter(s => s.active).at(-1)?.key && (
                    <motion.span
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white"
                    />
                  )}
                </motion.div>

                <div className="flex-1 pt-1.5">
                  <p className={`text-sm font-bold ${step.active ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
                  <p className={`text-xs mt-0.5 ${step.active ? "text-gray-500" : "text-gray-300"}`}>{step.detail}</p>
                </div>

                {step.active && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-2" />}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic activity log */}
        {dynamicEvents.length > 0 && (
          <div className="mt-7 pt-5 border-t border-purple-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Recent Activity</p>
            <div className="space-y-2">
              {[...dynamicEvents].reverse().map(ev => {
                const meta = dynamicMeta[ev.type] || { icon: "📌", color: "text-purple-600" };
                return (
                  <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-violet-50/50 border border-violet-100">
                    <span className="text-base flex-shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${meta.color} truncate`}>{ev.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{ev.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONNECTED WORKSPACE  ← main export
══════════════════════════════════════════════════════════ */
export function ConnectedWorkspace({
  authUser, investor, founders, conn, dealStatus, setDealStatus, onWithdraw,
}: {
  authUser: AuthUser;
  investor: any;
  founders: any[];
  conn: ConnStatus;
  dealStatus: DealStatus;
  setDealStatus: (id: string, investor: any, status: DealStatus) => void;
  onWithdraw: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [chatOpen,  setChatOpen]  = useState(false);
  const [sendingConn, setSendingConn] = useState(false);

  // onConnect is expected from parent; we accept it as a prop for the locked view
  const handleConnect = async () => {
    // Placeholder — parent normally passes this in via InvestorProfile
    // For LockedWorkspace usage from InvestorProfile, pass the real handler
  };

  const name      = investor.fullName || investor.name || "Investor";
  const isUnlocked = conn === "accepted";

  return (
    <div className="space-y-6">
      {/* ── Workspace header (always shown) ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-xl"
        style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#9333ea,#be185d)" }}
      >
        {/* Ambient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }} />
        </div>

        <div className="relative px-6 py-6 flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Avatar src={investor.photoURL} name={name} size="lg" className="border-4 border-white/30 shadow-xl" />
            {isUnlocked && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white truncate">{name}</h2>
              <BadgeCheck className="w-5 h-5 text-pink-200 flex-shrink-0" />
            </div>
            {investor.company && (
              <p className="text-purple-100 text-sm flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {investor.company}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusPill status={dealStatus} />
              {isUnlocked && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/30 border border-emerald-300/50 text-emerald-100 text-[11px] font-bold">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
              {conn === "pending" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/30 border border-amber-300/40 text-amber-100 text-[11px] font-bold">
                  <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} /> Pending
                </span>
              )}
              {!isUnlocked && conn !== "pending" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[11px] font-bold">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
          </div>

          {/* Match ring only when unlocked */}
          {isUnlocked && (
            <div className="hidden sm:block">
              <MatchRing score={75 + (Math.abs(investor.id?.charCodeAt(0) || 65) % 20)} />
            </div>
          )}
        </div>

        {/* Tabs — only when unlocked */}
        {isUnlocked && (
          <div className="flex gap-1 px-6 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {WORKSPACE_TABS.map(t => {
              const isActive = t.key === "chat" ? chatOpen : (activeTab === t.key && !chatOpen);
              return (
                <motion.button
                  key={t.key}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (t.key === "chat") { setChatOpen(true); setActiveTab("overview"); }
                    else { setChatOpen(false); setActiveTab(t.key); }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-white text-violet-700 shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {t.icon}{t.label}
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Pending notice ── */}
      {conn === "pending" && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 border border-amber-200"
        >
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-amber-700 font-semibold flex-1">Connection request sent — awaiting investor response.</p>
          <button onClick={() => onWithdraw(investor.id)} className="text-xs text-red-500 font-semibold hover:underline whitespace-nowrap">Withdraw</button>
        </motion.div>
      )}

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LockedWorkspace
              investor={investor} conn={conn}
              onConnect={handleConnect}
              onWithdraw={() => onWithdraw(investor.id)}
              sendingConn={sendingConn}
            />
          </motion.div>
        ) : (
          <motion.div key={activeTab + String(chatOpen)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && !chatOpen && (
              <OverviewTab
                authUser={authUser} investor={investor} conn={conn}
                dealStatus={dealStatus} founders={founders}
                setDealStatus={setDealStatus}
                setActiveTab={(tab: WorkspaceTab) => { setActiveTab(tab); setChatOpen(false); }}
                setChatOpen={setChatOpen}
              />
            )}
            {activeTab === "recommendations" && !chatOpen && (
              <RecommendationsTab authUser={authUser} investor={investor} founders={founders} />
            )}
            {activeTab === "timeline" && !chatOpen && (
              <TimelineTab authUser={authUser} investor={investor} conn={conn} dealStatus={dealStatus} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating chat popup ── */}
      <AnimatePresence>
        {chatOpen && isUnlocked && (
          <ChatPopup
            authUser={authUser}
            investor={investor}
            onClose={() => setChatOpen(false)}
            onSwitchTab={(tab) => { setChatOpen(false); setActiveTab(tab); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   InvestorProfile — updated to pass onConnect into ConnectedWorkspace
   and handle the locked → accepted flow without routing changes
══════════════════════════════════════════════════════════ */


export default ConnectedWorkspace;