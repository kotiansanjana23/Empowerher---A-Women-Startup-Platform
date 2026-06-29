import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Users, Calendar, Star, Send, Smile, Pin, Trash2, Reply,
  Check, CheckCheck, X, FileText, TrendingUp, Search, ArrowLeft,
  Award, Target, ExternalLink, Download, Eye, DollarSign, BarChart2,
  Briefcase, Layers, Clock, Globe, StickyNote, Plus, Activity,
  Users2, Building2, Calculator, Pencil, Save, RefreshCw, Mail,
  Phone, MapPin, Link, Video, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Banknote, Percent, FileSignature, RotateCcw,
  Instagram, Twitter, Linkedin, Hash, TrendingDown, Tag, BadgeDollarSign,
  Sparkles, Heart, NotebookPen, Paperclip, Image, File, Zap, Lightbulb,
  Globe2, Users as UsersIcon, ShieldAlert, BarChart, Send as SendIcon,
  ThumbsUp, MessageSquare
} from "lucide-react";
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, setDoc, getDoc, where, getDocs,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "../../../../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mentor {
  id: string;
  name: string;
  avatar: string;
  expertise: string;
  online: boolean;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  seen: boolean;
  pinned: boolean;
  replyTo?: { id: string; text: string; senderName: string } | null;
  type: "text" | "meeting" | "file";
  meetingData?: { date: string; time: string; link: string; title: string };
  fileData?: { name: string; url: string; size: string; fileType: string };
}

interface Recommendation {
  id: string;
  founderName: string;
  startupName: string;
  sector: string;
  stage: string;
  description: string;
  pitchDeckUrl?: string;
  mentorId: string;
  investorId: string;
  status: "pending" | "accepted" | "passed";
  createdAt: Timestamp;
  founderId?: string;
}

// ── FIXED: Added all possible photo/name field variants ──────────────────────
interface FounderProfile {
  activeUsers?: string;
  customerCount?: string;
  description?: string;
  email?: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  username?: string;
  fundingRaised?: string;
  monthlyRevenue?: string;
  growthRate?: string;
  valuation?: string;
  industry?: string;
  stage?: string;
  website?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  phone?: string;
  location?: string;
  bio?: string;
  // All possible photo field names
  photoURL?: string;
  photo?: string;
  avatar?: string;
  image?: string;
  profileImage?: string;
  profilePhoto?: string;
  pictureUrl?: string;
  picture?: string;
  startupName?: string;
  teamSize?: string;
  founded?: string;
  revenue?: string;
  mrr?: string;
  arr?: string;
  burnRate?: string;
  runway?: string;
  targetMarket?: string;
  competitors?: string;
  usp?: string;
  online?: boolean;
}

interface FundingOffer {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: "investor" | "founder";
  minAmount: string;
  maxAmount: string;
  equity: string;
  valuation: string;
  terms: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  timestamp: Timestamp;
  isCounter?: boolean;
  counterTo?: string;
  respondedAt?: Timestamp;
}

interface StickyNoteType {
  id: string;
  text: string;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface StartupFeedback {
  id: string;
  investorId: string;
  investorName: string;
  recId: string;
  startupName: string;
  founderName: string;
  founderId?: string;
  innovation: number;
  marketPotential: number;
  scalability: number;
  team: number;
  risk: number;
  overallScore: number;
  comments: string;
  recommendation: "consider" | "needs_work" | "pass";
  createdAt: Timestamp;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS = ["😊","😂","❤️","🔥","👏","💡","🚀","✅","💬","🤝","💰","⭐","🎯","💎","🌟","🎉","💪","🙌","📈","💼"];

const NOTE_COLORS = [
  { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-900", label: "Yellow" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-900", label: "Pink" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-900", label: "Purple" },
  { bg: "bg-green-100", border: "border-green-300", text: "text-green-900", label: "Green" },
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-900", label: "Blue" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-900", label: "Orange" },
];

const FEEDBACK_CRITERIA = [
  { key: "innovation",      label: "Innovation",       icon: <Lightbulb size={15} />,   color: "from-violet-500 to-purple-600",   bg: "bg-violet-50",   text: "text-violet-700",  desc: "How novel and disruptive is the idea?" },
  { key: "marketPotential", label: "Market Potential", icon: <Globe2 size={15} />,      color: "from-blue-500 to-cyan-600",       bg: "bg-blue-50",     text: "text-blue-700",    desc: "Size and accessibility of target market?" },
  { key: "scalability",     label: "Scalability",      icon: <TrendingUp size={15} />,  color: "from-emerald-500 to-green-600",   bg: "bg-emerald-50",  text: "text-emerald-700", desc: "Can the business grow rapidly?" },
  { key: "team",            label: "Team",             icon: <UsersIcon size={15} />,   color: "from-orange-500 to-amber-600",    bg: "bg-orange-50",   text: "text-orange-700",  desc: "Founder and team capability?" },
  { key: "risk",            label: "Risk Level",       icon: <ShieldAlert size={15} />, color: "from-rose-500 to-red-600",        bg: "bg-rose-50",     text: "text-rose-700",    desc: "How risky is this investment? (10 = lowest risk)" },
];

// ─── Helper: resolve avatar from profile ─────────────────────────────────────
// ── FIXED: checks all possible photo field names ──────────────────────────────
const resolveAvatar = (profile: FounderProfile, founderName: string): string =>
  profile.photoURL ||
  profile.photo ||
  profile.avatar ||
  profile.image ||
  profile.profileImage ||
  profile.profilePhoto ||
  profile.pictureUrl ||
  profile.picture ||
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${founderName}`;

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

const EmojiPicker: React.FC<{ onSelect: (e: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => (
  <motion.div initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
    className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-2xl border border-purple-100 p-3 z-50 grid grid-cols-5 gap-1 w-52"
    style={{ boxShadow: "0 8px 32px rgba(147,51,234,0.18)" }}>
    {EMOJIS.map(e => (
      <button key={e} onClick={() => { onSelect(e); onClose(); }}
        className="text-xl hover:bg-purple-50 rounded-lg p-1.5 transition-colors">{e}</button>
    ))}
  </motion.div>
);

// ─── Jitsi Meeting Scheduler ──────────────────────────────────────────────────

const JitsiMeetingScheduler: React.FC<{
  onSchedule: (d: { title: string; date: string; time: string; link: string }) => void;
  onClose: () => void;
  founderName: string;
}> = ({ onSchedule, onClose, founderName }) => {
  const [title, setTitle] = useState(`Deal Discussion with ${founderName}`);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const generateJitsiLink = () => {
    const room = `EmpowerHer-${founderName.replace(/\s+/g, "-")}-${Date.now()}`;
    return `https://meet.jit.si/${room}`;
  };

  const handleSchedule = () => {
    if (!title || !date || !time) return;
    const link = generateJitsiLink();
    onSchedule({ title, date, time, link });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
     className="fixed bottom-24 right-24 bg-white rounded-2xl shadow-2xl border border-purple-100 p-5 w-80 z-50"
      style={{ boxShadow: "0 12px 40px rgba(147,51,234,0.22)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-purple-900 flex items-center gap-2">
          <Video size={16} className="text-purple-500" /> Schedule Jitsi Meeting
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1"><X size={15} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Meeting Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
className="w-full rounded-xl border border-purple-200 bg-white text-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
className="w-full rounded-xl border border-purple-200 bg-white text-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
className="w-full rounded-xl border border-purple-200 bg-white text-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
          <div className="flex items-center gap-2 text-xs text-purple-600">
            <Video size={13} className="text-purple-500 flex-shrink-0" />
            <span>A Jitsi Meet link will be auto-generated and sent to {founderName}</span>
          </div>
        </div>
        <button onClick={handleSchedule} disabled={!title || !date || !time}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          <Video size={14} /> Generate & Send Invite
        </button>
      </div>
    </motion.div>
  );
};

// ─── File Message Bubble ──────────────────────────────────────────────────────

const FileBubble: React.FC<{ fileData: Message["fileData"]; isOwn: boolean }> = ({ fileData, isOwn }) => {
  if (!fileData) return null;
  const isImage = fileData.fileType?.startsWith("image/");
  const isPDF = fileData.fileType === "application/pdf";

  return (
    <div className="min-w-[200px] max-w-[260px]">
      {isImage ? (
        <div className="space-y-1.5">
          <img src={fileData.url} alt={fileData.name} className="rounded-xl w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(fileData.url, "_blank")} />
          <div className="flex items-center justify-between px-1">
            <p className="text-xs truncate opacity-80">{fileData.name}</p>
            <a href={fileData.url} download target="_blank" rel="noreferrer"
              className="opacity-70 hover:opacity-100"><Download size={12} /></a>
          </div>
        </div>
      ) : (
        <a href={fileData.url} target="_blank" rel="noreferrer" download
          className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOwn ? "bg-white/20" : "bg-purple-100"}`}>
            {isPDF ? <FileText size={20} className={isOwn ? "text-pink-200" : "text-purple-500"} /> : <File size={20} className={isOwn ? "text-pink-200" : "text-purple-500"} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{fileData.name}</p>
            <p className={`text-xs ${isOwn ? "text-pink-200" : "text-gray-400"}`}>{fileData.size}</p>
          </div>
          <Download size={14} className="flex-shrink-0 opacity-60" />
        </a>
      )}
    </div>
  );
};

// ─── Chat Pane ────────────────────────────────────────────────────────────────

const ChatPane: React.FC<{
  chatId: string;
  investorId: string;
  investorName: string;
  otherName: string;
  otherAvatar: string;
  otherOnline: boolean;
  isFounderChat?: boolean;
  founderId?: string;
}> = ({ chatId, investorId, investorName, otherName, otherAvatar, otherOnline, isFounderChat, founderId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typing, setTyping] = useState(false);
  const [pinnedMsgs, setPinnedMsgs] = useState<Message[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesRef = collection(db, "mentorInvestorChats", chatId, "messages");

  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setPinnedMsgs(msgs.filter(m => m.pinned));
      msgs.filter(m => !m.seen && m.senderId !== investorId).forEach(m =>
        updateDoc(doc(messagesRef, m.id), { seen: true })
      );
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleTyping = () => {
    const typingRef = doc(db, "mentorInvestorChats", chatId, "typing", investorId);
    setDoc(typingRef, { isTyping: true }, { merge: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() =>
      setDoc(typingRef, { isTyping: false }, { merge: true }), 1500);
  };

  const sendMessage = async (type: "text" | "meeting" | "file" = "text", extra?: Partial<Message>) => {
    if (type === "text" && !input.trim()) return;
    await addDoc(messagesRef, {
      senderId: investorId,
      senderName: investorName || "Investor",
      text: type === "text" ? input.trim() : extra?.text || "",
      timestamp: serverTimestamp(),
      seen: false,
      pinned: false,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName } : null,
      type,
      ...(extra || {}),
    });
    setInput(""); setReplyTo(null); setShowEmoji(false);
    inputRef.current?.focus();
  };

  const scheduleMeeting = async (data: { title: string; date: string; time: string; link: string }) => {
    await addDoc(collection(db, "meetings"), {
      ...data, createdBy: investorId, status: "scheduled", chatId, createdAt: serverTimestamp(),
      invitedUserId: founderId || null,
    });
    await sendMessage("meeting", {
      text: `📅 Meeting: ${data.title} on ${data.date} at ${data.time}`,
      meetingData: data,
    });
    if (founderId) {
      await addDoc(collection(db, "notifications"), {
        to: founderId, from: investorId, type: "meeting_invite",
        message: `Meeting scheduled: ${data.title} on ${data.date} at ${data.time}. Join: ${data.link}`,
        meetingData: data,
        read: false, createdAt: serverTimestamp(),
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `chatFiles/${chatId}/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      const size = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      await sendMessage("file", {
        text: `Shared a file: ${file.name}`,
        fileData: { name: file.name, url, size, fileType: file.type },
      });
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const pinMessage = (msg: Message) => updateDoc(doc(messagesRef, msg.id), { pinned: !msg.pinned });
  const deleteMessage = (id: string) => deleteDoc(doc(messagesRef, id));

  const formatTime = (ts: Timestamp) =>
    ts?.toDate ? new Date(ts.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-purple-100 overflow-visible shadow-sm">
      <AnimatePresence>
        {showPinned && pinnedMsgs.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-50 border-b border-yellow-200 px-3 py-2 flex-shrink-0 overflow-hidden">
            <p className="text-xs font-bold text-yellow-700 mb-1.5 flex items-center gap-1"><Pin size={11} /> Pinned Messages</p>
            {pinnedMsgs.slice(0, 3).map(m => (
              <div key={m.id} className="text-xs text-yellow-800 bg-yellow-100 rounded-lg px-2.5 py-1.5 mb-1 truncate">
                <span className="font-semibold">{m.senderName}:</span> {m.text}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-pink-50 border-b border-pink-100 px-3 py-2 flex items-center gap-2 flex-shrink-0">
            <Reply size={13} className="text-pink-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-pink-400 font-semibold">{replyTo.senderName}</p>
              <p className="text-xs text-pink-600 truncate">{replyTo.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-pink-400 hover:text-pink-600"><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5"
        style={{ background: "linear-gradient(180deg, #fdf2f8 0%, #f5f0ff 100%)" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <MessageCircle size={26} className="text-purple-400" />
            </div>
            <p className="text-sm text-purple-400 font-medium">Start the conversation</p>
            <p className="text-xs text-purple-300">Messages are end-to-end synced with Firebase</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === investorId;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
              <div className={`max-w-[78%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <p className="text-[10px] text-purple-400 font-semibold mb-0.5 px-1">{msg.senderName}</p>
                )}
                {msg.replyTo && (
                  <div className={`text-xs px-2.5 py-1.5 rounded-xl mb-1 border-l-2 max-w-full ${isOwn ? "bg-pink-100 border-pink-400 text-pink-700" : "bg-purple-50 border-purple-300 text-purple-600"}`}>
                    <span className="font-semibold">{msg.replyTo.senderName}: </span>
                    {msg.replyTo.text.slice(0, 50)}{msg.replyTo.text.length > 50 ? "…" : ""}
                  </div>
                )}
                <div className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isOwn
                    ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-sm shadow-lg shadow-pink-200/50"
                    : "bg-white text-gray-800 border border-purple-100 rounded-bl-sm shadow-sm"
                  }
                  ${msg.type === "meeting" ? (isOwn ? "border-2 border-pink-300" : "border-2 border-purple-300") : ""}
                `}>
                  {msg.type === "meeting" && msg.meetingData ? (
                    <div className="min-w-[220px]">
                      <div className="flex items-center gap-2 mb-2">
                        <Video size={15} className={isOwn ? "text-pink-200" : "text-purple-500"} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${isOwn ? "text-pink-200" : "text-purple-500"}`}>Meeting Invite</span>
                      </div>
                      <p className="font-bold text-sm mb-1">{msg.meetingData.title}</p>
                      <p className={`text-xs mb-3 ${isOwn ? "text-pink-200" : "text-gray-500"}`}>
                        📅 {msg.meetingData.date} at {msg.meetingData.time}
                      </p>
                      {msg.meetingData.link && (
                        <a href={msg.meetingData.link} target="_blank" rel="noreferrer"
                          className={`flex items-center justify-center gap-2 text-xs font-bold rounded-xl px-3 py-2.5 transition-colors ${isOwn ? "bg-white/25 hover:bg-white/35 text-white border border-white/30" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white shadow-md shadow-purple-200"}`}>
                          <Video size={13} /> Join Jitsi Meeting →
                        </a>
                      )}
                    </div>
                  ) : msg.type === "file" && msg.fileData ? (
                    <FileBubble fileData={msg.fileData} isOwn={isOwn} />
                  ) : (
                    <p className="break-words">{msg.text}</p>
                  )}
                  {msg.pinned && (
                    <Pin size={10} className="absolute -top-1.5 -right-1 text-yellow-500 bg-white rounded-full shadow-sm" />
                  )}
                </div>
                <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                  {isOwn && (msg.seen
                    ? <CheckCheck size={11} className="text-pink-400" />
                    : <Check size={11} className="text-gray-400" />
                  )}
                </div>
                <div className={`hidden group-hover:flex items-center gap-1 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  {[
                    { icon: <Reply size={12} />, action: () => setReplyTo(msg), tip: "Reply", color: "hover:text-purple-500" },
                    { icon: <Pin size={12} />, action: () => pinMessage(msg), tip: "Pin", color: msg.pinned ? "text-yellow-500" : "hover:text-yellow-500" },
                    ...(isOwn ? [{ icon: <Trash2 size={12} />, action: () => deleteMessage(msg.id), tip: "Delete", color: "hover:text-red-400" }] : []),
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action}
                      className={`text-gray-400 ${btn.color} bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 transition-colors`}>
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}

        {typing && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <div className="bg-white border border-purple-100 rounded-2xl px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <motion.span key={i} animate={{ y: [0,-5,0] }} transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-b from-pink-400 to-purple-500 block" />
              ))}
            </div>
            <span className="text-xs text-gray-400 italic">{otherName} is typing…</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {uploading && (
        <div className="bg-purple-50 border-t border-purple-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <RefreshCw size={13} className="text-purple-400 animate-spin" />
          <span className="text-xs text-purple-500">Uploading file…</span>
        </div>
      )}

      <div className="border-t border-purple-100 bg-white px-3 py-2.5 flex-shrink-0">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv" />
        <div className="flex items-center gap-2 bg-pink-50/80 rounded-2xl px-3.5 py-2 border border-pink-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <button onClick={() => fileInputRef.current?.click()}
            className="text-pink-300 hover:text-purple-500 transition-colors rounded-lg p-1 flex-shrink-0"
            title="Attach file">
            <Paperclip size={17} />
          </button>
          <input ref={inputRef} value={input}
            onChange={e => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-pink-300 focus:outline-none" />
          <div className="flex items-center gap-1.5 relative">
            <div className="relative">
              <button
                onClick={() => setShowMeeting(v => !v)}
                className="text-pink-300 hover:text-purple-500 transition-colors rounded-lg p-1"
                title="Schedule Meeting"
              >
                <Calendar size={18} />
              </button>
              <AnimatePresence>
                {showMeeting && (
                  <JitsiMeetingScheduler
                    founderName={otherName}
                    onSchedule={scheduleMeeting}
                    onClose={() => setShowMeeting(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setShowEmoji(v => !v)}
              className="text-pink-300 hover:text-pink-500 transition-colors rounded-lg p-1">
              <Smile size={18} />
            </button>
            <AnimatePresence>
              {showEmoji && <EmojiPicker onSelect={e => setInput(v => v + e)} onClose={() => setShowEmoji(false)} />}
            </AnimatePresence>
            <button onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-2 hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm shadow-pink-200">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sticky Notes Panel ───────────────────────────────────────────────────────

const StickyNotesPanel: React.FC<{ docPath: string; investorId: string; founderName: string }> = ({ docPath, investorId, founderName }) => {
  const [notes, setNotes] = useState<StickyNoteType[]>([]);
  const [newText, setNewText] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const notesRef = collection(db, "founderNotes", docPath, "sticky");

  useEffect(() => {
    const q = query(notesRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as StickyNoteType)));
    });
    return () => unsub();
  }, [docPath]);

  const addNote = async () => {
    if (!newText.trim()) return;
    await addDoc(notesRef, {
      text: newText.trim(),
      color: selectedColor.toString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authorId: investorId,
    });
    setNewText("");
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    await updateDoc(doc(notesRef, id), { text: editText.trim(), updatedAt: serverTimestamp() });
    setEditId(null);
  };

  const colorIdx = (c?: string) => parseInt(c || "0") || 0;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <NotebookPen size={17} className="text-amber-600" />
          <h3 className="font-bold text-amber-800">Add a Sticky Note</h3>
          <p className="text-xs text-amber-500 ml-auto">about {founderName}</p>
        </div>
        <div className="flex gap-2 mb-3">
          {NOTE_COLORS.map((c, i) => (
            <button key={i} onClick={() => setSelectedColor(i)}
              className={`w-7 h-7 rounded-full ${c.bg} border-2 transition-all ${selectedColor === i ? `${c.border} scale-110 shadow-md` : "border-white"}`} />
          ))}
        </div>
        <textarea
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder={`Write your notes about ${founderName}…`}
          className={`w-full ${NOTE_COLORS[selectedColor].bg} border ${NOTE_COLORS[selectedColor].border} rounded-xl px-3.5 py-3 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 ${NOTE_COLORS[selectedColor].text} placeholder-opacity-60`}
        />
        <button onClick={addNote} disabled={!newText.trim()}
          className="mt-3 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm shadow-amber-200">
          <Plus size={15} /> Pin Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-10">
          <StickyNote size={36} className="text-yellow-200 mx-auto mb-3" />
          <p className="text-amber-400 font-medium text-sm">No notes yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {notes.map((note, i) => {
              const c = NOTE_COLORS[colorIdx(note.color)];
              return (
                <motion.div key={note.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: i * 0.04, type: "spring", damping: 16 }}
                  className={`${c.bg} border ${c.border} rounded-2xl p-4 shadow-md relative group`}>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gray-400/60 shadow-sm" />
                  <div className="mt-3">
                    {editId === note.id ? (
                      <div className="space-y-2">
                        <textarea value={editText} onChange={e => setEditText(e.target.value)}
                          className={`w-full ${c.bg} border ${c.border} rounded-lg px-2 py-1.5 text-sm resize-none h-20 focus:outline-none ${c.text}`} />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(note.id)}
                            className="flex items-center gap-1 text-xs bg-white/60 rounded-lg px-2.5 py-1.5 font-semibold text-green-700 hover:bg-white/80">
                            <Save size={11} /> Save
                          </button>
                          <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm leading-relaxed ${c.text} whitespace-pre-wrap break-words`}>{note.text}</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
                          <p className={`text-[10px] ${c.text} opacity-60`}>
                            {note.createdAt?.toDate ? new Date(note.createdAt.toDate()).toLocaleDateString() : ""}
                          </p>
                          <div className="hidden group-hover:flex gap-1">
                            <button onClick={() => { setEditId(note.id); setEditText(note.text); }}
                              className="text-current opacity-60 hover:opacity-100 rounded p-1"><Pencil size={12} /></button>
                            <button onClick={() => deleteDoc(doc(notesRef, note.id))}
                              className="text-current opacity-60 hover:opacity-100 rounded p-1"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// ─── Offer Timeline Card ──────────────────────────────────────────────────────

const OfferTimelineItem: React.FC<{ offer: FundingOffer; index: number; isLast: boolean }> = ({ offer, index, isLast }) => {
  const statusConfig = {
    pending:   { color: "bg-yellow-400",  text: "text-yellow-700",  bg: "bg-yellow-50",  border: "border-yellow-200", label: "Pending",   icon: <Clock size={11} /> },
    accepted:  { color: "bg-green-400",   text: "text-green-700",   bg: "bg-green-50",   border: "border-green-200",  label: "Accepted",  icon: <CheckCircle size={11} /> },
    rejected:  { color: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",    label: "Rejected",  icon: <XCircle size={11} /> },
    countered: { color: "bg-blue-400",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   label: "Countered", icon: <RotateCcw size={11} /> },
  };
  const s = statusConfig[offer.status];
  const isInvestor = offer.fromRole === "investor";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {isInvestor ? <BadgeDollarSign size={14} className="text-white" /> : <Users2 size={14} className="text-white" />}
        </div>
        {!isLast && <div className="w-0.5 bg-gray-200 flex-1 mt-1 mb-1" />}
      </div>
      <div className={`flex-1 ${isLast ? "" : "mb-4"}`}>
        <div className={`${s.bg} border ${s.border} rounded-xl p-3.5`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              {offer.isCounter && <RotateCcw size={11} className="text-blue-500" />}
              {isInvestor ? "Your Offer" : `${offer.fromName}'s Offer`}
            </p>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}>
              {s.icon} {s.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <p className="text-[9px] text-gray-400">Range</p>
              <p className="text-xs font-bold text-gray-700 truncate">{offer.minAmount}–{offer.maxAmount}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <p className="text-[9px] text-gray-400">Equity</p>
              <p className="text-xs font-bold text-gray-700">{offer.equity}%</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <p className="text-[9px] text-gray-400">Valuation</p>
              <p className="text-xs font-bold text-gray-700 truncate">{offer.valuation || "—"}</p>
            </div>
          </div>
          {offer.terms && (
            <p className="text-[10px] text-gray-500 italic line-clamp-2">{offer.terms}</p>
          )}
          <p className="text-[9px] text-gray-400 mt-1.5">
            {offer.timestamp?.toDate ? new Date(offer.timestamp.toDate()).toLocaleString() : ""}
            {offer.respondedAt?.toDate ? ` · Responded ${new Date(offer.respondedAt.toDate()).toLocaleDateString()}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Funding Negotiation Panel ────────────────────────────────────────────────

const FundingPanel: React.FC<{ rec: Recommendation; investorId: string; investorName: string }> = ({ rec, investorId, investorName }) => {
  const [offers, setOffers] = useState<FundingOffer[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [equity, setEquity] = useState("");
  const [valuation, setValuation] = useState("");
  const [terms, setTerms] = useState("");
  const [sending, setSending] = useState(false);
  const [counterTarget, setCounterTarget] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);

  const offersRef = collection(db, "fundingOffers", rec.id, "offers");

  useEffect(() => {
    const q = query(offersRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, snap => {
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as FundingOffer)));
    });
    return () => unsub();
  }, [rec.id]);

  useEffect(() => {
    const amt = parseFloat(maxAmount.replace(/[^0-9.]/g, ""));
    const eq = parseFloat(equity);
    if (!isNaN(amt) && !isNaN(eq) && eq > 0) {
      const v = (amt / eq) * 100;
      setValuation(`$${Math.round(v).toLocaleString()}`);
    } else {
      setValuation("");
    }
  }, [maxAmount, equity]);

  const sendOffer = async () => {
    if (!minAmount || !maxAmount || !equity) return;
    setSending(true);
    try {
      await addDoc(offersRef, {
        fromId: investorId,
        fromName: investorName || "Investor",
        fromRole: "investor",
        minAmount, maxAmount, equity, valuation, terms,
        status: "pending",
        timestamp: serverTimestamp(),
        isCounter: !!counterTarget,
        counterTo: counterTarget || null,
      });

      if (rec.founderId) {
        const chatId = [investorId, rec.founderId].sort().join("_fc_");
        const chatRef = collection(db, "mentorInvestorChats", chatId, "messages");
        const offerData = {
          fromId: investorId,
          fromName: investorName || "Investor",
          fromRole: "investor" as const,
          minAmount, maxAmount, equity,
          valuation: valuation || "",
          terms: terms || "",
          status: "pending" as const,
          isCounter: !!counterTarget,
        };
        await addDoc(chatRef, {
          senderId: investorId,
          senderName: investorName || "Investor",
          text: `Funding offer: ${minAmount}–${maxAmount} for ${equity}% equity`,
          timestamp: serverTimestamp(),
          seen: false,
          pinned: false,
          replyTo: null,
          type: "funding_offer",
          offerData,
        });
        await addDoc(chatRef, {
          senderId: "system", senderName: "System",
          text: "", systemText: `💰 ${investorName} sent a funding offer`,
          timestamp: serverTimestamp(), seen: false, pinned: false, replyTo: null, type: "system",
        });
      }

      await updateDoc(doc(db, "mentorRecommendations", rec.id), {
        fundingStatus: "negotiating", lastOfferAt: serverTimestamp(),
      });
      if (rec.founderId) {
        await addDoc(collection(db, "notifications"), {
          to: rec.founderId, from: investorId, type: "funding_offer",
          message: `💰 New funding offer from ${investorName}: ${minAmount}–${maxAmount} for ${equity}% equity`,
          read: false, createdAt: serverTimestamp(),
        });
      }
      setMinAmount(""); setMaxAmount(""); setEquity(""); setTerms(""); setCounterTarget(null); setShowForm(false);
    } finally { setSending(false); }
  };

  const respondToOffer = async (offerId: string, status: "accepted" | "rejected" | "countered") => {
    await updateDoc(doc(offersRef, offerId), { status, respondedAt: serverTimestamp() });
    if (status === "accepted") {
      await updateDoc(doc(db, "mentorRecommendations", rec.id), { fundingStatus: "term_sheet" });
      if (rec.founderId) {
        await addDoc(collection(db, "notifications"), {
          to: rec.founderId, from: investorId, type: "offer_accepted",
          message: `🎉 Your funding offer has been accepted by ${investorName}!`,
          read: false, createdAt: serverTimestamp(),
        });
      }
    } else if (status === "rejected") {
      if (rec.founderId) {
        await addDoc(collection(db, "notifications"), {
          to: rec.founderId, from: investorId, type: "offer_rejected",
          message: `Your funding offer was reviewed. ${investorName} passed this time.`,
          read: false, createdAt: serverTimestamp(),
        });
      }
    }
    if (status === "countered") {
      setCounterTarget(offerId);
      setShowForm(true);
    }
  };

  const acceptedOffer = offers.find(o => o.status === "accepted");

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {acceptedOffer && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-4 text-white flex items-center gap-3 shadow-lg shadow-green-200">
            <CheckCircle size={24} />
            <div>
              <p className="font-bold">Deal Accepted! 🎉</p>
              <p className="text-sm text-green-100">
                {acceptedOffer.fromRole === "investor" ? "Your offer" : `${acceptedOffer.fromName}'s offer`} of {acceptedOffer.minAmount}–{acceptedOffer.maxAmount} for {acceptedOffer.equity}% equity has been accepted.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 overflow-hidden">
        <button onClick={() => setShowForm(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/30 transition-colors">
          <h3 className="font-bold text-purple-900 flex items-center gap-2">
            <BadgeDollarSign size={18} className="text-purple-500" />
            {counterTarget ? "Send Counter Offer" : "Send Funding Offer"}
          </h3>
          {showForm ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-purple-400" />}
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-5 pb-5 space-y-4 overflow-hidden">
              {counterTarget && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  <RotateCcw size={14} className="text-blue-500" />
                  <p className="text-xs text-blue-700 font-medium">Countering founder's offer</p>
                  <button onClick={() => setCounterTarget(null)} className="ml-auto text-blue-400 hover:text-blue-600"><X size={13} /></button>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-purple-700 mb-2 block flex items-center gap-1.5">
                  <Banknote size={13} /> Funding Range <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Minimum</label>
                    <input value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="e.g. $100,000"
                      className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Maximum</label>
                    <input value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="e.g. $500,000"
                      className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-purple-700 mb-2 block flex items-center gap-1.5">
                  <Percent size={13} /> Equity % <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input value={equity} onChange={e => setEquity(e.target.value)} placeholder="e.g. 10"
                    type="number" min="0.1" max="100" step="0.1"
                    className="flex-1 bg-white border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  <span className="text-2xl font-bold text-purple-300">%</span>
                </div>
              </div>
              <AnimatePresence>
                {valuation && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70 mb-0.5">Implied Valuation</p>
                        <p className="text-2xl font-bold">{valuation}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Calculator size={22} className="text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mt-2">Based on {equity}% equity for {maxAmount}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="text-xs font-bold text-purple-700 mb-2 block flex items-center gap-1.5">
                  <FileSignature size={13} /> Terms & Conditions
                </label>
                <textarea value={terms} onChange={e => setTerms(e.target.value)}
                  placeholder="Enter terms: board seat, pro-rata rights, liquidation preference, milestones, vesting schedule…"
                  className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <button onClick={sendOffer} disabled={sending || !minAmount || !maxAmount || !equity}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-pink-200">
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {counterTarget ? "Send Counter Offer" : "Send Funding Offer"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {offers.filter(o => o.fromRole === "founder" && o.status === "pending").length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4">
          <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-500" /> Founder Offers — Action Required
          </h4>
          {offers.filter(o => o.fromRole === "founder" && o.status === "pending").map(offer => (
            <div key={offer.id} className="bg-white rounded-xl border border-amber-200 p-4 mb-3 last:mb-0">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-gray-400">Range</p>
                  <p className="text-xs font-bold text-amber-800">{offer.minAmount}–{offer.maxAmount}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-gray-400">Equity</p>
                  <p className="text-xs font-bold text-amber-800">{offer.equity}%</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-gray-400">Valuation</p>
                  <p className="text-xs font-bold text-amber-800">{offer.valuation || "—"}</p>
                </div>
              </div>
              {offer.terms && <p className="text-xs text-gray-500 mb-3 italic">{offer.terms}</p>}
              <div className="flex gap-2">
                <button onClick={() => respondToOffer(offer.id, "accepted")}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 font-bold transition-colors shadow-sm">
                  <CheckCircle size={13} /> Accept
                </button>
                <button onClick={() => respondToOffer(offer.id, "countered")}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2.5 font-bold transition-colors shadow-sm">
                  <RotateCcw size={13} /> Counter
                </button>
                <button onClick={() => respondToOffer(offer.id, "rejected")}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-red-400 hover:bg-red-500 text-white rounded-xl py-2.5 font-bold transition-colors shadow-sm">
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {offers.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
          <button onClick={() => setShowTimeline(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-purple-50/40 transition-colors border-b border-purple-50">
            <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
              <Activity size={15} className="text-purple-400" /> Negotiation Timeline
              <span className="text-xs text-gray-400 font-normal ml-1">{offers.length} offer{offers.length !== 1 ? "s" : ""}</span>
            </h4>
            {showTimeline ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-purple-400" />}
          </button>
          <AnimatePresence>
            {showTimeline && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                className="overflow-hidden">
                <div className="p-5">
                  {offers.map((offer, i) => (
                    <OfferTimelineItem key={offer.id} offer={offer} index={i} isLast={i === offers.length - 1} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// ─── Score Slider ─────────────────────────────────────────────────────────────

const ScoreSlider: React.FC<{
  label: string; icon: React.ReactNode; color: string; bg: string; text: string; desc: string;
  value: number; onChange: (v: number) => void;
}> = ({ label, icon, color, bg, text, desc, value, onChange }) => {
  const pct = (value / 10) * 100;
  const getLabel = (v: number) => {
    if (v <= 2) return "Very Low";
    if (v <= 4) return "Low";
    if (v <= 6) return "Moderate";
    if (v <= 8) return "High";
    return "Exceptional";
  };

  return (
    <div className={`${bg} rounded-2xl p-4 border border-white/80 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={text}>{icon}</span>
          <div>
            <p className={`text-sm font-bold ${text}`}>{label}</p>
            <p className="text-[10px] text-gray-400">{desc}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${text}`}>{value}</p>
          <p className={`text-[10px] font-semibold ${text} opacity-70`}>{getLabel(value)}</p>
        </div>
      </div>
      <div className="relative pt-1">
        <input type="range" min={1} max={10} step={1} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color.includes("violet") ? "#7c3aed" : color.includes("blue") ? "#3b82f6" : color.includes("emerald") ? "#10b981" : color.includes("orange") ? "#f97316" : "#ef4444"} 0%, ${color.includes("violet") ? "#7c3aed" : color.includes("blue") ? "#3b82f6" : color.includes("emerald") ? "#10b981" : color.includes("orange") ? "#f97316" : "#ef4444"} ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`
          }} />
        <div className="flex justify-between mt-1.5">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => onChange(n)}
              className={`text-[9px] font-semibold w-5 h-5 rounded-full transition-all ${value === n ? `bg-gradient-to-br ${color} text-white shadow-sm scale-110` : "text-gray-300 hover:text-gray-500"}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Startup Feedback & Rating Panel ──────────────────────────────────────────

const FeedbackPanel: React.FC<{ rec: Recommendation; investorId: string; investorName: string }> = ({ rec, investorId, investorName }) => {
  const [scores, setScores] = useState({ innovation: 5, marketPotential: 5, scalability: 5, team: 5, risk: 5 });
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState<StartupFeedback["recommendation"]>("consider");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingFeedbacks, setExistingFeedbacks] = useState<StartupFeedback[]>([]);

  const feedbackRef = collection(db, "startupFeedbacks");

  useEffect(() => {
    const q = query(feedbackRef, where("recId", "==", rec.id));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as StartupFeedback));
      setExistingFeedbacks(list);
      const mine = list.find(f => f.investorId === investorId);
      if (mine) {
        setScores({ innovation: mine.innovation, marketPotential: mine.marketPotential, scalability: mine.scalability, team: mine.team, risk: mine.risk });
        setComments(mine.comments);
        setRecommendation(mine.recommendation);
        setSubmitted(true);
      }
    });
  }, [rec.id]);

  const overallScore = Math.round(
    (scores.innovation + scores.marketPotential + scores.scalability + scores.team + scores.risk) / 5 * 10
  ) / 10;

  const submitFeedback = async () => {
    setSubmitting(true);
    try {
      const existing = existingFeedbacks.find(f => f.investorId === investorId);
      const data = {
        investorId, investorName: investorName || "Investor",
        recId: rec.id, startupName: rec.startupName, founderName: rec.founderName,
        founderId: rec.founderId || null,
        ...scores, overallScore, comments, recommendation,
        updatedAt: serverTimestamp(),
      };
      if (existing) {
        await updateDoc(doc(feedbackRef, existing.id), data);
      } else {
        await addDoc(feedbackRef, { ...data, createdAt: serverTimestamp() });
      }
      if (rec.founderId) {
        const reportData = {
          to: rec.founderId,
          from: investorId,
          investorName: investorName || "Investor",
          type: "feedback_report",
          startupName: rec.startupName,
          scores, overallScore, recommendation, comments,
          analysis: generateAnalysis(scores, overallScore),
          read: false,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, "founderReports"), reportData);
        await addDoc(collection(db, "notifications"), {
          to: rec.founderId, from: investorId, type: "feedback_received",
          message: `📊 New feedback from ${investorName}: Overall score ${overallScore}/10. Check your reports dashboard.`,
          read: false, createdAt: serverTimestamp(),
        });
      }
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  const generateAnalysis = (s: typeof scores, overall: number) => {
    const strengths: string[] = [];
    const improvements: string[] = [];
    if (s.innovation >= 7) strengths.push("Strong innovation and disruptive potential");
    else improvements.push("Work on differentiating your core innovation");
    if (s.marketPotential >= 7) strengths.push("Excellent market size and accessibility");
    else improvements.push("Validate and expand your target market strategy");
    if (s.scalability >= 7) strengths.push("Clear scalability path identified");
    else improvements.push("Develop a more robust scaling strategy");
    if (s.team >= 7) strengths.push("Impressive founding team capability");
    else improvements.push("Consider strengthening the team with key hires");
    if (s.risk >= 7) strengths.push("Well-managed risk profile");
    else improvements.push("Address key risk factors to build investor confidence");
    return { strengths, improvements, fundingDecision: overall >= 7 ? "Strong candidate for funding" : overall >= 5 ? "Requires further due diligence" : "Needs significant improvements before funding consideration" };
  };

  const recOptions: { value: StartupFeedback["recommendation"]; label: string; color: string; bg: string }[] = [
    { value: "consider",   label: "Consider",   color: "text-blue-700",  bg: "bg-blue-50 border-blue-300" },
    { value: "needs_work", label: "Needs Work", color: "text-amber-700", bg: "bg-amber-50 border-amber-300" },
    { value: "pass",       label: "Pass",       color: "text-red-700",   bg: "bg-red-50 border-red-300" },
  ];

  const RadarChart = () => {
    const keys = ["innovation", "marketPotential", "scalability", "team", "risk"] as const;
    const labels = ["Innovation", "Market", "Scale", "Team", "Risk"];
    const colors = ["#7c3aed", "#3b82f6", "#10b981", "#f97316", "#ef4444"];
    const cx = 120, cy = 120, r = 90;
    const angles = keys.map((_, i) => (i / keys.length) * 2 * Math.PI - Math.PI / 2);

    const points = keys.map((k, i) => {
      const val = scores[k] / 10;
      return { x: cx + r * val * Math.cos(angles[i]), y: cy + r * val * Math.sin(angles[i]) };
    });
    const polygon = points.map(p => `${p.x},${p.y}`).join(" ");
    const gridCircles = [0.2, 0.4, 0.6, 0.8, 1.0];

    return (
      <svg width={240} height={240} className="mx-auto">
        {gridCircles.map((g, i) => (
          <circle key={i} cx={cx} cy={cy} r={r * g} fill="none" stroke="#e5e7eb" strokeWidth={0.8} />
        ))}
        {angles.map((a, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#e5e7eb" strokeWidth={0.8} />
        ))}
        <polygon points={polygon} fill="rgba(147,51,234,0.15)" stroke="rgba(147,51,234,0.7)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={colors[i]} stroke="white" strokeWidth={1.5} />
        ))}
        {angles.map((a, i) => {
          const lx = cx + (r + 16) * Math.cos(a);
          const ly = cy + (r + 16) * Math.sin(a);
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontWeight="600" fill={colors[i]}>
              {labels[i]}
            </text>
          );
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="900" fill="#7c3aed">{overallScore}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#9ca3af">/ 10</text>
      </svg>
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
        <h3 className="font-bold text-violet-900 mb-1 flex items-center gap-2">
          <Star size={18} className="text-yellow-500" /> Startup Evaluation & Feedback
        </h3>
        <p className="text-xs text-violet-500">Rate {rec.startupName} across key dimensions. Your analysis will be automatically sent to the founder's dashboard.</p>
        {submitted && (
          <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <CheckCircle size={13} className="text-green-500" />
            <p className="text-xs text-green-700 font-medium">Feedback submitted & sent to founder. You can update it below.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <h4 className="font-bold text-purple-900 text-sm mb-4 flex items-center gap-2 justify-center">
          <BarChart size={14} className="text-purple-400" /> Score Visualization
        </h4>
        <RadarChart />
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
            overallScore >= 7 ? "bg-green-50 text-green-700 border-green-300" :
            overallScore >= 5 ? "bg-blue-50 text-blue-700 border-blue-300" :
            "bg-red-50 text-red-600 border-red-300"
          }`}>
            Overall: {overallScore}/10 · {overallScore >= 7 ? "🌟 Strong" : overallScore >= 5 ? "⚡ Promising" : "⚠️ Needs Work"}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
          <Zap size={14} className="text-purple-400" /> Rate Each Dimension (1–10)
        </h4>
        {FEEDBACK_CRITERIA.map(c => (
          <ScoreSlider key={c.key} label={c.label} icon={c.icon} color={c.color}
            bg={c.bg} text={c.text} desc={c.desc}
            value={scores[c.key as keyof typeof scores]}
            onChange={v => setScores(prev => ({ ...prev, [c.key]: v }))} />
        ))}
      </div>

      <div>
        <label className="text-xs font-bold text-purple-700 mb-2 block flex items-center gap-1.5">
          <ThumbsUp size={13} /> Investment Recommendation
        </label>
        <div className="grid grid-cols-2 gap-2">
          {recOptions.map(opt => (
            <button key={opt.value} onClick={() => setRecommendation(opt.value)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold border-2 transition-all ${
                recommendation === opt.value ? `${opt.bg} ${opt.color} scale-[1.02] shadow-sm` : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
              }`}>
              {recommendation === opt.value && <Check size={13} />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-purple-700 mb-2 block flex items-center gap-1.5">
          <MessageSquare size={13} /> Detailed Feedback & Comments
        </label>
        <textarea value={comments} onChange={e => setComments(e.target.value)}
          placeholder={`Share your detailed thoughts on ${rec.startupName}:\n• What's exciting about the opportunity?\n• Key concerns or risks you identified?\n• Specific areas needing improvement?\n• Funding readiness assessment?`}
          className="w-full bg-white border border-pink-200 rounded-xl px-4 py-3 text-sm h-36 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 leading-relaxed" />
      </div>

      {overallScore > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-200 p-4">
          <h4 className="font-bold text-gray-700 text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wide">
            <BarChart size={12} className="text-gray-400" /> Auto-Generated Analysis Report Preview
          </h4>
          {(() => {
            const analysis = generateAnalysis(scores, overallScore);
            return (
              <div className="space-y-3">
                {analysis.strengths.length > 0 && (
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase mb-1.5">✅ Strengths</p>
                    {analysis.strengths.map((s, i) => (
                      <div key={i} className="text-xs text-gray-600 flex items-start gap-1.5 mb-1">
                        <span className="text-green-400 mt-0.5">•</span> {s}
                      </div>
                    ))}
                  </div>
                )}
                {analysis.improvements.length > 0 && (
                  <div>
                    <p className="text-[10px] text-amber-600 font-bold uppercase mb-1.5">⚡ Areas for Improvement</p>
                    {analysis.improvements.map((s, i) => (
                      <div key={i} className="text-xs text-gray-600 flex items-start gap-1.5 mb-1">
                        <span className="text-amber-400 mt-0.5">•</span> {s}
                      </div>
                    ))}
                  </div>
                )}
                <div className={`rounded-xl px-3 py-2.5 text-xs font-bold ${overallScore >= 7 ? "bg-green-50 text-green-700 border border-green-200" : overallScore >= 5 ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                  🎯 {analysis.fundingDecision}
                </div>
              </div>
            );
          })()}
          <p className="text-[9px] text-gray-400 mt-2 italic">This analysis + your scores will be sent to the founder's dashboard upon submission.</p>
        </div>
      )}

      <button onClick={submitFeedback} disabled={submitting}
        className="w-full bg-gradient-to-r from-violet-500 via-purple-600 to-pink-500 text-white rounded-2xl py-3.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
        {submitting ? <RefreshCw size={15} className="animate-spin" /> : <SendIcon size={15} />}
        {submitted ? "Update Feedback & Resend Report" : "Submit Feedback & Send to Founder Dashboard"}
      </button>
    </div>
  );
};

// ─── Overview Panel ───────────────────────────────────────────────────────────

const OverviewPanel: React.FC<{ rec: Recommendation; profile: FounderProfile }> = ({ rec, profile }) => {
  // ── FIXED: use resolveAvatar helper ──────────────────────────────────────────
  const avatar = resolveAvatar(profile, rec.founderName);

  const info = [
    // ── FIXED: fallback chain for name, includes rec fields ──────────────────
    { label: "Full Name",     value: profile.fullName || profile.name || profile.displayName || profile.username || rec.founderName, icon: <Users2 size={14} /> },
    { label: "Email",         value: profile.email,                                                icon: <Mail size={14} /> },
    { label: "Phone",         value: profile.phone,                                                icon: <Phone size={14} /> },
    { label: "Location",      value: profile.location,                                             icon: <MapPin size={14} /> },
    { label: "Industry",      value: profile.industry || rec.sector,                               icon: <Tag size={14} /> },
    { label: "Stage",         value: profile.stage || rec.stage,                                   icon: <TrendingUp size={14} /> },
    { label: "Startup",       value: profile.startupName || rec.startupName,                       icon: <Briefcase size={14} /> },
    { label: "Founded",       value: profile.founded,                                              icon: <Clock size={14} /> },
    { label: "Team Size",     value: profile.teamSize,                                             icon: <Users size={14} /> },
    { label: "Target Market", value: profile.targetMarket,                                         icon: <Target size={14} /> },
  ].filter(i => i.value);

  const metrics = [
    { label: "Valuation",       value: profile.valuation,                       icon: <DollarSign size={16} />, color: "from-purple-100 to-purple-50 text-purple-700" },
    { label: "Monthly Revenue", value: profile.monthlyRevenue || profile.mrr,   icon: <TrendingUp size={16} />, color: "from-pink-100 to-pink-50 text-pink-700" },
    { label: "ARR",             value: profile.arr,                             icon: <BarChart2 size={16} />, color: "from-violet-100 to-violet-50 text-violet-700" },
    { label: "Growth Rate",     value: profile.growthRate,                      icon: <Activity size={16} />, color: "from-fuchsia-100 to-fuchsia-50 text-fuchsia-700" },
    { label: "Active Users",    value: profile.activeUsers,                     icon: <Users2 size={16} />, color: "from-rose-100 to-rose-50 text-rose-700" },
    { label: "Customers",       value: profile.customerCount,                   icon: <Building2 size={16} />, color: "from-amber-100 to-amber-50 text-amber-700" },
    { label: "Funding Raised",  value: profile.fundingRaised,                   icon: <Banknote size={16} />, color: "from-green-100 to-green-50 text-green-700" },
    { label: "Burn Rate",       value: profile.burnRate,                        icon: <TrendingDown size={16} />, color: "from-red-100 to-red-50 text-red-700" },
    { label: "Runway",          value: profile.runway,                          icon: <Clock size={16} />, color: "from-sky-100 to-sky-50 text-sky-700" },
  ].filter(m => m.value);

  const links = [
    { label: "Website",   href: profile.website,   icon: <Globe size={14} />,    color: "text-purple-600 border-purple-200 hover:bg-purple-50" },
    { label: "LinkedIn",  href: profile.linkedin,  icon: <Linkedin size={14} />, color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
    { label: "Instagram", href: profile.instagram, icon: <Instagram size={14} />,color: "text-pink-600 border-pink-200 hover:bg-pink-50" },
    { label: "Twitter",   href: profile.twitter,   icon: <Twitter size={14} />,  color: "text-sky-600 border-sky-200 hover:bg-sky-50" },
  ].filter(l => l.href);

  // ── FIXED: use bio || description || rec.description in that order ───────────
  const aboutText = profile.bio || profile.description || rec.description;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-100">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img src={avatar} alt={rec.founderName}
              className="w-20 h-20 rounded-2xl object-cover border-3 border-white shadow-lg"
              onError={(e) => {
                // Fallback to dicebear if image fails to load
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.founderName}`;
              }}
            />
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-2 border-white flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-purple-900">
              {profile.fullName || profile.name || profile.displayName || profile.username || rec.founderName}
            </h2>
            <p className="text-purple-600 font-semibold">{profile.startupName || rec.startupName}</p>
            <p className="text-sm text-gray-500 mt-0.5">{profile.industry || rec.sector} · {profile.stage || rec.stage}</p>
            {aboutText && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">{aboutText}</p>
            )}
          </div>
        </div>
        {links.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {links.map((l, i) => (
              <a key={i} href={l.href} target="_blank" rel="noreferrer"
                className={`flex items-center gap-1.5 text-xs font-semibold border rounded-xl px-3 py-1.5 transition-colors ${l.color}`}>
                {l.icon} {l.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {info.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-purple-50">
            <h3 className="font-bold text-purple-900 text-sm flex items-center gap-2">
              <Users size={15} className="text-purple-400" /> Founder Details
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {info.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-pink-50/40 transition-colors">
                <span className="text-purple-400 flex-shrink-0">{item.icon}</span>
                <span className="text-xs text-gray-400 w-28 flex-shrink-0">{item.label}</span>
                <span className="text-sm text-gray-800 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div>
          <h3 className="font-bold text-purple-900 text-sm flex items-center gap-2 mb-3">
            <BarChart2 size={15} className="text-purple-400" /> Key Metrics
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {metrics.map((m, i) => {
              const parts = m.color.split(" ");
              const from = parts[0], to = parts[1], textColor = parts.slice(2).join(" ");
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className={`bg-gradient-to-br ${from} ${to} rounded-xl p-3.5 border border-white shadow-sm`}>
                  <span className={textColor}>{m.icon}</span>
                  <p className={`font-bold text-base mt-1 ${textColor}`}>{m.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FIXED: show about section using merged text ───────────────────────── */}
      {aboutText && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
          <h3 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-2">
            <FileText size={15} className="text-purple-400" /> About the Startup
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{aboutText}</p>
          {profile.usp && (
            <div className="mt-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
              <p className="text-xs text-purple-500 font-bold mb-1">Unique Selling Proposition</p>
              <p className="text-sm text-purple-800">{profile.usp}</p>
            </div>
          )}
          {profile.competitors && (
            <div className="mt-2 bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-xs text-red-500 font-bold mb-1">Key Competitors</p>
              <p className="text-sm text-red-700">{profile.competitors}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Show a message if profile is still sparse ────────────────────────── */}
      {info.length <= 3 && metrics.length === 0 && !aboutText && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <AlertCircle size={28} className="text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-amber-700">Limited Profile Data</p>
          <p className="text-xs text-amber-500 mt-1">This founder hasn't completed their full profile yet. More details will appear once they update their dashboard.</p>
        </div>
      )}
    </div>
  );
};

// ─── Founder Workspace Drawer ─────────────────────────────────────────────────

const FounderWorkspaceDrawer: React.FC<{
  rec: Recommendation;
  investorId: string;
  investorName: string;
  onClose: () => void;
  onAccept: (id: string) => void;
  onPass: (id: string) => void;
}> = ({ rec, investorId, investorName, onClose, onAccept, onPass }) => {
  const [tab, setTab] = useState<"overview" | "pitch" | "chat" | "funding" | "feedback" | "notes">("overview");
  const [profile, setProfile] = useState<FounderProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const load = async () => {
    setLoading(true);

    let merged: FounderProfile = {
      fullName: rec.founderName,
      industry: rec.sector,
      stage: rec.stage,
      startupName: rec.startupName,
      description: rec.description,
    };

    const resolvedFounderId = rec.founderId || "";

    // Helper to merge any doc data in
    const mergeData = (data: any) => {
      merged = { ...merged, ...data };
    };
    // ── STEP 0: Get founderId from myFounders using founderName ──
if (!resolvedFounderId) {
  try {
    const q = query(
      collection(db, "myFounders"),
      where("founderName", "==", rec.founderName)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      mergeData(data);
      // Now use the founderId from myFounders to fetch full profile
      if (data.founderId) {
        const profileSnap = await getDoc(doc(db, "founders", data.founderId));
        if (profileSnap.exists()) mergeData(profileSnap.data());
        const userSnap = await getDoc(doc(db, "users", data.founderId));
        if (userSnap.exists()) mergeData(userSnap.data());
      }
    }
  } catch (e) {}
}

    // ── STEP 1: Direct lookup by founderId across ALL possible collections ──
    if (resolvedFounderId) {
      // const collections = [
      //   "founders",
      //   "users", 
      //   "myFounders",        // ← your actual collection name visible in sidebar
      //   "founderProfiles",
      //   "startupFounders",
      // ];
      
      const collections = [
  "founders",
  "users",
  "myFounders",
];

      for (const colName of collections) {
        try {
          const snap = await getDoc(doc(db, colName, resolvedFounderId));
          if (snap.exists()) {
            console.log(`✅ Found data in collection: ${colName}`, snap.data());
            mergeData(snap.data());
          }
        } catch (e) {}
      }
    }

    // ── STEP 2: Query by username (for "ishaadhvani" style names) ──
    if (!merged.email) {
      const collections = ["founders", "users", "myFounders"];
      for (const colName of collections) {
        try {
          const q = query(
            collection(db, colName),
            where("username", "==", rec.founderName)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            console.log(`✅ Found by username in: ${colName}`);
            mergeData(snap.docs[0].data());
            break;
          }
        } catch (e) {}
      }
    }

    // ── STEP 3: Query by fullName / displayName / name ──
    if (!merged.email) {
      for (const field of ["fullName", "displayName", "name"]) {
        for (const colName of ["founders", "users", "myFounders"]) {
          try {
            const q = query(
              collection(db, colName),
              where(field, "==", rec.founderName)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              console.log(`✅ Found by ${field} in: ${colName}`);
              mergeData(snap.docs[0].data());
              break;
            }
          } catch (e) {}
        }
        if (merged.email) break;
      }
    }

    // ── STEP 4: Query by startupName ──
    if (!merged.email) {
      for (const colName of ["founders", "myFounders", "startups"]) {
        try {
          const q = query(
            collection(db, colName),
            where("startupName", "==", rec.startupName)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            console.log(`✅ Found by startupName in: ${colName}`);
            mergeData(snap.docs[0].data());
            break;
          }
        } catch (e) {}
      }
    }

    console.log("🔍 Final merged profile:", JSON.stringify(merged, null, 2));
    setProfile(merged);
    setLoading(false);
  };

  load();
}, [rec]);

  const founderChatId = investorId && rec.founderId
    ? [investorId, rec.founderId].sort().join("_fc_")
    : `inv_found_${rec.id}`;

  // ── FIXED: use resolveAvatar helper ──────────────────────────────────────────
  const avatar = resolveAvatar(profile, rec.founderName);

  const tabs: { id: typeof tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Overview",  icon: <Target size={14} /> },
    { id: "pitch",     label: "Pitch",     icon: <FileText size={14} /> },
    { id: "chat",      label: "Chat",      icon: <MessageCircle size={14} /> },
    { id: "funding",   label: "Funding",   icon: <DollarSign size={14} /> },
    { id: "feedback",  label: "Feedback",  icon: <Star size={14} /> },
    { id: "notes",     label: "Notes",     icon: <StickyNote size={14} /> },
  ];

  return (
    <motion.div
      initial={{ x: 720, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 720, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed top-0 right-0 h-screen w-[700px] flex flex-col bg-white/95 backdrop-blur-2xl border-l border-pink-100 z-50"
      style={{ boxShadow: "-20px 0 60px rgba(168,85,247,0.15)" }}
    >
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-pink-500 via-purple-600 to-violet-600 px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {loading ? (
              <div className="w-14 h-14 rounded-2xl bg-white/20 animate-pulse" />
            ) : (
              <img src={avatar} alt={rec.founderName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.founderName}`;
                }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{rec.startupName}</h2>
            <p className="text-pink-100 text-sm">
              {profile.fullName || profile.name || profile.displayName || profile.username || rec.founderName}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {[rec.stage, rec.sector || profile.industry].filter(Boolean).map((tag, i) => (
                <span key={i} className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
              ))}
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${rec.status === "accepted" ? "bg-green-400/80" : rec.status === "passed" ? "bg-red-400/80" : "bg-white/30"} text-white`}>
                {rec.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {rec.status === "pending" && (
              <>
                <button onClick={() => onPass(rec.id)}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-colors">Pass</button>
                <button onClick={() => onAccept(rec.id)}
                  className="bg-green-400 hover:bg-green-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-colors">Accept</button>
              </>
            )}
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors">
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-0 border-b border-pink-100 bg-white/80 px-4 pt-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
              tab === t.id ? "border-pink-500 text-pink-700 bg-pink-50/50" : "border-transparent text-gray-500 hover:text-purple-600"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className={tab === "chat" ? "h-full" : "p-5"}>

            {tab === "overview" && (
              loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw size={24} className="text-purple-400 animate-spin" />
                  <p className="text-sm text-purple-400">Loading founder profile…</p>
                </div>
              ) : <OverviewPanel rec={rec} profile={profile} />
            )}

            {tab === "pitch" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                  <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <FileText size={17} className="text-purple-500" /> Pitch Deck
                  </h3>
                  {rec.pitchDeckUrl ? (
                    <div className="space-y-3">
                      <a href={rec.pitchDeckUrl.replace("/image/upload/", "/raw/upload/")} target="_blank" rel="noreferrer"
                        className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-pink-100 hover:bg-pink-50 transition-colors shadow-sm group">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <FileText size={26} className="text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-purple-900">{rec.startupName} — Pitch Deck</p>
                          <p className="text-xs text-gray-400 mt-0.5">PDF · Click to open in new tab</p>
                        </div>
                        <ExternalLink size={18} className="text-purple-400" />
                      </a>
                      <a href={rec.pitchDeckUrl.replace("/image/upload/", "/raw/upload/")} download
                        className="inline-flex items-center gap-2 text-sm text-purple-600 border border-purple-200 rounded-xl px-4 py-2.5 hover:bg-purple-50 transition-colors">
                        <Download size={14} /> Download PDF
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText size={40} className="text-purple-200 mx-auto mb-3" />
                      <p className="text-sm text-purple-400">No pitch deck uploaded yet</p>
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl p-5 border border-violet-100">
                  <h4 className="font-bold text-violet-900 mb-2 flex items-center gap-2">
                    <Star size={15} className="text-yellow-500" /> Mentor's Recommendation
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{rec.description || "Recommended by your connected mentor."}</p>
                  <p className="text-xs text-violet-400 mt-3">
                    Recommended {rec.createdAt?.toDate ? new Date(rec.createdAt.toDate()).toLocaleDateString() : "recently"}
                  </p>
                </div>
              </div>
            )}

            {tab === "chat" && (
              <div className="h-full p-4">
                <ChatPane
                  chatId={founderChatId}
                  investorId={investorId}
                  investorName={investorName}
                  otherName={profile.fullName || profile.name || rec.founderName}
                  otherAvatar={avatar}
                  otherOnline={!!profile.online}
                  isFounderChat
                  founderId={rec.founderId}
                />
              </div>
            )}

            {tab === "funding" && (
              <FundingPanel rec={rec} investorId={investorId} investorName={investorName} />
            )}

            {tab === "feedback" && (
              <FeedbackPanel rec={rec} investorId={investorId} investorName={investorName} />
            )}

            {tab === "notes" && (
              <StickyNotesPanel
                docPath={`${investorId}_${rec.id}`}
                investorId={investorId}
                founderName={profile.fullName || profile.name || rec.founderName}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Founder Card ─────────────────────────────────────────────────────────────

const FounderCard: React.FC<{
  rec: Recommendation;
  onClick: () => void;
  onAccept: (id: string) => void;
  onPass: (id: string) => void;
}> = ({ rec, onClick, onAccept, onPass }) => {
  const stageColor: Record<string, string> = {
    "Pre-seed": "bg-violet-100 text-violet-700",
    "Seed": "bg-purple-100 text-purple-700",
    "Series A": "bg-pink-100 text-pink-700",
    "Series B": "bg-fuchsia-100 text-fuchsia-700",
    "Growth": "bg-rose-100 text-rose-700",
  };
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all group ${
        rec.status === "accepted" ? "border-green-200" : rec.status === "passed" ? "border-red-200 opacity-60" : "border-purple-100 hover:border-purple-300"
      }`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Briefcase size={22} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-gray-900">{rec.startupName}</h3>
                <p className="text-sm text-gray-500">{rec.founderName}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stageColor[rec.stage] || "bg-gray-100 text-gray-600"}`}>{rec.stage}</span>
                <span className="text-xs bg-purple-50 text-purple-600 border border-purple-200 font-semibold px-2.5 py-1 rounded-full">{rec.sector}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{rec.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
            <Eye size={13} /> View Full Profile →
          </div>
          <div className="flex-1" />
          {rec.status === "pending" ? (
            <>
              <button onClick={e => { e.stopPropagation(); onPass(rec.id); }}
                className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors">
                <XCircle size={14} /> Pass
              </button>
              <button onClick={e => { e.stopPropagation(); onAccept(rec.id); }}
                className="flex items-center gap-1.5 text-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl px-4 py-2 hover:opacity-90 shadow-sm shadow-purple-200">
                <CheckCircle size={14} /> Accept
              </button>
            </>
          ) : (
            <span className={`text-sm font-semibold px-4 py-2 rounded-xl border ${rec.status === "accepted" ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-500 border-red-200"}`}>
              {rec.status === "accepted" ? "✓ Accepted" : "✗ Passed"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Funding Tracker ──────────────────────────────────────────────────────────

const FundingTracker: React.FC<{ investorId: string }> = ({ investorId }) => {
  const [tracks, setTracks] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "mentorRecommendations"), where("investorId", "==", investorId), where("status", "==", "accepted"));
    return onSnapshot(q, snap => setTracks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [investorId]);

  const stageWidth: Record<string, string> = {
    exploring: "25%", negotiating: "45%", due_diligence: "60%", term_sheet: "80%", closed: "100%"
  };
  const stageLabel: Record<string, string> = {
    exploring: "Exploring", negotiating: "Negotiating", due_diligence: "Due Diligence", term_sheet: "Term Sheet", closed: "Closed"
  };
  const stageColor: Record<string, string> = {
    exploring: "bg-purple-100 text-purple-700", negotiating: "bg-blue-100 text-blue-700",
    due_diligence: "bg-violet-100 text-violet-700", term_sheet: "bg-pink-100 text-pink-700", closed: "bg-green-100 text-green-700"
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
      <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-purple-500" /> Funding Pipeline</h3>
      {tracks.length === 0 ? (
        <div className="text-center py-6">
          <BarChart2 size={32} className="text-purple-200 mx-auto mb-2" />
          <p className="text-sm text-purple-400">Accept founders to track funding progress</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((t, i) => {
            const status = t.fundingStatus || "exploring";
            return (
              <div key={i} className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{t.startupName}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stageColor[status] || "bg-gray-100 text-gray-600"}`}>
                    {stageLabel[status] || status}
                  </span>
                </div>
                <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: stageWidth[status] || "25%" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{t.stage}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Deal Timeline ────────────────────────────────────────────────────────────

const DealTimeline: React.FC<{ chatId: string }> = ({ chatId }) => {
  const [timeline, setTimeline] = useState<Record<string, boolean>>({});
  useEffect(() => {
    return onSnapshot(doc(db, "workspaceTimeline", chatId), snap => {
      if (snap.exists()) setTimeline(snap.data() as Record<string, boolean>);
    });
  }, [chatId]);

  const steps = [
    { key: "connected",          label: "Mentor Connected",       icon: <Users size={16} />,       color: "from-purple-400 to-purple-600" },
    { key: "founderRecommended", label: "Founder Recommended",    icon: <Award size={16} />,       color: "from-violet-400 to-violet-600" },
    { key: "chatStarted",        label: "Deal Chat Started",      icon: <MessageCircle size={16} />,color: "from-pink-400 to-pink-600" },
    { key: "meetingScheduled",   label: "Meeting Scheduled",      icon: <Calendar size={16} />,    color: "from-rose-400 to-rose-600" },
    { key: "fundingDiscussion",  label: "Funding Discussion",     icon: <DollarSign size={16} />,  color: "from-fuchsia-400 to-fuchsia-600" },
  ];

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-100">
      <h3 className="font-bold text-purple-900 mb-5 flex items-center gap-2"><Target size={18} className="text-pink-500" /> Deal Progress</h3>
      <div className="relative z-[99999]">
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-pink-100" />
        <div className="space-y-4">
          {steps.map((step, i) => {
            const done = timeline[step.key] || step.key === "connected";
            return (
              <motion.div key={step.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${done ? `bg-gradient-to-br ${step.color} text-white shadow-lg` : "bg-white border-2 border-pink-200 text-pink-300"}`}>
                  {step.icon}
                  {done && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${done ? "text-purple-900" : "text-gray-400"}`}>{step.label}</p>
                  {done && <p className="text-xs text-pink-400">Completed</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Mentor Chat Popup ────────────────────────────────────────────────────────

const MentorChatPopup: React.FC<{ mentor: Mentor; investorId: string; investorName: string; onClose: () => void }> = ({ mentor, investorId, investorName, onClose }) => {
  const chatId = [investorId, mentor.id].sort().join("_");
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-96 rounded-3xl overflow-hidden flex flex-col"
      style={{ height: 560, boxShadow: "0 20px 60px rgba(147,51,234,0.25)" }}>
      <div className="flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-600 to-violet-600 px-4 py-3 flex-shrink-0">
        <button onClick={onClose} className="text-white/80 hover:text-white"><ArrowLeft size={18} /></button>
        <img src={mentor.avatar} alt={mentor.name} className="w-8 h-8 rounded-full object-cover border border-white/30" />
        <p className="text-white font-semibold text-sm flex-1 truncate">{mentor.name}</p>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X size={17} /></button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatPane chatId={chatId} investorId={investorId} investorName={investorName}
          otherName={mentor.name} otherAvatar={mentor.avatar} otherOnline={mentor.online} />
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const InvestorDealRoom: React.FC = () => {
  const [investorId, setInvestorId] = useState("");
  const [investorName, setInvestorName] = useState("Investor");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "founders" | "timeline">("overview");
  const [showChat, setShowChat] = useState(false);
  const [selectedFounder, setSelectedFounder] = useState<Recommendation | null>(null);
  const [showFounderDrawer, setShowFounderDrawer] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "passed">("all");

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      if (user) {
        setInvestorId(user.uid);
        const snap = await getDoc(doc(db, "investors", user.uid)).catch(() => null);
        if (snap?.exists()) {
          const d = snap.data();
          setInvestorName(d.fullName || d.name || d.displayName || user.displayName || "Investor");
        } else {
          setInvestorName(user.displayName || "Investor");
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!investorId) return;
    const q = query(collection(db, "mentorInvestorConnections"),
      where("investorId", "==", investorId), where("status", "==", "Accepted"));
    return onSnapshot(q, async snap => {
      const list: Mentor[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        const mid = data.mentorId;
        let name = data.mentorName || "Mentor", avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${mid}`;
        let expertise = "Startup Advisor", online = false;
        try {
          const ms = await getDoc(doc(db, "mentors", mid));
          if (ms.exists()) {
            const u = ms.data();
            name = u.name || u.fullName || u.displayName || name;
            avatar = u.photo || u.photoURL || u.image || u.avatar || u.profileImage || u.profilePhoto || avatar;
            expertise = u.expertise || u.specialization || u.headline || expertise;
            online = u.online || false;
          }
        } catch (e) {}
        const chatId = [investorId, mid].sort().join("_");
        let unread = 0;
        try {
          const uq = query(collection(db, "mentorInvestorChats", chatId, "messages"),
            where("seen", "==", false), where("senderId", "!=", investorId));
          unread = (await getDocs(uq)).size;
        } catch (e) {}
        list.push({ id: mid, name, avatar, expertise, online, unreadCount: unread });
      }
      setMentors(list);
      if (list.length > 0 && !selectedMentor) setSelectedMentor(list[0]);
    });
  }, [investorId]);

  useEffect(() => {
    if (!selectedMentor || !investorId) return;
    const q = query(collection(db, "mentorRecommendations"),
      where("investorId", "==", investorId), where("mentorId", "==", selectedMentor.id));
    return onSnapshot(q, snap => setRecommendations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recommendation))));
  }, [selectedMentor, investorId]);

  const handleAccept = async (recId: string) => {
    const recSnap = await getDoc(doc(db, "mentorRecommendations", recId));
    if (recSnap.exists() && !recSnap.data().founderId && recSnap.data().founderName) {
      const q = query(collection(db, "founders"), where("fullName", "==", recSnap.data().founderName));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, "mentorRecommendations", recId), { founderId: snap.docs[0].id });
      }
    }
    await updateDoc(doc(db, "mentorRecommendations", recId), { status: "accepted" });
    if (selectedMentor) {
      const chatId = [investorId, selectedMentor.id].sort().join("_");
      await setDoc(doc(db, "workspaceTimeline", chatId), { fundingDiscussion: true }, { merge: true });
      await addDoc(collection(db, "notifications"), {
        to: selectedMentor.id, from: investorId, type: "founder_accepted",
        message: "Investor accepted your founder recommendation!", read: false, createdAt: serverTimestamp()
      });
    }
    setSelectedFounder(prev => prev?.id === recId ? { ...prev, status: "accepted" } : prev);
  };

  const handlePass = async (recId: string) => {
    await updateDoc(doc(db, "mentorRecommendations", recId), { status: "passed" });
    setSelectedFounder(prev => prev?.id === recId ? { ...prev, status: "passed" } : prev);
  };

  const filtered = mentors.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.expertise.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRecs = recommendations.filter(r => filterStatus === "all" || r.status === filterStatus);
  const pendingCount = recommendations.filter(r => r.status === "pending").length;

  const tabs = [
    { id: "overview" as const,  label: "Overview",             icon: <Target size={15} /> },
    { id: "founders" as const,  label: "Recommended Founders", icon: <Award size={15} /> },
    { id: "timeline" as const,  label: "Timeline",             icon: <TrendingUp size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-violet-50/50 flex">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-pink-100/70 flex flex-col h-screen sticky top-0">
        <div className="p-5 border-b border-pink-100/70">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-purple-900 text-sm">Investor Deal Room</h2>
              <p className="text-xs text-purple-400">{mentors.length} Connected Mentors</p>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search mentors…"
              className="w-full pl-8 pr-3 py-2 bg-pink-50 border border-pink-200 rounded-xl text-sm text-purple-900 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-300" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <Users size={32} className="text-pink-200 mx-auto mb-3" />
              <p className="text-sm text-purple-400">No mentors connected yet</p>
            </div>
          )}
          {filtered.map((m, i) => (
            <motion.button key={m.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => { setSelectedMentor(m); setActiveTab("overview"); setShowFounderDrawer(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left ${selectedMentor?.id === m.id ? "bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 shadow-sm" : "hover:bg-pink-50/60"}`}>
              <div className="relative flex-shrink-0">
                <img src={m.avatar} alt={m.name} className="w-11 h-11 rounded-full object-cover border-2 border-pink-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold truncate ${selectedMentor?.id === m.id ? "text-purple-800" : "text-gray-800"}`}>{m.name}</p>
                  {m.unreadCount > 0 && (
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {m.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{m.expertise}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {selectedMentor ? (
          <>
            <div className="bg-white/80 backdrop-blur-xl border-b border-pink-100/70 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
              <div className="relative">
                <img src={selectedMentor.avatar} alt={selectedMentor.name} className="w-12 h-12 rounded-full object-cover border-2 border-pink-200" />
              </div>
              <div className="flex-1">
                <h1 className="font-bold text-purple-900 text-lg">{selectedMentor.name}</h1>
              </div>
              <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-purple-600 border border-purple-200 rounded-xl px-3 py-2 bg-purple-50">
                    <Award size={14} className="text-purple-500" />
                    <span className="font-bold">{pendingCount}</span>
                    <span className="text-gray-400">pending</span>
                  </div>
                )}
                <button onClick={() => setShowChat(v => !v)}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 shadow-lg shadow-pink-200">
                  <MessageCircle size={16} /> Open Chat
                </button>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border-b border-pink-100/70 px-6">
              <div className="flex gap-1">
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === t.id ? "border-pink-500 text-pink-700" : "border-transparent text-gray-500 hover:text-pink-500"}`}>
                    {t.icon} {t.label}
                    {t.id === "founders" && pendingCount > 0 && (
                      <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>

                  {activeTab === "overview" && (
                    <div className="max-w-3xl space-y-5">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "Pending Reviews",   value: pendingCount,                                              icon: <Clock size={20} className="text-yellow-500" />,  color: "from-yellow-50 to-amber-50 border-yellow-200" },
                          { label: "Accepted Founders", value: recommendations.filter(r => r.status === "accepted").length, icon: <CheckCircle size={20} className="text-green-500" />, color: "from-green-50 to-emerald-50 border-green-200" },
                          { label: "Passed",            value: recommendations.filter(r => r.status === "passed").length,   icon: <XCircle size={20} className="text-red-400" />,    color: "from-red-50 to-rose-50 border-red-200" },
                        ].map((card, i) => (
                          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 border`}>
                            <div className="flex items-center gap-3 mb-3">{card.icon}<span className="text-sm text-gray-500 font-medium">{card.label}</span></div>
                            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                          </motion.div>
                        ))}
                      </div>
                      <FundingTracker investorId={investorId} />
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                        <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-500" /> Quick Actions</h3>
                        <div className="flex gap-3 flex-wrap">
                          {[
                            { label: "Review Founders", icon: <Eye size={15} />,          color: "border-purple-200 text-purple-700 hover:bg-purple-50", action: () => setActiveTab("founders") },
                            { label: "Message Mentor",  icon: <MessageCircle size={15} />, color: "border-pink-200 text-pink-700 hover:bg-pink-50",       action: () => setShowChat(true) },
                            { label: "Deal Progress",   icon: <TrendingUp size={15} />,   color: "border-violet-200 text-violet-700 hover:bg-violet-50",  action: () => setActiveTab("timeline") },
                          ].map((btn, i) => (
                            <button key={i} onClick={btn.action}
                              className={`flex items-center gap-2 bg-white border rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${btn.color}`}>
                              {btn.icon} {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "founders" && (
                    <div className="max-w-2xl space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-bold text-purple-900 text-lg flex items-center gap-2">
                          <Award size={20} className="text-purple-500" /> Recommended Founders
                        </h2>
                        <div className="flex gap-2 ml-auto flex-wrap">
                          {(["all", "pending", "accepted", "passed"] as const).map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${filterStatus === s ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white border border-purple-200 text-purple-600 hover:bg-purple-50"}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {filteredRecs.length === 0 ? (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-10 border border-purple-100 text-center">
                          <Award size={40} className="text-purple-200 mx-auto mb-3" />
                          <p className="text-purple-400 font-medium">No recommendations yet</p>
                        </div>
                      ) : (
                        <AnimatePresence>
                          {filteredRecs.map(rec => (
                            <FounderCard key={rec.id} rec={rec}
                              onClick={() => { setSelectedFounder(rec); setShowFounderDrawer(true); }}
                              onAccept={handleAccept} onPass={handlePass} />
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  )}

                  {activeTab === "timeline" && (
                    <div className="max-w-md">
                      <DealTimeline chatId={[investorId, selectedMentor.id].sort().join("_")} />
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <Layers size={36} className="text-pink-400" />
            </div>
            <h2 className="text-xl font-bold text-purple-900">Select a Mentor</h2>
            <p className="text-sm text-purple-400">Choose a connected mentor from the sidebar</p>
          </div>
        )}
      </main>

      {/* Mentor Chat Popup */}
      <AnimatePresence>
        {showChat && selectedMentor && (
          <MentorChatPopup mentor={selectedMentor} investorId={investorId} investorName={investorName} onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>

      {/* Founder Drawer Backdrop */}
      <AnimatePresence>
        {showFounderDrawer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-purple-900/10 backdrop-blur-sm z-40"
            onClick={() => setShowFounderDrawer(false)} />
        )}
      </AnimatePresence>

      {/* Founder Workspace Drawer */}
      <AnimatePresence>
        {showFounderDrawer && selectedFounder && (
          <FounderWorkspaceDrawer
            rec={selectedFounder}
            investorId={investorId}
            investorName={investorName}
            onClose={() => setShowFounderDrawer(false)}
            onAccept={handleAccept}
            onPass={handlePass}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestorDealRoom;