import { useEffect, useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  Plus,
  Zap,
  DollarSign,
  Users,
  Monitor,
  Sparkles,
  Check,
  X,
  Pin,
  Bell,
  Tag,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  StickyNote,
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday,
} from "date-fns";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

import { db, auth } from "../../../../../../firebase";
import { onAuthStateChanged } from "firebase/auth";

// ─── Cloudinary config ────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "dcgm3doyn";
const CLOUDINARY_UPLOAD_PRESET = "empowerher";

async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; fileType: string; fileName: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
        resolve({ url: res.secure_url, fileType: isImage ? "image" : "document", fileName: file.name });
      } else reject(new Error("Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload error"));
    xhr.send(formData);
  });
}

function relativeTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayNote {
  id: number;
  date: string;
  title: string;
  body: string;
  reminder: string;
  founder: string;
  tag: string;
  pinned: boolean;
  done: boolean;
  color: "purple" | "pink" | "yellow" | "mint";
}

interface Founder {
  id: string;
  name: string;
  startup: string;
  industry: string;
  stage: string;
  growth: string;
  available: boolean;
  initials: string;
  accent: string;
  bg: string;
}

interface Meeting {
  id: number;
  founderName: string;
  startup: string;
  initials: string;
  accent: string;
  bg: string;
  date: string;
  time: string;
  type: string;
  mode: string;
  status: "scheduled" | "upcoming";
  jitsiLink?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingType?: string;
  founderId?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  fileURL?: string;
  fileType?: string;
  fileName?: string;
  createdAt: any;
  type?: string;
  meetingLink?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingType?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FOUNDERS: Founder[] = [];

const INITIAL_MEETINGS: Meeting[] = [];

const INITIAL_NOTES: DayNote[] = [
  {
    id: 1, date: "2026-05-20", title: "Follow up with Lumina AI",
    body: "Review their Q2 ARR deck before the pitch call.",
    reminder: "9:00 AM", founder: "Sara Chen", tag: "Pitch", pinned: true, done: false, color: "purple",
  },
  {
    id: 2, date: "2026-05-22", title: "HealthEdge funding prep",
    body: "Check Series B comps. Prepare term sheet questions.",
    reminder: "1:00 PM", founder: "Olu Adeyemi", tag: "Funding", pinned: false, done: false, color: "pink",
  },
  {
    id: 3, date: "2026-05-28", title: "GreenFlow intro call",
    body: "First meeting — keep it casual, understand their roadmap.",
    reminder: "", founder: "Raj Patel", tag: "Networking", pinned: false, done: false, color: "yellow",
  },
];

const NOTE_COLORS: Record<DayNote["color"], { bg: string; border: string; dot: string; text: string }> = {
  purple: { bg: "#f5f0ff", border: "#d8b4fe", dot: "#9333ea", text: "#6b21a8" },
  pink:   { bg: "#fdf0f7", border: "#f9a8d4", dot: "#db2777", text: "#9d174d" },
  yellow: { bg: "#fffbeb", border: "#fde68a", dot: "#d97706", text: "#92400e" },
  mint:   { bg: "#f0fdf4", border: "#a7f3d0", dot: "#059669", text: "#065f46" },
};

const TAGS = ["Pitch", "Funding", "Networking", "Follow-up", "Demo", "Research"];
const MEETING_TYPES = [
  { label: "Pitch Discussion",  icon: <Zap size={14} /> },
  { label: "Funding Discussion", icon: <DollarSign size={14} /> },
  { label: "Networking Call",   icon: <Users size={14} /> },
  { label: "Product Demo",      icon: <Monitor size={14} /> },
];
const TIME_SLOTS = ["9:00 AM", "10:30 AM", "1:00 PM", "4:30 PM", "6:00 PM"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ initials, accent, bg, size = 38 }: { initials: string; accent: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, border: `1.5px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.31, fontWeight: 700, color: accent, flexShrink: 0, letterSpacing: "0.02em" }}>
      {initials}
    </div>
  );
}

// ─── Founder Chat Popup ───────────────────────────────────────────────────────

function FounderChatPopup({
  meeting,
  currentUserId,
  currentUserName,
  onClose,
}: {
  meeting: Meeting;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}) {
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [minimized,  setMinimized]  = useState(false);
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const emojiRef  = useRef<HTMLDivElement>(null);

  // Chat room shared between investor and founder (same sorted key used in MeetingsPage)
  const chatId = meeting.founderId
    ? [currentUserId, meeting.founderId].sort().join("_")
    : null;

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!minimized)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [messages, minimized]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node))
        setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sendMessage = async (extraPayload?: Partial<ChatMessage>) => {
    const text = input.trim();
    if (!text && !extraPayload?.fileURL) return;
    if (sending || !chatId) return;
    setSending(true);
    setInput("");
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text:       text || "",
        senderId:   currentUserId,
        senderName: currentUserName,
        fileURL:    extraPayload?.fileURL  || null,
        fileType:   extraPayload?.fileType || null,
        fileName:   extraPayload?.fileName || null,
        createdAt:  serverTimestamp(),
      });
    } catch (e) {
      console.error("Send failed:", e);
    }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((p) => p + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      setUploadPct(0);
      const { url, fileType, fileName } = await uploadToCloudinary(file, (pct) => setUploadPct(pct));
      setUploadPct(null);
      await sendMessage({ fileURL: url, fileType, fileName });
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadPct(null);
      alert("File upload failed. Check your Cloudinary config.");
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 400,
        height: minimized ? "auto" : 520,
        background: "#fff",
        border: "1.5px solid #e9d5ff",
        boxShadow: "0 24px 80px rgba(147,51,234,0.22), 0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header — full profile */}
      <div
        className="flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
      >
        {/* Top bar: close + minimize */}
        <div className="flex items-center justify-end gap-1 px-3 pt-2">
          <button
            onClick={() => setMinimized((p) => !p)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", color: "#fff" }}
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", color: "#fff" }}
            title="Close"
          >
            <X size={13} />
          </button>
        </div>

        {/* Profile section */}
        <div className="px-4 pb-4 flex items-center gap-3">
          {/* Large avatar */}
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(255,255,255,0.22)",
              border: "2.5px solid rgba(255,255,255,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: "#fff",
              flexShrink: 0, letterSpacing: "0.02em",
            }}
          >
            {meeting.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-white leading-tight truncate">{meeting.founderName}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.82)" }}>{meeting.startup}</p>
            {(meeting.meetingDate || meeting.date) ? (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
                >
                  📅 {meeting.meetingDate || meeting.date}
                </span>
                {(meeting.meetingTime || meeting.time) && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
                  >
                    🕐 {meeting.meetingTime || meeting.time}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ background: "#f9f5ff" }}>
            {!chatId && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "#f3e8ff" }}>
                  <MessageSquare size={20} style={{ color: "#9333ea" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#6b21a8" }}>No founder linked yet</p>
                <p className="text-xs mt-1" style={{ color: "#c084fc" }}>Founder ID not available for this meeting</p>
              </div>
            )}

            {chatId && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "#f3e8ff" }}>
                  <MessageSquare size={20} style={{ color: "#9333ea" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#6b21a8" }}>Start the conversation!</p>
                <p className="text-xs mt-1" style={{ color: "#c084fc" }}>Say hello to {meeting.founderName}</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMe && (
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mb-1"
                      style={{ background: meeting.accent, flexShrink: 0 }}
                    >
                      {meeting.initials?.[0] || "F"}
                    </div>
                  )}

                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {/* File attachment */}
                    {msg.fileURL && (
                      <a
                        href={msg.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
                        style={{
                          background: isMe ? "#f3e8ff" : "#fff",
                          border: `1px solid ${isMe ? "#d8b4fe" : "#e9d5ff"}`,
                          color: isMe ? "#7c3aed" : "#4c1d95",
                          textDecoration: "none",
                        }}
                      >
                        {msg.fileType === "image"
                          ? <ImageIcon size={12} style={{ flexShrink: 0 }} />
                          : <FileText size={12} style={{ flexShrink: 0 }} />
                        }
                        <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {msg.fileName || "Attachment"}
                        </span>
                      </a>
                    )}

                    {/* Meeting card */}
                    {msg.type === "meeting" ? (
                      <div
                        className="rounded-2xl p-3 text-sm"
                        style={{ background: "#faf5ff", border: "1px solid #e9d5ff", maxWidth: 260 }}
                      >
                        <p className="font-bold" style={{ color: "#7c3aed" }}>📅 Meeting Scheduled</p>
                        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{msg.meetingType}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{msg.meetingDate} • {msg.meetingTime}</p>
                        {msg.meetingLink && (
                          <button
                            onClick={() => window.open(String(msg.meetingLink))}
                            className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                            style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", border: "none", cursor: "pointer" }}
                          >
                            Join Meeting
                          </button>
                        )}
                      </div>
                    ) : msg.text ? (
                      <div
                        className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: isMe ? "linear-gradient(135deg, #9333ea, #db2777)" : "#fff",
                          color: isMe ? "#fff" : "#1e1b4b",
                          border: isMe ? "none" : "1px solid #e9d5ff",
                          borderBottomRightRadius: isMe ? 4 : undefined,
                          borderBottomLeftRadius: !isMe ? 4 : undefined,
                          boxShadow: isMe ? "0 2px 12px rgba(147,51,234,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.text}
                      </div>
                    ) : null}

                    <p className="text-xs mt-1" style={{ color: "#c084fc" }}>
                      {relativeTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            {uploadPct !== null && (
              <div className="flex justify-end">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                  style={{ background: "#f3e8ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  Uploading… {uploadPct}%
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: "1px solid #f3e8ff", background: "#fff" }}>
            {showEmoji && (
              <div ref={emojiRef} className="absolute z-50" style={{ bottom: 72, right: 12 }}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  height={360}
                  width={300}
                  searchDisabled={false}
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Emoji */}
              <button
                type="button"
                onClick={() => setShowEmoji((p) => !p)}
                className="p-2 rounded-xl transition-colors"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c084fc" }}
                title="Emoji"
              >
                <Smile size={18} />
              </button>

              {/* File attach */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-xl transition-colors"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c084fc" }}
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={handleFileChange}
              />

              {/* Text input */}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Message ${meeting.founderName?.split(" ")[0]}…`}
                className="flex-1 text-sm px-4 py-2.5 rounded-full outline-none"
                style={{
                  background: "#faf5ff",
                  border: "1.5px solid #e9d5ff",
                  color: "#4c1d95",
                  fontFamily: "inherit",
                }}
              />

              {/* Send */}
              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && uploadPct !== null) || sending}
                className="p-2.5 rounded-full flex-shrink-0"
                style={{
                  background: input.trim() ? "linear-gradient(135deg, #9333ea, #db2777)" : "#f3e8ff",
                  border: "none",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  color: input.trim() ? "#fff" : "#c084fc",
                  boxShadow: input.trim() ? "0 4px 16px rgba(147,51,234,0.3)" : undefined,
                  transition: "all 0.2s",
                }}
                title="Send"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Day Note Popup ───────────────────────────────────────────────────────────

function DayNoteModal({
  date, notes, founders, onClose, onSave, onToggleDone, onTogglePin, onDelete,
}: {
  date: Date; notes: DayNote[]; founders: Founder[];
  onClose: () => void;
  onSave: (n: Omit<DayNote, "id">) => void;
  onToggleDone: (id: number) => void;
  onTogglePin: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reminder, setReminder] = useState("");
  const [founder, setFounder] = useState("");
  const [tag, setTag] = useState("Follow-up");
  const [color, setColor] = useState<DayNote["color"]>("purple");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ date: format(date, "yyyy-MM-dd"), title, body, reminder, founder, tag, pinned: false, done: false, color });
    setTitle(""); setBody(""); setReminder(""); setFounder(""); setTag("Follow-up"); setColor("purple");
  };

  const dayNotes = [...notes.filter((n) => n.pinned), ...notes.filter((n) => !n.pinned)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(139,92,246,0.08)", backdropFilter: "blur(12px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid #e9d5ff", boxShadow: "0 24px 80px rgba(139,92,246,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(135deg, #faf5ff, #fdf0f7)", borderBottom: "1px solid #f3e8ff" }}>
          <div>
            <p className="font-bold text-base" style={{ color: "#6b21a8" }}>{format(date, "EEEE, MMMM d")}</p>
            <p className="text-xs mt-0.5" style={{ color: "#a855f7" }}>{dayNotes.length} note{dayNotes.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#f3e8ff", border: "none", cursor: "pointer", color: "#9333ea" }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {dayNotes.length > 0 && (
            <div className="space-y-2">
              {dayNotes.map((n) => {
                const c = NOTE_COLORS[n.color];
                return (
                  <div key={n.id} className="rounded-2xl p-3.5 relative transition-all" style={{ background: c.bg, border: `1px solid ${c.border}`, opacity: n.done ? 0.55 : 1 }}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {n.pinned && <Pin size={11} style={{ color: c.dot, flexShrink: 0 }} />}
                          <p className={`text-sm font-semibold ${n.done ? "line-through" : ""}`} style={{ color: c.text }}>{n.title}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${c.dot}18`, color: c.dot }}>{n.tag}</span>
                        </div>
                        {n.body && <p className="text-xs mb-1.5" style={{ color: `${c.text}99` }}>{n.body}</p>}
                        <div className="flex items-center gap-3 flex-wrap">
                          {n.reminder && <span className="flex items-center gap-1 text-xs" style={{ color: c.dot }}><Bell size={10} />{n.reminder}</span>}
                          {n.founder && <span className="flex items-center gap-1 text-xs" style={{ color: `${c.text}88` }}><Users size={10} />{n.founder}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => onTogglePin(n.id)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: n.pinned ? c.dot : "transparent", border: `1px solid ${c.border}`, cursor: "pointer" }}>
                          <Pin size={10} style={{ color: n.pinned ? "#fff" : c.dot }} />
                        </button>
                        <button onClick={() => onToggleDone(n.id)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: n.done ? "#bbf7d0" : "transparent", border: `1px solid ${n.done ? "#86efac" : c.border}`, cursor: "pointer" }}>
                          <Check size={10} style={{ color: n.done ? "#16a34a" : c.dot }} />
                        </button>
                        <button onClick={() => onDelete(n.id)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "transparent", border: `1px solid ${c.border}`, cursor: "pointer" }}>
                          <X size={10} style={{ color: c.dot }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: "#f3e8ff" }} />
            <span className="text-xs font-medium px-2" style={{ color: "#c084fc" }}>Add new note</span>
            <div className="flex-1 h-px" style={{ background: "#f3e8ff" }} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: "#a855f7" }}>Color</span>
              {(Object.keys(NOTE_COLORS) as DayNote["color"][]).map((c) => (
                <button key={c} onClick={() => setColor(c)} className="w-5 h-5 rounded-full transition-transform hover:scale-110" style={{ background: NOTE_COLORS[c].dot, border: color === c ? "2px solid #6b21a8" : "2px solid transparent", outline: color === c ? "2px solid #f3e8ff" : "none", cursor: "pointer" }} />
              ))}
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: "#4c1d95", fontFamily: "inherit" }} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add details…" rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: "#4c1d95", fontFamily: "inherit" }} />
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Bell size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#c084fc" }} />
                <input value={reminder} onChange={(e) => setReminder(e.target.value)} placeholder="Reminder time" className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: "#4c1d95", fontFamily: "inherit" }} />
              </div>
              <select value={founder} onChange={(e) => setFounder(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs outline-none" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: founder ? "#4c1d95" : "#c084fc", fontFamily: "inherit", cursor: "pointer" }}>
                <option value="">Select founder</option>
                {founders.map((f) => <option key={f.id} value={f.name}>{f.name} — {f.startup}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <button key={t} onClick={() => setTag(t)} className="px-2.5 py-1 rounded-full text-xs font-medium transition-all" style={{ background: tag === t ? "#9333ea" : "#f3e8ff", color: tag === t ? "#fff" : "#9333ea", border: "none", cursor: "pointer" }}>{t}</button>
              ))}
            </div>
            <button onClick={handleSave} disabled={!title.trim()} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: title.trim() ? "linear-gradient(135deg, #9333ea, #db2777)" : "#f3e8ff", color: title.trim() ? "#fff" : "#c084fc", border: "none", cursor: title.trim() ? "pointer" : "not-allowed", boxShadow: title.trim() ? "0 4px 18px rgba(147,51,234,0.28)" : undefined }}>
              <StickyNote size={14} className="inline mr-1.5" style={{ verticalAlign: "-2px" }} />Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────

function ScheduleModal({ founder, onClose, onConfirm }: { founder: Founder; onClose: () => void; onConfirm: (d: { type: string; date: string; time: string; mode: string; note: string }) => void }) {
  const [mType, setMType] = useState("Pitch Discussion");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<"Video Call" | "In Person">("Video Call");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(147,51,234,0.07)", backdropFilter: "blur(14px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.98)", border: "1px solid #e9d5ff", boxShadow: "0 24px 80px rgba(147,51,234,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="px-6 py-5 relative" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #fdf0f7 100%)", borderBottom: "1px solid #f3e8ff" }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#f3e8ff", border: "none", cursor: "pointer", color: "#9333ea" }}>
            <X size={14} />
          </button>
          <div className="flex items-center gap-3">
            <Avatar initials={founder.initials} accent={founder.accent} bg={founder.bg} size={48} />
            <div>
              <p className="font-bold text-base" style={{ color: "#4c1d95" }}>{founder.name}</p>
              <p className="text-sm" style={{ color: founder.accent }}>{founder.startup}</p>
            </div>
            <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${founder.accent}15`, color: founder.accent, border: `1px solid ${founder.accent}30` }}>
              {founder.stage}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold mb-2.5" style={{ color: "#a855f7" }}>Meeting type</p>
            <div className="grid grid-cols-2 gap-2">
              {MEETING_TYPES.map((t) => (
                <button key={t.label} onClick={() => setMType(t.label)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all" style={{ background: mType === t.label ? "#faf5ff" : "#fefefe", border: `1.5px solid ${mType === t.label ? "#c084fc" : "#f3e8ff"}`, color: mType === t.label ? "#7c3aed" : "#a0aec0", cursor: "pointer" }}>
                  <span style={{ color: mType === t.label ? "#9333ea" : "#d8b4fe" }}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#a855f7" }}>Select date</p>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#faf5ff", border: "1.5px solid #e9d5ff", color: date ? "#4c1d95" : "#c084fc", fontFamily: "inherit", colorScheme: "light" }} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#a855f7" }}>Time slot</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((t) => (
                <button key={t} onClick={() => setTime(t)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: time === t ? "linear-gradient(135deg, #9333ea, #db2777)" : "#faf5ff", border: `1.5px solid ${time === t ? "transparent" : "#e9d5ff"}`, color: time === t ? "#fff" : "#9333ea", cursor: "pointer", boxShadow: time === t ? "0 0 16px rgba(147,51,234,0.3)" : undefined }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#a855f7" }}>Meeting mode</p>
            <div className="grid grid-cols-2 gap-2">
              {(["Video Call", "In Person"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all" style={{ background: mode === m ? "#faf5ff" : "#fefefe", border: `1.5px solid ${mode === m ? "#c084fc" : "#f3e8ff"}`, color: mode === m ? "#7c3aed" : "#c4b5fd", cursor: "pointer" }}>
                  {m === "Video Call" ? <Video size={18} style={{ color: mode === m ? "#9333ea" : "#e9d5ff" }} /> : <MapPin size={18} style={{ color: mode === m ? "#9333ea" : "#e9d5ff" }} />}
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#a855f7" }}>Notes (optional)</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add meeting agenda…" rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: "#faf5ff", border: "1.5px solid #e9d5ff", color: "#4c1d95", fontFamily: "inherit" }} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => date && time && onConfirm({ type: mType, date, time, mode, note })} disabled={!date || !time} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all" style={{ background: date && time ? "linear-gradient(135deg, #9333ea, #db2777)" : "#f3e8ff", color: date && time ? "#fff" : "#c084fc", border: "none", cursor: date && time ? "pointer" : "not-allowed", boxShadow: date && time ? "0 4px 20px rgba(147,51,234,0.3)" : undefined }}>
              <Sparkles size={15} /> Schedule Meeting
            </button>
            <button onClick={onClose} className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#faf5ff", border: "1.5px solid #e9d5ff", color: "#9333ea", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Founder Card ─────────────────────────────────────────────────────────────

function FounderCard({
  founder,
  scheduled,
  onSchedule,
  onChat,
}: {
  founder: Founder;
  scheduled?: Meeting;
  onSchedule: () => void;
  onChat: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "#fff",
        border: `1.5px solid ${scheduled ? "#bbf7d0" : "#f3e8ff"}`,
        boxShadow: scheduled
          ? "0 4px 20px rgba(34,197,94,0.1)"
          : "0 4px 20px rgba(147,51,234,0.07)",
      }}
    >
      {/* Top row: status + growth */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: founder.available ? "#f0fdf4" : "#f9fafb",
            color: founder.available ? "#16a34a" : "#9ca3af",
            border: `1px solid ${founder.available ? "#bbf7d0" : "#e5e7eb"}`,
          }}
        >
          {founder.available ? "● Available" : "○ Busy"}
        </span>
        <div className="flex items-center gap-1" style={{ color: "#16a34a" }}>
          <TrendingUp size={12} />
          <span className="text-xs font-bold">{founder.growth}</span>
        </div>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar initials={founder.initials} accent={founder.accent} bg={founder.bg} size={44} />
        <div>
          <p className="font-bold text-sm" style={{ color: "#1e1b4b" }}>{founder.name}</p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: founder.accent }}>{founder.startup}</p>
        </div>
      </div>

      {/* Tags row + inline Chat button */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}
        >
          {founder.industry}
        </span>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: "#fdf0f7", color: "#db2777", border: "1px solid #fbcfe8" }}
        >
          {founder.stage}
        </span>

        {/* Chat button — inline next to tags */}
        <button
          onClick={onChat}
          className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #9333ea18, #db277718)",
            color: "#9333ea",
            border: "1.5px solid #e9d5ff",
            cursor: "pointer",
            marginLeft: "auto",
          }}
          title={`Chat with ${founder.name}`}
        >
          <MessageSquare size={11} />
          Chat
        </button>
      </div>

      {/* Bottom: scheduled badge or schedule button */}
      {scheduled ? (
        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold" style={{ color: "#15803d" }}>Meeting Scheduled</p>
            <p className="text-xs truncate" style={{ color: "#16a34a99" }}>
              {scheduled.meetingDate || scheduled.date} · {scheduled.meetingTime || scheduled.time}
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={onSchedule}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${founder.accent}dd, ${founder.accent}99)`,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: `0 4px 16px ${founder.accent}28`,
          }}
        >
          Schedule Meeting
        </button>
      )}
    </div>
  );
}

// ─── Meeting Row ──────────────────────────────────────────────────────────────

function MeetingRow({ meeting }: { meeting: Meeting }) {
    return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
      style={{
        background: meeting.status === "scheduled" ? "#f0fdf4" : "#faf5ff",
        border: `1.5px solid ${meeting.status === "scheduled" ? "#bbf7d0" : "#e9d5ff"}`,
      }}
    >
      <Avatar initials={meeting.initials} accent={meeting.accent} bg={meeting.bg} size={36} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "#1e1b4b" }}>{meeting.startup}</p>
        <p className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>
          {meeting.meetingDate || meeting.date} · {meeting.meetingTime || meeting.time}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Chat button */}
        

        {/* Join button */}
        <button
          onClick={() => meeting.jitsiLink && window.open(meeting.jitsiLink)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #9333ea, #db2777)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Video size={12} />
          Join
        </button>
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function CalendarWidget({ notes, meetings, onDayClick }: { notes: DayNote[]; meetings: Meeting[]; onDayClick: (d: Date) => void }) {
  const [current, setCurrent] = useState(new Date(2026, 4, 1));
  const [hovered, setHovered] = useState<Date | null>(null);
  const monthStart = startOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(current) });
  const pad = monthStart.getDay();

  const noteDates = notes.map((n) => parseISO(n.date));
  const meetingDates = meetings.filter((m) => m?.meetingDate).map((m) => parseISO(m.meetingDate!));
  const notesForDay = (d: Date) => notes.filter((n) => isSameDay(parseISO(n.date), d));

  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 24px rgba(147,51,234,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-sm" style={{ color: "#4c1d95" }}>{format(current, "MMMM yyyy")}</span>
        <div className="flex gap-1">
          {[{ fn: -1, icon: <ChevronLeft size={13} /> }, { fn: 1, icon: <ChevronRight size={13} /> }].map(({ fn, icon }) => (
            <button key={fn} onClick={() => setCurrent(fn === -1 ? subMonths(current, 1) : addMonths(current, 1))} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", cursor: "pointer", color: "#9333ea" }}>{icon}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: "#c084fc" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 relative">
        {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
        {days.map((day) => {
          const hasNote = noteDates.some((d) => isSameDay(d, day));
          const hasMtg = meetingDates.some((d) => isSameDay(d, day));
          const today = isToday(day);
          const inMonth = isSameMonth(day, current);
          const dayNotes = notesForDay(day);
          const isHovered = hovered && isSameDay(day, hovered);

          return (
            <div key={day.toString()} className="relative">
              <button
                onClick={() => onDayClick(day)}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                className="w-full aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150 relative"
                style={{ color: today ? "#fff" : inMonth ? "#4c1d95" : "#d8b4fe", background: today ? "linear-gradient(135deg, #9333ea, #db2777)" : isHovered ? "#faf5ff" : "transparent", border: today ? "none" : isHovered ? "1.5px solid #e9d5ff" : "1.5px solid transparent", boxShadow: today ? "0 0 16px rgba(147,51,234,0.4)" : undefined, cursor: "pointer" }}
              >
                {format(day, "d")}
                {(hasNote || hasMtg) && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {hasNote && <span className="w-1 h-1 rounded-full" style={{ background: today ? "rgba(255,255,255,0.8)" : "#9333ea" }} />}
                    {hasMtg && <span className="w-1 h-1 rounded-full" style={{ background: today ? "rgba(255,255,255,0.8)" : "#db2777" }} />}
                  </div>
                )}
              </button>
              {isHovered && dayNotes.length > 0 && (
                <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl p-2.5 text-xs pointer-events-none" style={{ background: "#fff", border: "1px solid #e9d5ff", boxShadow: "0 8px 30px rgba(147,51,234,0.15)" }}>
                  {dayNotes.slice(0, 2).map((n) => (
                    <div key={n.id} className="flex items-center gap-1.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: NOTE_COLORS[n.color].dot }} />
                      <span className="truncate" style={{ color: "#4c1d95" }}>{n.title}</span>
                    </div>
                  ))}
                  {dayNotes.length > 2 && <p className="mt-0.5" style={{ color: "#c084fc" }}>+{dayNotes.length - 2} more</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ visible, msg }: { visible: boolean; msg: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-500" style={{ background: "linear-gradient(135deg, #faf5ff, #fdf0f7)", border: "1.5px solid #e9d5ff", color: "#7c3aed", boxShadow: "0 8px 40px rgba(147,51,234,0.2)", opacity: visible ? 1 : 0, transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`, pointerEvents: "none" }}>
      <Sparkles size={14} style={{ color: "#db2777" }} /> {msg}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [founders, setFounders] = useState<Founder[]>([]);

  // Unified chat target — can come from a founder card OR a meeting row
  const [activeChat, setActiveChat] = useState<{
    founderId: string;
    founderName: string;
    startup: string;
    initials: string;
    accent: string;
    bg: string;
    meetingDate?: string;
    meetingTime?: string;
    meetingType?: string;
    jitsiLink?: string;
  } | null>(null);

  const openChatForFounder = (f: Founder) => {
    setActiveChat({
      founderId: f.id,
      founderName: f.name,
      startup: f.startup,
      initials: f.initials,
      accent: f.accent,
      bg: f.bg,
    });
  };

  const openChatForMeeting = (m: Meeting) => {
    setActiveChat({
      founderId: m.founderId || "",
      founderName: m.founderName,
      startup: m.startup,
      initials: m.initials,
      accent: m.accent,
      bg: m.bg,
      meetingDate: m.meetingDate || m.date,
      meetingTime: m.meetingTime || m.time,
      meetingType: m.meetingType || m.type,
      jitsiLink: m.jitsiLink,
    });
  };

 useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "fundingRequests"),
    where("investorId", "==", user.uid),
    where("status", "==", "Connected")
  );

  const unsub = onSnapshot(q, (snap) => {
    const seen = new Set<string>();
    const data: Founder[] = [];

    snap.docs.forEach((doc) => {
      const d = doc.data();
      if (seen.has(d.founderId)) return;
      seen.add(d.founderId);
      data.push({
        id:        d.founderId,
        name:      d.founderName  || "Founder",
        startup:   d.startupName  || "",
        industry:  d.industry     || "",
        stage:     d.startupStage || "",
        growth:    "",
        available: true,
        initials:  (d.founderName || "F").split(" ").map((n: string) => n[0]).join(""),
        accent:    "#9333ea",
        bg:        "#f5f0ff",
      });
    });

    setFounders(data);
  });

  return () => unsub();
}, []);

useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const q1 = query(
      collection(db, "fundingRequests"),
      where("investorId", "==", user.uid),
      where("status", "==", "Connected")
    );

    const unsubFounders = onSnapshot(q1, (snap) => {
      const seen = new Set<string>();
      const data: Founder[] = [];
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (seen.has(d.founderId)) return;
        seen.add(d.founderId);
        data.push({
          id:        d.founderId,
          name:      d.founderName  || "Founder",
          startup:   d.startupName  || "",
          industry:  d.industry     || "",
          stage:     d.startupStage || "",
          growth:    "",
          available: true,
          initials:  (d.founderName || "F").split(" ").map((n: string) => n[0]).join(""),
          accent:    "#9333ea",
          bg:        "#f5f0ff",
        });
      });
      setFounders(data);
    });
const q2 = query(
  collection(db, "meetings"),
  where("investorId", "==", user.uid)
);

const unsubMeetings = onSnapshot(
  q2,
  (snap) => {
    const all: any[] = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((m: any) => m.startup && m.founderName)
      .sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta; // newest first
      });

    // Keep only the latest meeting per founder
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const m of all) {
      const key = m.founderId || m.founderName;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(m);
    }

    setMeetings(deduped as unknown as Meeting[]);
  },
  (err) => {
    console.error("Meetings listener failed:", err);
  }
);

    return () => {
      unsubFounders();
      unsubMeetings();
    };
  });

  return () => unsubAuth();
}, []);

  const [notes, setNotes] = useState<DayNote[]>(INITIAL_NOTES);
  const [noteDay, setNoteDay] = useState<Date | null>(null);
  const [scheduleFounder, setScheduleFounder] = useState<Founder | null>(null);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  const handleSaveNote = (n: Omit<DayNote, "id">) => {
    setNotes((prev) => [...prev, { ...n, id: Date.now() }]);
    showToast("Note saved ✨");
  };

  const handleConfirmMeeting = async (data: { type: string; date: string; time: string; mode: string; note: string }) => {
    if (!scheduleFounder || !auth.currentUser) return;

    const roomName = `empowerher-${Date.now()}`;
    const meetingLink = `https://meet.jit.si/${roomName}`;

    const meetingData = {
     founderId: scheduleFounder.id,
  founderName: scheduleFounder.name,
  investorId: auth.currentUser.uid,
  investorName: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Investor",
  investorEmail: auth.currentUser.email || "",
  investorPhoto: auth.currentUser.photoURL || "",
  organization: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "",
      startup: scheduleFounder.startup,
      initials: scheduleFounder.initials,
      accent: scheduleFounder.accent,
      bg: scheduleFounder.bg,
      meetingDate: data.date,
      meetingTime: data.time,
      meetingType: data.type,
      mode: data.mode,
      note: data.note,
      jitsiLink: meetingLink,
      status: "scheduled",
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "meetings"), meetingData);

    const chatId = [auth.currentUser.uid, scheduleFounder.id].sort().join("_");
    await addDoc(collection(db, "chats", chatId, "messages"), {
      type: "meeting",
      text: "📅 Meeting Scheduled",
      meetingDate: data.date,
      meetingTime: data.time,
      meetingType: data.type,
      meetingLink,
      senderId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    setScheduleFounder(null);
    showToast("Meeting scheduled! 🎉");
  };

  const scheduledForFounder = (f: Founder) =>
  meetings.find((m) => m.status === "scheduled" && (m.founderId === f.id || m.founderName === f.name));

  const currentUser = auth.currentUser;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(145deg, #faf5ff 0%, #fdf0f7 40%, #f0f4ff 100%)", fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(216,180,254,0.2) 0%, transparent 70%)", top: -80, left: -80 }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,168,212,0.15) 0%, transparent 70%)", bottom: 0, right: 0 }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-8" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold tracking-tight" style={{ fontSize: 26, color: "#1e1b4b" }}>Connect &amp; Schedule Meetings</h1>
            <p className="text-sm mt-1.5" style={{ color: "#a78bfa" }}>Schedule discussions with founders, investors, and mentors.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="space-y-5">
            <CalendarWidget notes={notes} meetings={meetings} onDayClick={setNoteDay} />

            {/* Notes preview */}
            {notes.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote size={14} style={{ color: "#c084fc" }} />
                  <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>Recent notes</span>
                </div>
                <div className="space-y-2">
                  {notes.filter((n) => !n.done).slice(0, 3).map((n) => {
                    const c = NOTE_COLORS[n.color];
                    return (
                      <div key={n.id} className="rounded-xl p-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <div className="flex items-center gap-1.5">
                          {n.pinned && <Pin size={10} style={{ color: c.dot }} />}
                          <p className="text-xs font-semibold truncate" style={{ color: c.text }}>{n.title}</p>
                          <span className="text-xs ml-auto px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: `${c.dot}18`, color: c.dot }}>{n.tag}</span>
                        </div>
                        {n.reminder && (
                          <div className="flex items-center gap-1 mt-1">
                            <Bell size={9} style={{ color: c.dot }} />
                            <span className="text-xs" style={{ color: `${c.text}88` }}>{n.reminder}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meetings list */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} style={{ color: "#c084fc" }} />
                <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>Meetings</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff" }}>{meetings.length}</span>
              </div>
              <div className="space-y-2">
                {meetings.length ? (
                  meetings.map((m) => (
                  <MeetingRow key={m.id} meeting={m} />
                  ))
                ) : (
                  <p className="text-xs text-center py-4" style={{ color: "#c084fc" }}>No meetings yet — schedule one!</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Total",     v: meetings.length,                                          c: "#9333ea", bg: "#faf5ff" },
                { l: "Scheduled", v: meetings.filter((m) => m.status === "scheduled").length,  c: "#16a34a", bg: "#f0fdf4" },
                { l: "Notes",     v: notes.length,                                             c: "#db2777", bg: "#fdf0f7" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <p className="text-lg font-extrabold" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: `${s.c}99` }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Founder cards */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: "#4c1d95" }}>
                <Users size={14} className="inline mr-1.5" style={{ color: "#a78bfa", verticalAlign: "-2px" }} />
                Founders &amp; Startups
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "#9333ea" }} />
                <span className="text-xs" style={{ color: "#a78bfa" }}>calendar notes</span>
                <span className="w-2 h-2 rounded-full ml-1" style={{ background: "#db2777" }} />
                <span className="text-xs" style={{ color: "#a78bfa" }}>meetings</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {founders.map((f) => (
                <FounderCard
                  key={f.id}
                  founder={f}
                  scheduled={scheduledForFounder(f)}
                  onSchedule={() => setScheduleFounder(f)}
                  onChat={() => openChatForFounder(f)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {noteDay && (
        <DayNoteModal
          date={noteDay}
          notes={notes.filter((n) => isSameDay(parseISO(n.date), noteDay))}
          founders={founders}
          onClose={() => setNoteDay(null)}
          onSave={handleSaveNote}
          onToggleDone={(id) => setNotes((p) => p.map((n) => n.id === id ? { ...n, done: !n.done } : n))}
          onTogglePin={(id) => setNotes((p) => p.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n))}
          onDelete={(id) => setNotes((p) => p.filter((n) => n.id !== id))}
        />
      )}

      {scheduleFounder && (
        <ScheduleModal
          founder={scheduleFounder}
          onClose={() => setScheduleFounder(null)}
          onConfirm={handleConfirmMeeting}
        />
      )}

      {/* Founder Chat Popup — works from card OR meeting row */}
      {activeChat && currentUser && (
        <FounderChatPopup
          meeting={{
            id: 0,
            founderName: activeChat.founderName,
            startup: activeChat.startup,
            initials: activeChat.initials,
            accent: activeChat.accent,
            bg: activeChat.bg,
            founderId: activeChat.founderId,
            date: activeChat.meetingDate || "",
            time: activeChat.meetingTime || "",
            type: activeChat.meetingType || "",
            mode: "",
            status: "scheduled",
            jitsiLink: activeChat.jitsiLink,
            meetingDate: activeChat.meetingDate,
            meetingTime: activeChat.meetingTime,
            meetingType: activeChat.meetingType,
          }}
          currentUserId={currentUser.uid}
          currentUserName={currentUser.displayName || currentUser.email?.split("@")[0] || "Investor"}
          onClose={() => setActiveChat(null)}
        />
      )}

      <Toast visible={toast.show} msg={toast.msg} />
    </div>
  );
}