import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Users, Calendar, Star, ChevronRight, Send, Smile,
  Pin, Trash2, Reply, Check, CheckCheck, Clock, Video, X, Plus,
  FileText, TrendingUp, Bell, Search, MoreHorizontal, ArrowLeft,
  Paperclip, Heart, Bookmark, Award, Zap, Target, ChevronDown,
  User, Circle, Phone, ArrowRight
} from "lucide-react";
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, setDoc, getDoc, where, getDocs,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from "../../../../../../firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Investor {
  id: string;
  name: string;
  avatar: string;
  firm: string;
  online: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastSeen?: Timestamp;
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
  reactions?: Record<string, string[]>;
  type: "text" | "meeting" | "file";
  meetingData?: { date: string; time: string; link: string; title: string };
  fileUrl?: string;
  fileName?: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  link: string;
  createdBy: string;
  investorId: string;
  status: "scheduled" | "completed" | "cancelled";
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
  founderAvatar?: string;
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
}

// ─── Emoji Picker Component ───────────────────────────────────────────────────

const EMOJIS = ["😊","😂","❤️","🔥","👏","💡","🚀","✅","💬","🤝","💰","⭐","🎯","💎","🌟"];

const EmojiPicker: React.FC<{ onSelect: (e: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.85, y: 8 }}
    className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-2xl border border-purple-100 p-3 z-50 grid grid-cols-5 gap-1"
    style={{ boxShadow: "0 8px 32px rgba(147,51,234,0.18)" }}
  >
    {EMOJIS.map(e => (
      <button key={e} onClick={() => { onSelect(e); onClose(); }}
        className="text-xl hover:bg-purple-50 rounded-lg p-1.5 transition-colors">{e}</button>
    ))}
  </motion.div>
);

// ─── Meeting Scheduler ────────────────────────────────────────────────────────

const MeetingScheduler: React.FC<{
  onSchedule: (data: { title: string; date: string; time: string; link: string }) => void;
  onClose: () => void;
}> = ({ onSchedule, onClose }) => {
  const [title, setTitle] = useState("Investment Discussion");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [meetingsCount, setMeetingsCount] = useState(0);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-5 w-72"
      style={{ boxShadow: "0 8px 32px rgba(147,51,234,0.18)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-purple-900 flex items-center gap-2">
          <Calendar size={16} className="text-purple-500" /> Schedule Meeting
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="space-y-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting title"
          className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="Meeting link (Zoom/Meet)"
          className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <button onClick={() => { if (title && date && time) { onSchedule({ title, date, time, link }); onClose(); }}}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
          Send Invite
        </button>
      </div>
    </motion.div>
  );
};

// ─── Chat Popup ───────────────────────────────────────────────────────────────

const ChatPopup: React.FC<{
  investor: Investor;
  mentorId: string;
  onClose: () => void;
}> = ({ investor, mentorId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typing, setTyping] = useState(false);
  const [pinnedMsgs, setPinnedMsgs] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chatId = [mentorId, investor.id].sort().join("_");
  const messagesRef = collection(db, "mentorInvestorChats", chatId, "messages");

  // Realtime messages listener
  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setPinnedMsgs(msgs.filter(m => m.pinned));
      // Mark as seen
      msgs.filter(m => !m.seen && m.senderId !== mentorId).forEach(m => {
        updateDoc(doc(messagesRef, m.id), { seen: true });
      });
    });
    return () => unsub();
  }, [chatId]);

  // Typing indicator listener
  useEffect(() => {
    const typingRef = doc(db, "mentorInvestorChats", chatId, "typing", investor.id);
    const unsub = onSnapshot(typingRef, snap => {
      if (snap.exists()) setTyping(snap.data()?.isTyping || false);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleTyping = () => {
    const typingRef = doc(db, "mentorInvestorChats", chatId, "typing", mentorId);
    setDoc(typingRef, { isTyping: true }, { merge: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(typingRef, { isTyping: false }, { merge: true });
    }, 1500);
  };

  const sendMessage = async (type: "text" | "meeting" = "text", extra?: Partial<Message>) => {
    if (type === "text" && !input.trim()) return;
    const payload: Partial<Message> = {
      senderId: mentorId,
      senderName: "You (Mentor)",
      text: type === "text" ? input : extra?.text || "",
      timestamp: serverTimestamp() as unknown as Timestamp,
      seen: false,
      pinned: false,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName } : null,
      type,
      ...extra,
    };
    await addDoc(messagesRef, payload);
    // Update timeline
    const timelineRef = doc(db, "workspaceTimeline", chatId);
    const snap = await getDoc(timelineRef);
    const current = snap.exists() ? snap.data() : {};
    if (!current.chatStarted) await setDoc(timelineRef, { chatStarted: true, chatStartedAt: serverTimestamp() }, { merge: true });
    if (type === "meeting") await setDoc(timelineRef, { meetingScheduled: true, meetingScheduledAt: serverTimestamp() }, { merge: true });
    setInput("");
    setReplyTo(null);
    setShowEmoji(false);
  };

  const scheduleMeeting = async (data: { title: string; date: string; time: string; link: string }) => {
    const meetingRef = await addDoc(collection(db, "meetings"), {
      ...data, createdBy: mentorId, investorId: investor.id, status: "scheduled", createdAt: serverTimestamp()
    });
    await sendMessage("meeting", {
      text: `📅 Meeting Scheduled: ${data.title}`,
      meetingData: { ...data },
    });
  };

  const pinMessage = (msg: Message) => updateDoc(doc(messagesRef, msg.id), { pinned: !msg.pinned });
  const deleteMessage = (id: string) => deleteDoc(doc(messagesRef, id));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-96 flex flex-col rounded-3xl overflow-hidden"
      style={{ height: 560, boxShadow: "0 20px 60px rgba(147,51,234,0.25), 0 4px 20px rgba(0,0,0,0.1)" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-pink-500 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="relative">
          <img src={investor.avatar} alt={investor.name} className="w-9 h-9 rounded-full object-cover border-2 border-white/40" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{investor.name}</p>
                  </div>
        <button onClick={() => setShowMeeting(v => !v)} className="text-white/80 hover:text-white transition-colors">
          <Calendar size={17} />
        </button>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <X size={17} />
        </button>
      </div>

      {/* Meeting scheduler */}
      <AnimatePresence>
        {showMeeting && (
          <div className="absolute top-14 right-2 z-50">
            <MeetingScheduler onSchedule={scheduleMeeting} onClose={() => setShowMeeting(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Pinned messages */}
      {pinnedMsgs.length > 0 && (
        <div className="bg-purple-50 border-b border-purple-100 px-3 py-2">
          <p className="text-xs text-purple-500 font-medium flex items-center gap-1.5">
            <Pin size={11} /> {pinnedMsgs.length} pinned message{pinnedMsgs.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Reply banner */}
      {replyTo && (
        <div className="bg-pink-50 border-b border-pink-100 px-3 py-2 flex items-center gap-2">
          <Reply size={13} className="text-pink-400 flex-shrink-0" />
          <p className="text-xs text-pink-600 truncate flex-1">Replying to: {replyTo.text}</p>
          <button onClick={() => setReplyTo(null)}><X size={13} className="text-pink-400" /></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-50/60 to-pink-50/30 px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <MessageCircle size={24} className="text-purple-400" />
            </div>
            <p className="text-sm text-purple-400 font-medium">Start the conversation</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === mentorId;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
              <div className={`max-w-[78%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                {msg.replyTo && (
                  <div className={`text-xs px-2 py-1 rounded-lg mb-1 border-l-2 ${isOwn ? "bg-purple-100 border-purple-300 text-purple-600" : "bg-gray-100 border-gray-300 text-gray-500"}`}>
                    {msg.replyTo.senderName}: {msg.replyTo.text.slice(0, 40)}{msg.replyTo.text.length > 40 ? "…" : ""}
                  </div>
                )}
                <div className={`relative px-3 py-2 rounded-2xl text-sm ${isOwn ? "bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-br-sm" : "bg-white text-gray-800 border border-purple-100 rounded-bl-sm shadow-sm"} ${msg.type === "meeting" ? "border-2 border-purple-300" : ""}`}>
                  {msg.type === "meeting" && msg.meetingData ? (
                    <div>
                      <p className="font-semibold text-xs mb-1 opacity-80">📅 Meeting Invite</p>
                      <p className="font-bold">{msg.meetingData.title}</p>
                      <p className="text-xs opacity-80 mt-0.5">{msg.meetingData.date} at {msg.meetingData.time}</p>
                      {msg.meetingData.link && (
                        <a href={msg.meetingData.link} target="_blank" rel="noreferrer"
                          className={`text-xs mt-1 underline block ${isOwn ? "text-purple-200" : "text-purple-500"}`}>
                          Join Meeting →
                        </a>
                      )}
                    </div>
                  ) : <p>{msg.text}</p>}
                  {msg.pinned && <Pin size={10} className="absolute -top-1.5 -right-1 text-yellow-500 bg-white rounded-full" />}
                </div>
                <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-gray-400">
                    {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                  {isOwn && (msg.seen ? <CheckCheck size={11} className="text-purple-400" /> : <Check size={11} className="text-gray-400" />)}
                </div>
                {/* Context menu */}
                <div className={`hidden group-hover:flex items-center gap-1 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <button onClick={() => setReplyTo(msg)} className="text-gray-400 hover:text-purple-500 transition-colors">
                    <Reply size={13} />
                  </button>
                  <button onClick={() => pinMessage(msg)} className={`transition-colors ${msg.pinned ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"}`}>
                    <Pin size={13} />
                  </button>
                  {isOwn && (
                    <button onClick={() => deleteMessage(msg.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-2">
            <div className="bg-white border border-purple-100 rounded-2xl px-3 py-2 shadow-sm flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 block" />
              ))}
            </div>
            <span className="text-xs text-gray-400">typing…</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-purple-100 px-3 py-3 relative">
        <div className="flex items-center gap-2 bg-purple-50 rounded-2xl px-3 py-2 border border-purple-200 focus-within:border-purple-400 transition-colors">
          <input value={input} onChange={e => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none" />
          <div className="flex items-center gap-1 relative">
            <button onClick={() => setShowEmoji(v => !v)} className="text-gray-400 hover:text-purple-500 transition-colors">
              <Smile size={18} />
            </button>
            <AnimatePresence>
              {showEmoji && <EmojiPicker onSelect={e => setInput(v => v + e)} onClose={() => setShowEmoji(false)} />}
            </AnimatePresence>
            <button onClick={() => sendMessage()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-1.5 hover:opacity-90 transition-opacity">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Founder Recommendation Form ─────────────────────────────────────────────
const RecommendationForm: React.FC<{
  mentorId: string;
  investorId: string;
  onSaved: () => void;
}> = ({ mentorId, investorId, onSaved }) => {
  const [form, setForm] = useState({ founderName: "", startupName: "", sector: "", stage: "Pre-seed", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [founders, setFounders] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stages = ["Pre-seed", "Seed", "Series A", "Series B", "Growth"];
  const sectors = ["FinTech", "HealthTech", "EdTech", "CleanTech", "AgriTech", "D2C", "SaaS", "DeepTech", "Other"];

  // Load mentor's founders
  useEffect(() => {
    const fetchFounders = async () => {
      const snap = await getDocs(collection(db, "myFounders"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFounders(list);
    };
    fetchFounders();
  }, [mentorId]);

  const handleFounderSelect = (founder: any) => {
    setForm(f => ({
      ...f,
      founderName: founder.founderName || founder.name || founder.founder || "",
      startupName: founder.startupName || founder.startup || "",
      sector:      founder.sector || founder.industry || "",
      stage:       founder.stage || "Pre-seed",
      description: founder.description || founder.bio || "",
    }));
    setShowDropdown(false);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "empowerher");
    const res = await fetch("https://api.cloudinary.com/v1_1/dcgm3doyn/raw/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!form.founderName || !form.startupName) return;
    setSaving(true);
    try {
      let pitchDeckUrl = "";
      if (file) {
        pitchDeckUrl = await uploadToCloudinary(file);
      }
      await addDoc(collection(db, "mentorRecommendations"), {
        ...form, pitchDeckUrl, mentorId, investorId, status: "pending", createdAt: serverTimestamp()
      });
      const chatId = [mentorId, investorId].sort().join("_");
      await setDoc(doc(db, "workspaceTimeline", chatId), { founderRecommended: true, founderRecommendedAt: serverTimestamp() }, { merge: true });
      await addDoc(collection(db, "notifications"), {
        to: investorId, from: mentorId, type: "founder_recommended",
        message: `New founder recommended: ${form.startupName}`, read: false, createdAt: serverTimestamp()
      });
      setForm({ founderName: "", startupName: "", sector: "", stage: "Pre-seed", description: "" });
      setFile(null);
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
        <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
          <Award size={18} className="text-purple-500" /> Recommend a Founder
        </h3>
        <div className="grid grid-cols-2 gap-3">

          {/* Founder name with dropdown */}
          <div className="relative col-span-1">
            <input
              value={form.founderName}
              onChange={e => setForm(f => ({ ...f, founderName: e.target.value }))}
              onFocus={() => setShowDropdown(true)}
              placeholder="Founder name"
              className="w-full rounded-xl border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
            {showDropdown && founders.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                {founders.map(f => (
                  <button
                    key={f.id}
                    onMouseDown={() => handleFounderSelect(f)}
                    className="w-full text-left px-3 py-2.5 hover:bg-purple-50 transition-colors border-b border-purple-50 last:border-0"
                  >
                    <p className="text-sm font-semibold text-gray-800">
                      {f.founderName || f.name || f.founder || f.id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {f.startupName || f.startup || ""} {f.sector ? `· ${f.sector}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input value={form.startupName} onChange={e => setForm(f => ({ ...f, startupName: e.target.value }))}
            placeholder="Startup name" className="col-span-1 rounded-xl border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white" />
          <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
            className="col-span-1 rounded-xl border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-700">
            <option value="">Select Sector</option>
            {sectors.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
            className="col-span-1 rounded-xl border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-700">
            {stages.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Why do you recommend this founder?..."
          rows={4} className="w-full mt-3 rounded-xl border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white resize-none" />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-purple-600 border border-purple-200 rounded-xl px-3 py-2 text-sm hover:bg-purple-50 transition-colors">
            <Paperclip size={14} /> {file ? file.name.slice(0, 20) + "…" : "Attach Pitch Deck"}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.pptx,.ppt" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button onClick={handleSubmit} disabled={saving || !form.founderName || !form.startupName}
            className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
            {saving ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}><Zap size={14} /></motion.span> : <Send size={14} />}
            {saving ? "Sending…" : "Send Recommendation"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Timeline Component ───────────────────────────────────────────────────────

const WorkspaceTimeline: React.FC<{ chatId: string }> = ({ chatId }) => {
  const [timeline, setTimeline] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "workspaceTimeline", chatId), snap => {
      if (snap.exists()) setTimeline(snap.data() as Record<string, boolean>);
    });
    return () => unsub();
  }, [chatId]);

  const steps = [
    { key: "connected", label: "Connected", icon: <Users size={16} />, color: "from-purple-400 to-purple-600" },
    { key: "founderRecommended", label: "Founder Recommended", icon: <Award size={16} />, color: "from-violet-400 to-violet-600" },
    { key: "chatStarted", label: "Chat Started", icon: <MessageCircle size={16} />, color: "from-pink-400 to-pink-600" },
    { key: "meetingScheduled", label: "Meeting Scheduled", icon: <Calendar size={16} />, color: "from-rose-400 to-rose-600" },
    { key: "fundingDiscussion", label: "Funding Discussion", icon: <TrendingUp size={16} />, color: "from-fuchsia-400 to-fuchsia-600" },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
      <h3 className="font-bold text-purple-900 mb-5 flex items-center gap-2">
        <Target size={18} className="text-purple-500" /> Collaboration Progress
      </h3>
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-purple-100" />
        <div className="space-y-4">
          {steps.map((step, i) => {
            const done = timeline[step.key] || (step.key === "connected");
            return (
              <motion.div key={step.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${done ? `bg-gradient-to-br ${step.color} text-white shadow-lg` : "bg-white border-2 border-purple-200 text-purple-300"}`}>
                  {step.icon}
                  {done && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${done ? "text-purple-900" : "text-gray-400"}`}>{step.label}</p>
                  {done && <p className="text-xs text-purple-400">Completed</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Main MentorWorkspace ─────────────────────────────────────────────────────
const MentorWorkspace: React.FC = () => {
  const mentorId = auth.currentUser?.uid || "mentor_demo";
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "recommend" | "timeline">("overview");
  const [showChat, setShowChat] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [meetingsCount, setMeetingsCount] = useState(0);

  // Load connected investors
  useEffect(() => {
 const q = query(
  collection(db, "mentorInvestorConnections"),
  where("mentorId", "==", mentorId),
  where("status", "==", "Accepted")
);
const unsub = onSnapshot(q, async snap => {
  console.log("connections found:", snap.size);
  const investorList: Investor[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    let name = data.investorName || "Investor";
    let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.investorId}`;
    let firm = "Investment Firm";
    let online = false;

    try {
const investorSnap = await getDoc(doc(db, "investors", data.investorId));
if (investorSnap.exists()) {
  const u = investorSnap.data();
  name   = u.fullName || u.name || name;
  avatar = u.photoURL || avatar;
  firm   = u.company || firm;
  online = u.online || false;
}
    } catch (e) {
      console.warn("investor profile fetch failed", e);
    }

    const chatId = [mentorId, data.investorId].sort().join("_");
    let unreadCount = 0;
    try {
      const unreadSnap = await getDocs(query(
        collection(db, "mentorInvestorChats", chatId, "messages"),
        where("seen", "==", false),
        where("senderId", "!=", mentorId)
      ));
      unreadCount = unreadSnap.size;
    } catch (e) {}

    investorList.push({
      id: data.investorId, name, avatar, firm, online, unreadCount,
    });
  }
  setInvestors(investorList);
if (investorList.length) {
  // Always refresh selectedInvestor with latest data
  setSelectedInvestor(prev =>
    prev
      ? investorList.find(i => i.id === prev.id) || investorList[0]
      : investorList[0]
  );
}
});
    return () => unsub();
  }, [mentorId]);

  // Load recommendations
  useEffect(() => {
    if (!selectedInvestor) return;
    const q = query(collection(db, "mentorRecommendations"), where("mentorId", "==", mentorId), where("investorId", "==", selectedInvestor.id));
    const unsub = onSnapshot(q, snap => {
      setRecommendations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recommendation)));
    });
    return () => unsub();
  }, [selectedInvestor, mentorId]);

  const filteredInvestors = investors.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.firm.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect(() => {
  if (!selectedInvestor) return;

  const q = query(
    collection(db, "meetings"),
    where("investorId", "==", selectedInvestor.id),
    where("createdBy", "==", mentorId),
    where("status", "==", "scheduled")
  );

  const unsub = onSnapshot(q, (snap) => {
setMeetingsCount(snap.size);
  });

  return () => unsub();

}, [selectedInvestor, mentorId]);

  const tabs = [
    { id: "overview", label: "Overview", icon: <Target size={15} /> },
    // { id: "chat", label: "Chat", icon: <MessageCircle size={15} /> },
    { id: "recommend", label: "Recommend Founder", icon: <Award size={15} /> },
    { id: "timeline", label: "Timeline", icon: <TrendingUp size={15} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-pink-50/60 flex">
      {/* Left Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-purple-100/70 flex flex-col h-screen sticky top-0">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-purple-100/70">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-purple-900 text-sm">Mentor Workspace</h2>
              <p className="text-xs text-purple-400">{investors.length} Connected Investors</p>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search investors…"
              className="w-full pl-8 pr-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-900 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
        </div>

        {/* Investor List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredInvestors.length === 0 && (
            <div className="text-center py-10">
              <Users size={32} className="text-purple-200 mx-auto mb-3" />
              <p className="text-sm text-purple-400">No investors connected yet</p>
            </div>
          )}
          {filteredInvestors.map((inv, i) => (
            <motion.button key={inv.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => { setSelectedInvestor(inv); setActiveTab("overview"); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-left group ${selectedInvestor?.id === inv.id ? "bg-gradient-to-r from-purple-100 to-pink-50 border border-purple-200 shadow-sm" : "hover:bg-purple-50"}`}>
              <div className="relative flex-shrink-0">
                <img src={inv.avatar} alt={inv.name} className="w-11 h-11 rounded-full object-cover border-2 border-purple-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold truncate ${selectedInvestor?.id === inv.id ? "text-purple-800" : "text-gray-800"}`}>{inv.name}</p>
                  {inv.unreadCount > 0 && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {inv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{inv.firm}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {selectedInvestor ? (
          <>
            {/* Top bar */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-purple-100/70 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
              <div className="relative">
                <img src={selectedInvestor.avatar} alt={selectedInvestor.name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-200" />
              </div>
              <div className="flex-1">
                <h1 className="font-bold text-purple-900 text-lg">{selectedInvestor.name}</h1>
                <p className="text-sm text-purple-400">{selectedInvestor.firm} · {selectedInvestor.online ? "Online now" : "Offline"}</p>
              </div>
              <button onClick={() => setShowChat(v => !v)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-200">
                <MessageCircle size={16} /> Open Chat
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white/60 backdrop-blur-xl border-b border-purple-100/70 px-6">
              <div className="flex gap-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${activeTab === tab.id ? "border-purple-500 text-purple-700" : "border-transparent text-gray-500 hover:text-purple-500"}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>

                  {activeTab === "overview" && (
                    <div className="grid grid-cols-2 gap-5 max-w-3xl">
                      {[
                        { label: "Connection Status", value: "Active", icon: <Circle size={20} className="text-green-500" />, color: "from-green-50 to-emerald-50", border: "border-green-200" },
                        { label: "Recommendations Sent", value: recommendations.length, icon: <Award size={20} className="text-purple-500" />, color: "from-purple-50 to-violet-50", border: "border-purple-200" },
                        { label: "Meetings Scheduled", value: meetingsCount  , icon: <Calendar size={20} className="text-pink-500" />, color: "from-pink-50 to-rose-50", border: "border-pink-200" },
                        { label: "Firm", value: selectedInvestor.firm, icon: <Users size={20} className="text-violet-500" />, color: "from-violet-50 to-purple-50", border: "border-violet-200" },
                      ].map((card, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                          className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 border ${card.border}`}>
                          <div className="flex items-center gap-3 mb-3">{card.icon}<span className="text-sm text-gray-500 font-medium">{card.label}</span></div>
                          <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                        </motion.div>
                      ))}
                      <div className="col-span-2">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                          <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-500" /> Quick Actions</h3>
                          <div className="flex gap-3 flex-wrap">
                            <button onClick={() => setActiveTab("recommend")} className="flex items-center gap-2 bg-white border border-purple-200 text-purple-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-purple-50 transition-colors">
                              <Award size={15} /> Recommend Founder
                            </button>
                            <button onClick={() => setShowChat(true)} className="flex items-center gap-2 bg-white border border-pink-200 text-pink-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
                              <MessageCircle size={15} /> Send Message
                            </button>
                            <button onClick={() => setActiveTab("timeline")} className="flex items-center gap-2 bg-white border border-violet-200 text-violet-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-violet-50 transition-colors">
                              <TrendingUp size={15} /> View Progress
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "chat" && (
                    <div className="max-w-lg">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                          <MessageCircle size={28} className="text-purple-600" />
                        </div>
                        <h3 className="font-bold text-purple-900 mb-2">Chat in Floating Window</h3>
                        <p className="text-sm text-purple-500 mb-5">Click the button below to open the realtime chat with {selectedInvestor.name} in a floating popup.</p>
                        <button onClick={() => setShowChat(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-6 py-3 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-200">
                          Open Chat Popup
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "recommend" && (
                    <div className="max-w-2xl space-y-5">
                      <RecommendationForm mentorId={mentorId} investorId={selectedInvestor.id} onSaved={() => {}} />
                      {recommendations.length > 0 && (
                        <div>
                          <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                            <Bookmark size={16} className="text-purple-500" /> Sent Recommendations
                          </h3>
                          <div className="space-y-3">
                            {recommendations.map((r, i) => (
                              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                className="bg-white border border-purple-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                  <User size={20} className="text-purple-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 text-sm">{r.founderName} · {r.startupName}</p>
                                  <p className="text-xs text-gray-400">{r.sector} · {r.stage}</p>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${r.status === "accepted" ? "bg-green-50 text-green-600 border-green-200" : r.status === "passed" ? "bg-red-50 text-red-500 border-red-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
                                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "timeline" && (
                    <div className="max-w-md">
                      <WorkspaceTimeline chatId={[mentorId, selectedInvestor.id].sort().join("_")} />
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Users size={36} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-purple-900">Select an Investor</h2>
            <p className="text-sm text-purple-400">Choose a connected investor from the sidebar to start collaborating</p>
          </div>
        )}
      </main>

      {/* Floating Chat Popup */}
      <AnimatePresence>
        {showChat && selectedInvestor && (
          <ChatPopup investor={selectedInvestor} mentorId={mentorId} onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorWorkspace;


