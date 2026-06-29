/**
 * EmpowerHer — Upgraded Mentor ↔ Investor Chat Workspace
 * Drop-in replacement for ChatTab + MeetingsTab inside ConnectedWorkspace.
 *
 * Dependencies (all already in the project):
 *   react, firebase/firestore, firebase/storage, lucide-react, framer-motion
 *
 * NEW: framer-motion for animations, firebase/storage for real file uploads.
 * Add to your project:  npm install framer-motion
 *                       (firebase/storage is already part of the firebase SDK)
 */

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth, storage } from "../../../../../../firebase"; // adjust path
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  doc, orderBy, setDoc, serverTimestamp, deleteDoc, getDoc, limit,
} from "firebase/firestore";
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL,
} from "firebase/storage";
import {
  Send, Pin, X, Check, CheckCheck, Loader2, Smile, Paperclip,
  Calendar, CornerUpLeft, Trash2, MoreVertical, Video, Clock,
  ChevronDown, ChevronUp, FileText, Image as ImageIcon,
  Download, BadgeCheck, Bell, Plus, FileUp, StickyNote,
  CalendarCheck, CalendarX, RefreshCw, Maximize2, Minimize2,
  ArrowUpRight, Circle,
} from "lucide-react";

/* ─────────────────────────── TYPES ─────────────────────────── */

interface AuthUser { uid: string; displayName: string; email: string; }

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  seenBy?: string[];
  pinned?: boolean;
  replyTo?: { id: string; text: string; senderName: string };
  deleted?: boolean;
  fileURL?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  type?: "text" | "file" | "meeting_card" | "system";
  meetingRef?: string; // meeting doc id when type === "meeting_card"
}

interface Meeting {
  id: string;
  date: string;
  time: string;
  title: string;
  notes?: string;
  status: "pending" | "accepted" | "rejected" | "rescheduled";
  meetLink?: string;
  requesterId: string;
  requesterName: string;
  chatId: string;
}

/* ─────────────────────────── CONSTANTS ─────────────────────── */

// Simple built-in emoji palette (no external lib needed)
const EMOJI_SET = [
  "👋","😊","🙌","🔥","💜","✨","🚀","💡","💰","📈",
  "🤝","🎯","📊","🏆","⚡","🌟","💎","🎉","👏","📅",
  "📌","📎","📝","✅","❌","⏰","💬","🔔","📧","🌐",
];

const MEETING_TIMES = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","14:00","14:30","15:00",
  "15:30","16:00","16:30","17:00","17:30","18:00",
];

/* ─────────────────────────── ATOMS ─────────────────────────── */

function Avatar({
  src, name, size = "md", online = false, className = "",
}: {
  src?: string; name: string;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}) {
  const sz = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {src
        ? <img src={src} alt={name}
            className={`${sz[size]} rounded-2xl object-cover`} />
        : <div className={`${sz[size]} rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-black`}>
            {name?.[0]?.toUpperCase() || "?"}
          </div>
      }
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
      )}
    </div>
  );
}

function UploadProgress({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100">
      <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin flex-shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-violet-100 overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-violet-600 font-bold">{pct}%</span>
    </div>
  );
}

/* ──────────────────── MEETING SCHEDULER MODAL ──────────────── */

function MeetingSchedulerModal({
  onClose, onSchedule, authUser, investor,
}: {
  onClose: () => void;
  onSchedule: (m: Omit<Meeting, "id">) => Promise<void>;
  authUser: AuthUser;
  investor: any;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    if (!title.trim() || !date || saving) return;
    setSaving(true);
    const chatId = [authUser.uid, investor.id].sort().join("_");
    await onSchedule({
      chatId,
      date,
      time,
      title: title.trim(),
      notes: notes.trim(),
      meetLink: meetLink.trim() || `https://meet.google.com/${Math.random().toString(36).slice(2, 10)}`,
      status: "pending",
      requesterId: authUser.uid,
      requesterName: authUser.displayName,
    });
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(12px)", background: "rgba(15,5,30,0.55)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 24, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg,#1e0a3c,#2d1060)",
          border: "1px solid rgba(167,139,250,0.25)",
          boxShadow: "0 32px 80px rgba(109,40,217,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Schedule Meeting</h3>
              <p className="text-purple-300 text-xs">with {investor.fullName || investor.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-purple-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">
              Meeting Title *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Intro Call, Portfolio Review…"
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(167,139,250,0.2)",
              }}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Date *</label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  colorScheme: "dark",
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Time</label>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(167,139,250,0.2)",
                }}
              >
                {MEETING_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Meet link */}
          <div>
            <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">
              Meet Link <span className="normal-case text-purple-500">(auto-generated if blank)</span>
            </label>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <input
                value={meetLink}
                onChange={e => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/…"
                className="flex-1 px-4 py-3 rounded-2xl text-sm text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(167,139,250,0.2)",
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Agenda, topics to discuss…"
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(167,139,250,0.2)",
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-purple-300 hover:text-white hover:bg-white/10 transition-colors border border-white/10">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !date || saving}
              className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CalendarCheck className="w-4 h-4" />
              }
              {saving ? "Sending…" : "Send Request"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────── MEETING CARD (inline in chat) ─────────── */

function MeetingCard({
  meetingId, authUser, chatId,
}: {
  meetingId: string;
  authUser: AuthUser;
  chatId: string;
}) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    if (!meetingId) return;
    return onSnapshot(doc(db, "meetings", meetingId), snap => {
      if (snap.exists()) setMeeting({ id: snap.id, ...snap.data() } as Meeting);
    });
  }, [meetingId]);

  if (!meeting) return null;

  const isRequester = meeting.requesterId === authUser.uid;
  const statusStyles = {
    pending:      { bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.4)",  text: "#fbbf24", label: "Pending" },
    accepted:     { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.4)", text: "#10b981", label: "Confirmed ✓" },
    rejected:     { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.4)",  text: "#ef4444", label: "Declined" },
    rescheduled:  { bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.4)", text: "#8b5cf6", label: "Reschedule Requested" },
  };
  const st = statusStyles[meeting.status];

  const respond = async (status: "accepted" | "rejected") => {
    try { await updateDoc(doc(db, "meetings", meeting.id), { status }); } catch (e) { console.error(e); }
  };

  const d = meeting.date ? new Date(meeting.date + "T00:00:00") : null;
  const monthStr = d?.toLocaleString("default", { month: "short" }).toUpperCase() ?? "--";
  const dayStr   = d?.getDate() ?? "--";

  return (
    <div className="rounded-2xl overflow-hidden my-1"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${st.border}`,
      }}>
      <div className="px-3 py-2.5 flex items-center gap-3">
        {/* Date badge */}
        <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}>
          <span className="text-[8px] font-black text-purple-200 uppercase">{monthStr}</span>
          <span className="text-lg font-black text-white leading-none">{dayStr}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{meeting.title}</p>
          <p className="text-purple-300 text-[11px]">{meeting.time} • {meeting.requesterName}</p>
          {meeting.notes && <p className="text-purple-400 text-[10px] truncate mt-0.5">"{meeting.notes}"</p>}
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ background: st.bg, color: st.text }}>
          {st.label}
        </span>
      </div>

      {/* Actions */}
      {meeting.status === "pending" && !isRequester && (
        <div className="flex border-t border-white/10">
          {[
            { label: "Accept",   icon: <CalendarCheck className="w-3.5 h-3.5" />, action: () => respond("accepted"), color: "#10b981" },
            { label: "Decline",  icon: <CalendarX className="w-3.5 h-3.5" />,     action: () => respond("rejected"), color: "#ef4444" },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              className="flex-1 py-2 text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors hover:bg-white/10"
              style={{ color: btn.color }}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>
      )}

      {meeting.status === "accepted" && meeting.meetLink && (
        <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-black text-violet-300 hover:text-white border-t border-white/10 hover:bg-white/10 transition-colors">
          <Video className="w-3.5 h-3.5" /> Join Meeting
          <ArrowUpRight className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

/* ─────────────────── FILE PREVIEW BUBBLE ───────────────────── */

function FileBubble({ msg }: { msg: ChatMessage }) {
  const isImage = msg.fileType?.startsWith("image/");
  const isPDF   = msg.fileType?.includes("pdf");

  const fmtSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isImage && msg.fileURL) {
    return (
      <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden mt-1">
        <img src={msg.fileURL} alt={msg.fileName || "Image"} className="max-w-[220px] max-h-48 object-cover rounded-xl" />
      </a>
    );
  }

  return (
    <a href={msg.fileURL || "#"} target={msg.fileURL ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-1 hover:opacity-90 transition-opacity"
      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: isPDF ? "rgba(239,68,68,0.3)" : "rgba(139,92,246,0.3)" }}>
        {isPDF ? <FileText className="w-4 h-4 text-red-300" /> : <FileUp className="w-4 h-4 text-violet-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-xs truncate">{msg.fileName || "File"}</p>
        <p className="text-purple-300 text-[10px]">{fmtSize(msg.fileSize)}</p>
      </div>
      {msg.fileURL && <Download className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />}
    </a>
  );
}

/* ─────────────────── EMOJI PICKER ──────────────────────────── */

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="absolute bottom-full mb-2 left-0 z-50 p-3 rounded-2xl grid grid-cols-5 gap-1.5"
      style={{
        background: "linear-gradient(145deg,#1e0a3c,#2d1060)",
        border: "1px solid rgba(167,139,250,0.25)",
        boxShadow: "0 16px 48px rgba(109,40,217,0.4)",
      }}
    >
      {EMOJI_SET.map(em => (
        <button key={em} onClick={() => { onSelect(em); onClose(); }}
          className="w-9 h-9 text-lg rounded-xl hover:bg-white/15 transition-colors flex items-center justify-center">
          {em}
        </button>
      ))}
    </motion.div>
  );
}

/* ──────────────────────── MAIN CHAT TAB ────────────────────── */

export function ChatTab({
  authUser, investor,
}: {
  authUser: AuthUser;
  investor: any;
}) {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [typing, setTyping]           = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [pinnedMsgs, setPinnedMsgs]   = useState<ChatMessage[]>([]);
  const [showPinned, setShowPinned]   = useState(false);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [replyTo, setReplyTo]         = useState<ChatMessage | null>(null);
  const [uploadPct, setUploadPct]     = useState<number | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded]       = useState(false);
  const [msgMenu, setMsgMenu]         = useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<any>(null);

  const name   = investor.fullName || investor.name || "Investor";
  const chatId = useMemo(() => [authUser.uid, investor.id].sort().join("_"), [authUser.uid, investor.id]);

  /* ── Realtime messages ── */
  useEffect(() => {
    const q = query(
      collection(db, "mentorInvestorChats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      setPinnedMsgs(msgs.filter(m => m.pinned && !m.deleted));
      // Mark unseen messages as seen
      msgs.forEach(m => {
        if (m.senderId !== authUser.uid && !(m.seenBy || []).includes(authUser.uid)) {
          updateDoc(doc(db, "mentorInvestorChats", chatId, "messages", m.id), {
            seenBy: [...(m.seenBy || []), authUser.uid],
          }).catch(() => {});
        }
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
  }, [chatId, authUser.uid]);

  /* ── Typing + online presence ── */
  useEffect(() => {
    const presRef = doc(db, "mentorInvestorChats", chatId, "presence", investor.id);
    return onSnapshot(presRef, snap => {
      if (snap.exists()) {
        const d = snap.data();
        const lastTyped = d?.typingAt?.toMillis?.() || 0;
        const lastSeen  = d?.lastSeen?.toMillis?.() || 0;
        setTyping(Date.now() - lastTyped < 4000);
        setOtherOnline(Date.now() - lastSeen < 60000);
      }
    });
  }, [chatId, investor.id]);

  /* ── Own presence heartbeat ── */
  useEffect(() => {
    const selfRef = doc(db, "mentorInvestorChats", chatId, "presence", authUser.uid);
    const beat = () => setDoc(selfRef, { lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
    beat();
    const iv = setInterval(beat, 30000);
    return () => clearInterval(iv);
  }, [chatId, authUser.uid]);

  /* ── Handlers ── */
  const handleInputChange = (val: string) => {
    setInput(val);
    const selfRef = doc(db, "mentorInvestorChats", chatId, "presence", authUser.uid);
    setDoc(selfRef, { typingAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setDoc(selfRef, { typingAt: null }, { merge: true }).catch(() => {});
    }, 2000);
  };

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const optimisticId = `opt_${Date.now()}`;
    const replySnap = replyTo;
    setReplyTo(null);
    try {
      await setDoc(doc(db, "mentorInvestorChats", chatId), {
        participants: [authUser.uid, investor.id],
        lastMessage: text,
        lastAt: serverTimestamp(),
      }, { merge: true });
      await addDoc(collection(db, "mentorInvestorChats", chatId, "messages"), {
        senderId: authUser.uid,
        senderName: authUser.displayName,
        text,
        type: "text",
        createdAt: serverTimestamp(),
        seenBy: [authUser.uid],
        ...(replySnap && {
          replyTo: { id: replySnap.id, text: replySnap.text, senderName: replySnap.senderName },
        }),
      });
    } catch (e) { console.error(e); setInput(text); }
    finally { setSending(false); }
  }, [input, sending, chatId, authUser, investor.id, replyTo]);

  const handleFile = async (file: File) => {
    if (!file) return;
    const path = `chatFiles/${chatId}/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, path);
    const task = uploadBytesResumable(sRef, file);
    setUploadPct(0);
    task.on("state_changed",
      snap => setUploadPct(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err => { console.error(err); setUploadPct(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await setDoc(doc(db, "mentorInvestorChats", chatId), {
          participants: [authUser.uid, investor.id],
          lastMessage: `📎 ${file.name}`,
          lastAt: serverTimestamp(),
        }, { merge: true });
        await addDoc(collection(db, "mentorInvestorChats", chatId, "messages"), {
          senderId: authUser.uid,
          senderName: authUser.displayName,
          text: "",
          type: "file",
          fileURL: url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          createdAt: serverTimestamp(),
          seenBy: [authUser.uid],
        });
        setUploadPct(null);
      }
    );
  };

  const pinMessage = async (msg: ChatMessage) => {
    await updateDoc(doc(db, "mentorInvestorChats", chatId, "messages", msg.id), {
      pinned: !msg.pinned,
    }).catch(console.error);
  };

  const deleteMessage = async (id: string) => {
    await updateDoc(doc(db, "mentorInvestorChats", chatId, "messages", id), {
      deleted: true, text: "",
    }).catch(console.error);
    setMsgMenu(null);
  };

  const scheduleMeeting = async (data: Omit<Meeting, "id">) => {
    const meetRef = await addDoc(collection(db, "meetings"), {
      ...data, createdAt: serverTimestamp(),
    });
    // Post a meeting card in chat
    await setDoc(doc(db, "mentorInvestorChats", chatId), {
      participants: [authUser.uid, investor.id],
      lastMessage: `📅 ${data.title}`,
      lastAt: serverTimestamp(),
    }, { merge: true });
    await addDoc(collection(db, "mentorInvestorChats", chatId, "messages"), {
      senderId: authUser.uid,
      senderName: authUser.displayName,
      text: `📅 Meeting request: ${data.title}`,
      type: "meeting_card",
      meetingRef: meetRef.id,
      createdAt: serverTimestamp(),
      seenBy: [authUser.uid],
    });
  };

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  /* ── Message grouping by sender ── */
  const grouped = useMemo(() => {
    const out: Array<{ msgs: ChatMessage[]; senderId: string }> = [];
    messages.forEach(m => {
      if (out.length && out[out.length - 1].senderId === m.senderId) {
        out[out.length - 1].msgs.push(m);
      } else {
        out.push({ senderId: m.senderId, msgs: [m] });
      }
    });
    return out;
  }, [messages]);

  const chatH = expanded ? "h-[600px]" : "h-[460px]";

  /* ── Render ── */
  return (
    <>
      <AnimatePresence>
        {showScheduler && (
          <MeetingSchedulerModal
            onClose={() => setShowScheduler(false)}
            onSchedule={scheduleMeeting}
            authUser={authUser}
            investor={investor}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`flex flex-col ${chatH} rounded-3xl overflow-hidden relative`}
        style={{
          background: "linear-gradient(145deg,#140432,#1e0a3c,#160a2e)",
          border: "1px solid rgba(167,139,250,0.2)",
          boxShadow: "0 24px 60px rgba(109,40,217,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* ─── HEADER ─── */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3"
          style={{
            background: "linear-gradient(90deg,rgba(124,58,237,0.4),rgba(147,51,234,0.25))",
            borderBottom: "1px solid rgba(167,139,250,0.15)",
            backdropFilter: "blur(20px)",
          }}>
          <Avatar src={investor.photoURL} name={name} size="md" online={otherOnline} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-sm truncate">{name}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-violet-300 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5">
              {typing ? (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1 h-1 rounded-full bg-violet-400"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
                    ))}
                  </div>
                  <span className="text-violet-300 text-[10px]">typing…</span>
                </motion.div>
              ) : (
                <span className="text-[10px] text-purple-400">
                  {otherOnline ? (
                    <span className="text-emerald-400 font-semibold">● Active now</span>
                  ) : "Offline"}
                </span>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            {/* Schedule meeting */}
            <button onClick={() => setShowScheduler(true)}
              title="Schedule Meeting"
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/15 transition-colors">
              <Calendar className="w-4 h-4" />
            </button>

            {/* File upload */}
            <button onClick={() => fileInputRef.current?.click()}
              title="Upload File"
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/15 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Pinned */}
            <button onClick={() => setShowPinned(o => !o)}
              title="Pinned Messages"
              className={`p-2 rounded-xl transition-colors ${showPinned ? "bg-white/20 text-white" : "text-purple-300 hover:text-white hover:bg-white/15"}`}>
              <Pin className="w-4 h-4" />
            </button>

            {/* Expand */}
            <button onClick={() => setExpanded(o => !o)}
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/15 transition-colors">
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ─── PINNED BANNER ─── */}
        <AnimatePresence>
          {showPinned && pinnedMsgs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ borderBottom: "1px solid rgba(167,139,250,0.15)" }}
            >
              <div className="px-4 py-2" style={{ background: "rgba(124,58,237,0.15)" }}>
                <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                  <Pin className="w-3 h-3" /> Pinned ({pinnedMsgs.length})
                </p>
                <div className="space-y-1">
                  {pinnedMsgs.map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-[11px] text-purple-200 bg-white/5 rounded-lg px-2.5 py-1.5">
                      <span className="font-bold text-violet-300 truncate max-w-[80px]">{m.senderName}</span>
                      <span className="truncate flex-1">{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MESSAGES ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(167,139,250,0.2) transparent" }}
          onClick={() => { setMsgMenu(null); setShowEmoji(false); setShowActions(false); }}>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(236,72,153,0.3))" }}>
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Start the conversation</p>
                <p className="text-purple-400 text-xs mt-1">Private, encrypted workspace</p>
              </div>
            </div>
          )}

          {grouped.map((group, gi) => {
            const isMine = group.senderId === authUser.uid;
            return (
              <div key={gi} className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                {!isMine && (
                  <Avatar src={investor.photoURL} name={name} size="sm"
                    className="self-end mb-1 flex-shrink-0" online={false} />
                )}
                <div className={`space-y-1 max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                  {group.msgs.map((msg, mi) => {
                    const isLast = mi === group.msgs.length - 1;
                    const isSeen = msg.seenBy && msg.seenBy.length > 1;

                    if (msg.deleted) {
                      return (
                        <div key={msg.id} className="px-3 py-1.5 rounded-2xl"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <p className="text-purple-500 text-xs italic">Message deleted</p>
                        </div>
                      );
                    }

                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, x: isMine ? 12 : -12, y: 4 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="group relative"
                      >
                        {/* Reply reference */}
                        {msg.replyTo && (
                          <div className={`flex mb-0.5 ${isMine ? "justify-end" : ""}`}>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] max-w-[200px]"
                              style={{
                                background: "rgba(124,58,237,0.2)",
                                border: "1px solid rgba(124,58,237,0.3)",
                              }}>
                              <CornerUpLeft className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
                              <span className="text-violet-300 font-bold truncate">{msg.replyTo.senderName}:</span>
                              <span className="text-purple-300 truncate">{msg.replyTo.text}</span>
                            </div>
                          </div>
                        )}

                        {/* Bubble */}
                        <div className="relative flex">
                          {/* Context menu trigger */}
                          <button
                            onClick={e => { e.stopPropagation(); setMsgMenu(msgMenu === msg.id ? null : msg.id); }}
                            className={`absolute top-1 ${isMine ? "-left-7" : "-right-7"} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-purple-400 hover:text-white hover:bg-white/10`}>
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          <div className={`px-3.5 py-2.5 rounded-2xl ${msg.pinned ? "ring-1 ring-violet-400/40" : ""}`}
                            style={isMine ? {
                              background: "linear-gradient(135deg,#7c3aed,#9333ea)",
                              boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
                              borderRadius: "18px 18px 4px 18px",
                            } : {
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "18px 18px 18px 4px",
                            }}>
                            {msg.pinned && (
                              <Pin className="w-2.5 h-2.5 text-violet-300 mb-1" />
                            )}
                            {msg.type === "meeting_card" && msg.meetingRef ? (
                              <MeetingCard meetingId={msg.meetingRef} authUser={authUser} chatId={chatId} />
                            ) : msg.type === "file" ? (
                              <FileBubble msg={msg} />
                            ) : (
                              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            )}
                          </div>
                        </div>

                        {/* Timestamp + seen */}
                        {isLast && (
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
                            <span className="text-[9px] text-purple-500">{formatTime(msg.createdAt)}</span>
                            {isMine && (
                              isSeen
                                ? <CheckCheck className="w-3 h-3 text-violet-400" />
                                : <Check className="w-3 h-3 text-purple-600" />
                            )}
                          </div>
                        )}

                        {/* Context menu */}
                        <AnimatePresence>
                          {msgMenu === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.88, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.88, y: 4 }}
                              transition={{ duration: 0.15 }}
                              className={`absolute z-50 ${isMine ? "right-0" : "left-0"} top-full mt-1 rounded-2xl overflow-hidden`}
                              style={{
                                background: "linear-gradient(145deg,#2d1060,#1e0a3c)",
                                border: "1px solid rgba(167,139,250,0.25)",
                                boxShadow: "0 12px 32px rgba(109,40,217,0.4)",
                                minWidth: "140px",
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              {[
                                { icon: <CornerUpLeft className="w-3.5 h-3.5" />, label: "Reply", action: () => { setReplyTo(msg); setMsgMenu(null); } },
                                { icon: <Pin className="w-3.5 h-3.5" />, label: msg.pinned ? "Unpin" : "Pin", action: () => { pinMessage(msg); setMsgMenu(null); } },
                                ...(msg.senderId === authUser.uid ? [{ icon: <Trash2 className="w-3.5 h-3.5" />, label: "Delete", action: () => deleteMessage(msg.id), danger: true }] : []),
                              ].map((item: any) => (
                                <button key={item.label} onClick={item.action}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/10 ${item.danger ? "text-red-400" : "text-purple-200"}`}>
                                  <span className={item.danger ? "text-red-400" : "text-violet-400"}>{item.icon}</span>
                                  {item.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex gap-2 items-end">
                <Avatar src={investor.photoURL} name={name} size="xs" online={false} />
                <div className="px-4 py-3 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "18px 18px 18px 4px",
                  }}>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-violet-400"
                        animate={{ y: [0,-4,0] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: i*0.18 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* ─── UPLOAD PROGRESS ─── */}
        <AnimatePresence>
          {uploadPct !== null && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 px-4 pb-1">
              <UploadProgress pct={uploadPct} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── REPLY PREVIEW ─── */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 mx-4 mb-1"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{
                  background: "rgba(124,58,237,0.2)",
                  border: "1px solid rgba(124,58,237,0.35)",
                }}>
                <CornerUpLeft className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-violet-300">{replyTo.senderName}</p>
                  <p className="text-xs text-purple-300 truncate">{replyTo.text}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-purple-500 hover:text-white p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── INPUT BAR ─── */}
        <div className="flex-shrink-0 p-3 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(167,139,250,0.12)" }}>
          {/* Emoji */}
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setShowEmoji(o => !o); }}
              className="p-2.5 rounded-2xl text-purple-400 hover:text-white hover:bg-white/10 transition-colors">
              <Smile className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker
                  onSelect={em => setInput(v => v + em)}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* File upload */}
          <input ref={fileInputRef} type="file" className="hidden"
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl text-purple-400 hover:text-white hover:bg-white/10 transition-colors">
            <FileUp className="w-4 h-4" />
          </button>

          {/* Schedule meeting shortcut */}
          <button onClick={() => setShowScheduler(true)}
            className="p-2.5 rounded-2xl text-purple-400 hover:text-white hover:bg-white/10 transition-colors">
            <CalendarCheck className="w-4 h-4" />
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Message…"
            className="flex-1 px-4 py-2.5 rounded-2xl text-sm text-white placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(167,139,250,0.2)",
            }}
          />

          {/* Send */}
          <motion.button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            whileTap={{ scale: 0.88 }}
            className="p-2.5 rounded-2xl text-white disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

/* ──────────────────────── MEETINGS TAB ─────────────────────── */
/**
 * Upgraded MeetingsTab — shows meetings in a rich dark card layout.
 * Drop-in replacement for the original MeetingsTab in ConnectedWorkspace.
 */
export function MeetingsTab({
  authUser, investor,
}: {
  authUser: AuthUser;
  investor: any;
}) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const chatId = useMemo(() => [authUser.uid, investor.id].sort().join("_"), [authUser.uid, investor.id]);

  useEffect(() => {
    const q = query(collection(db, "meetings"), where("chatId", "==", chatId));
    return onSnapshot(q, snap => {
      setMeetings(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting))
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      );
    });
  }, [chatId]);

  const scheduleMeeting = async (data: Omit<Meeting, "id">) => {
    await addDoc(collection(db, "meetings"), { ...data, createdAt: serverTimestamp() });
  };

  const respond = async (id: string, status: "accepted" | "rejected") => {
    await updateDoc(doc(db, "meetings", id), { status }).catch(console.error);
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter(m => m.date >= today);
  const past     = meetings.filter(m => m.date <  today);

  const statusBadge = (status: Meeting["status"]) => {
    const map = {
      pending:     "bg-amber-400/20 text-amber-300 border-amber-400/30",
      accepted:    "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
      rejected:    "bg-red-400/20 text-red-300 border-red-400/30",
      rescheduled: "bg-violet-400/20 text-violet-300 border-violet-400/30",
    };
    const label = { pending: "Pending", accepted: "Confirmed", rejected: "Declined", rescheduled: "Reschedule" };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${map[status]}`}>
        {label[status]}
      </span>
    );
  };

  return (
    <>
      <AnimatePresence>
        {showScheduler && (
          <MeetingSchedulerModal
            onClose={() => setShowScheduler(false)}
            onSchedule={scheduleMeeting}
            authUser={authUser}
            investor={investor}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5">
        {/* Schedule button */}
        <button onClick={() => setShowScheduler(true)}
          className="w-full py-4 rounded-3xl text-white font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea,#ec4899)", boxShadow: "0 12px 32px rgba(124,58,237,0.35)" }}>
          <Calendar className="w-5 h-5" /> Schedule a Meeting
        </button>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Upcoming ({upcoming.length})
            </p>
            {upcoming.map(m => {
              const d = new Date(m.date + "T00:00:00");
              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg,#1e0a3c,#2d1060)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    boxShadow: "0 8px 24px rgba(109,40,217,0.2)",
                  }}>
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}>
                      <span className="text-[9px] font-black text-purple-200 uppercase">{d.toLocaleString("default",{month:"short"})}</span>
                      <span className="text-2xl font-black text-white leading-none">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-white">{m.title}</p>
                        {statusBadge(m.status)}
                      </div>
                      <p className="text-purple-300 text-xs mt-0.5">{m.time} • requested by {m.requesterName}</p>
                      {m.notes && <p className="text-purple-400 text-[11px] mt-0.5 truncate">"{m.notes}"</p>}
                      {m.status === "accepted" && m.meetLink && (
                        <a href={m.meetLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[11px] text-violet-300 hover:text-white font-semibold">
                          <Video className="w-3 h-3" /> Join Meeting <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  {m.status === "pending" && m.requesterId !== authUser.uid && (
                    <div className="flex" style={{ borderTop: "1px solid rgba(167,139,250,0.12)" }}>
                      <button onClick={() => respond(m.id, "accepted")}
                        className="flex-1 py-3 text-xs font-black text-emerald-400 hover:bg-emerald-400/10 transition-colors flex items-center justify-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5" /> Accept
                      </button>
                      <div style={{ width: 1, background: "rgba(167,139,250,0.12)" }} />
                      <button onClick={() => respond(m.id, "rejected")}
                        className="flex-1 py-3 text-xs font-black text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center gap-1.5">
                        <CalendarX className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Past Meetings
            </p>
            {past.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl opacity-50"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-purple-300 truncate">{m.title}</p>
                  <p className="text-xs text-purple-600">{m.date} · {m.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {upcoming.length === 0 && past.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <Calendar className="w-7 h-7 text-violet-500" />
            </div>
            <p className="text-purple-300 font-bold">No meetings yet</p>
            <p className="text-purple-600 text-xs mt-1">Schedule one using the button above</p>
          </div>
        )}
      </motion.div>
    </>
  );
}