import { useState, useEffect, useRef, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChatPage } from "./ChatPage";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  Calendar, TrendingUp, Users, DollarSign, BookOpen,
  MessageSquare, Star, ArrowUpRight, Target, Clock,
  CheckCircle, AlertCircle, Loader2,
  Send, X, Link2, ChevronDown, ChevronUp, Paperclip, Smile,
  FileText, Image as ImageIcon, Sparkles, Zap, Video,
  Rocket, ChevronRight, Filter, LogOut,
  Eye, EyeOff,
} from "lucide-react";
import { db, auth } from "../../../../../firebase";
import {
  getDocs, collection, query, where, doc, getDoc, addDoc,
  onSnapshot, orderBy, serverTimestamp, setDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import logo from "../../../../../logo.png";

/* ─── Types ─── */
interface ConnectedMentor {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorPhoto: string;
  role: string;
  expertise: string;
  jitsiLink?: string;
  meetingDate?: string;
  meetingTime?: string;
  chatDocId: string; // always [founderUid, mentorUid].sort().join("_")
  _lastChatTime?: number;
}

interface Task { id: string; title: string; priority: "high"|"medium"|"low"; dueDate: string; }
interface Activity { id: string; type: string; message: string; time: string; }
interface JourneyStep { label: string; done: boolean; inProgress: boolean; }
interface ConnectedInvestor {
  id: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  investorPhoto: string;
  opportunityTitle: string;
  organization: string;
  jitsiLink?: string;
  meetingDate?: string;
  meetingTime?: string;
  _lastChatTime?: number;
}
interface ChatMessage {
  [x: string]: any;
  type: string;
  meetingLink: any;
  meetingTime: ReactNode;
  meetingDate: ReactNode;
  meetingType: ReactNode;
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  fileURL?: string;
  fileType?: string;
  fileName?: string;
  createdAt: any;
}

/* ─── Shared chat ID formula ─── */
// MUST match the formula used in Messages.tsx (mentor side)
function deriveChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

/* ─── Cloudinary config ─── */
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
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
        resolve({
          url: res.secure_url,
          fileType: isImage ? "image" : "document",
          fileName: file.name,
        });
      } else {
        reject(new Error("Cloudinary upload failed"));
      }
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
  if (mins < 60) return `${mins || 1} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) === 1 ? "" : "s"} ago`;
}

function ActivityDot({ type }: { type: string }) {
  const map: Record<string, { icon: any; color: string }> = {
    mentor:   { icon: Users,        color: "#9333ea" },
    funding:  { icon: DollarSign,   color: "#db2777" },
    training: { icon: BookOpen,     color: "#c026d3" },
    pitch:    { icon: MessageSquare,color: "#a855f7" },
  };
  const cfg = map[type] || map.pitch;
  const Icon = cfg.icon;
  return (
    <div className="relative flex-shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}14`, border: `1.5px solid ${cfg.color}33` }}>
        <Icon size={14} style={{ color: cfg.color }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   CHAT POPUP
   ════════════════════════════════════════ */
function ConnectionChatPopup({
  chatRoomId,
  name,
  subtitle,
  photoURL,
  meetingInfo,
  currentUserId,
  currentUserName,
  onClose,
}: {
  chatRoomId: string;
  name: string;
  subtitle: string;
  photoURL?: string;
  meetingInfo?: { date?: string; time?: string; link?: string } | null;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}) {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [input,        setInput]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [minimized,    setMinimized]    = useState(false);
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [uploadPct,    setUploadPct]    = useState<number | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const emojiRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen without orderBy to avoid missing-index errors; sort client-side
    const q = query(collection(db, "chats", chatRoomId, "messages"));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      msgs.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || a.timestamp?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || b.timestamp?.toMillis?.() || 0;
        return aTime - bTime;
      });
      setMessages(msgs);
    });
    return () => unsub();
  }, [chatRoomId]);

  useEffect(() => {
    if (!minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages, minimized]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sendMessage = async (extraPayload?: Partial<ChatMessage>) => {
    const text = input.trim();
    if (!text && !extraPayload?.fileURL) return;
    if (sending) return;
    setSending(true);
    setInput("");
    try {
      // Ensure the chat doc exists in Firestore before writing a message
      await setDoc(doc(db, "chats", chatRoomId), {
        founderId: currentUserId,
        founderName: currentUserName,
        lastMessage: text || extraPayload?.fileName || "📎 File",
        lastMessageTime: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, "chats", chatRoomId, "messages"), {
        text:       text || "",
        senderId:   currentUserId,
        senderName: currentUserName,
        sender:     "founder",           // so mentor side can identify direction
        fileURL:    extraPayload?.fileURL    || null,
        fileType:   extraPayload?.fileType   || null,
        fileName:   extraPayload?.fileName   || null,
        createdAt:  serverTimestamp(),
        timestamp:  serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to send message:", e);
    }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      setUploadPct(0);
      const { url, fileType, fileName } = await uploadToCloudinary(file, pct => setUploadPct(pct));
      setUploadPct(null);
      await sendMessage({ fileURL: url, fileType, fileName });
    } catch (err) {
      console.error("File upload failed:", err);
      setUploadPct(null);
      alert("File upload failed. Check your Cloudinary config.");
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl overflow-hidden"
      style={{ width: 400, height: minimized ? "auto" : 520, border: "1.5px solid #e9d5ff", boxShadow: "0 24px 80px rgba(147,51,234,0.22), 0 4px 20px rgba(0,0,0,0.06)" }}
    >
      <div className="flex-shrink-0" style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}>
        <div className="flex items-center justify-end gap-1 px-3 pt-2">
          <button onClick={() => setMinimized(p => !p)} className="p-1.5 rounded-lg transition-colors" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} title={minimized ? "Expand" : "Minimize"}>
            {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 pb-4 flex items-center gap-3">
          {photoURL
            ? <img src={photoURL} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-white/40 flex-shrink-0" />
            : <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-base flex-shrink-0 text-white border-2 border-white/40">{name?.[0] || "U"}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-white leading-tight truncate">{name}</p>
            <p className="text-xs mt-0.5 text-white/80 truncate">{subtitle}</p>
            {meetingInfo?.date && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>📅 {meetingInfo.date}</span>
                {meetingInfo.time && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>🕐 {meetingInfo.time}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ background: "#f9f5ff" }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "#f3e8ff" }}>
                  <MessageSquare className="w-6 h-6" style={{ color: "#9333ea" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#6b21a8" }}>Start the conversation!</p>
                <p className="text-xs mt-1" style={{ color: "#c084fc" }}>Say hello to {name?.split(" ")[0]}</p>
              </div>
            )}

            {messages.map(msg => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold mb-1" style={{ background: "#9333ea" }}>
                      {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : (name?.[0] || "U")}
                    </div>
                  )}
                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {msg.fileURL && (
                      <a href={msg.fileURL} target="_blank" rel="noopener noreferrer"
                        className="mb-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
                        style={{ background: isMe ? "#f3e8ff" : "#fff", border: `1px solid ${isMe ? "#d8b4fe" : "#e9d5ff"}`, color: isMe ? "#7c3aed" : "#4c1d95" }}>
                        {msg.fileType === "image" ? <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span className="truncate max-w-[150px]">{msg.fileName || "Attachment"}</span>
                      </a>
                    )}

                    {msg.type === "meeting" ? (
                      <div className="rounded-2xl p-3 text-sm" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", maxWidth: 260 }}>
                        <p className="font-bold" style={{ color: "#7c3aed" }}>📅 Meeting Scheduled</p>
                        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{msg.meetingType}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{msg.meetingDate} • {msg.meetingTime}</p>
                        {msg.meetingLink && (
                          <button onClick={() => window.open(String(msg.meetingLink))}
                            className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}>
                            Join Meeting
                          </button>
                        )}
                      </div>
                    ) : msg.text ? (
                      <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: isMe ? "linear-gradient(135deg, #9333ea, #db2777)" : "#fff",
                          color: isMe ? "#fff" : "#1e1b4b",
                          border: isMe ? "none" : "1px solid #e9d5ff",
                          boxShadow: isMe ? "0 2px 12px rgba(147,51,234,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
                          wordBreak: "break-word", whiteSpace: "pre-wrap",
                        }}>
                        {msg.text}
                      </div>
                    ) : null}

                    <p className="text-xs mt-1" style={{ color: "#c084fc" }}>{relativeTime(msg.createdAt || msg.timestamp)}</p>
                  </div>
                </div>
              );
            })}

            {uploadPct !== null && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "#f3e8ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading… {uploadPct}%
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: "1px solid #f3e8ff", background: "#fff" }}>
            {showEmoji && (
              <div ref={emojiRef} className="absolute z-50" style={{ bottom: 72, right: 12 }}>
                <EmojiPicker onEmojiClick={handleEmojiClick} height={360} width={300} searchDisabled={false} skinTonesDisabled previewConfig={{ showPreview: false }} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowEmoji(p => !p)} className="p-2 rounded-xl" style={{ color: "#c084fc" }} title="Emoji"><Smile className="w-[18px] h-[18px]" /></button>
              <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded-xl" style={{ color: "#c084fc" }} title="Attach file"><Paperclip className="w-[18px] h-[18px]" /></button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={handleFileChange} />
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={`Message ${name?.split(" ")[0]}…`}
                className="flex-1 text-sm px-4 py-2.5 rounded-full outline-none" style={{ background: "#faf5ff", border: "1.5px solid #e9d5ff", color: "#4c1d95" }} />
              <button onClick={() => sendMessage()} disabled={(!input.trim() && uploadPct !== null) || sending}
                className="p-2.5 rounded-full flex-shrink-0" style={{ background: input.trim() ? "linear-gradient(135deg, #9333ea, #db2777)" : "#f3e8ff", color: input.trim() ? "#fff" : "#c084fc" }} title="Send">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════
   DASHBOARD
   ════════════════ */
interface Props { onNavigate?: (view: string) => void; }

export function Dashboard({ onNavigate }: Props) {
  const [displayName,      setDisplayName]      = useState("there");
  const [photoURL,         setPhotoURL]         = useState("");
  const [authReady,        setAuthReady]        = useState(false);
  const [currentUserId,    setCurrentUserId]    = useState("");
  const [fundingCount,     setFundingCount]     = useState(0);
  const [fundingAmount,    setFundingAmount]    = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [pitchCount,       setPitchCount]       = useState(0);
  const [tasks,            setTasks]            = useState<Task[]>([]);
  const [activities,       setActivities]       = useState<Activity[]>([]);
  const [journey,          setJourney]          = useState<JourneyStep[]>([]);
  const [chatMentor, setChatMentor] = useState<{ id: string; name: string; avatar: string; role: string; chatDocId: string } | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [networkTab,       setNetworkTab]       = useState<"mentors"|"investors">("mentors");

  const [startupName,      setStartupName]      = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showContactModal,  setShowContactModal]  = useState(false);
  const [showIssueModal,    setShowIssueModal]    = useState(false);
  const [adminData,         setAdminData]         = useState<any>(null);

  const [oldPassword,     setOldPassword]     = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld,         setShowOld]         = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const [issueTitle,       setIssueTitle]       = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const [connectedMentors,   setConnectedMentors]   = useState<ConnectedMentor[]>([]);
  const [mentorsLoaded,      setMentorsLoaded]      = useState(false);
  const [connectedInvestors, setConnectedInvestors] = useState<ConnectedInvestor[]>([]);
  const [investorsLoaded,    setInvestorsLoaded]    = useState(false);
  const [activeInvestorChat, setActiveInvestorChat] = useState<ConnectedInvestor | null>(null);

  /* ── Extra profile info ── */
  useEffect(() => {
    const fetchFounderProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "founders", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.fullName) setDisplayName(data.fullName);
          setStartupName(data.startupName || "");
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      } catch (e) {
        console.error("founder profile fetch failed:", e);
      }
    };
    fetchFounderProfile();
  }, [authReady]);

  /* ── Admin contact details ── */
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const snap = await getDoc(doc(db, "admins", "mainAdmin"));
        if (snap.exists()) setAdminData(snap.data());
      } catch {}
    };
    fetchAdminData();
  }, []);

  /* ── Auth + initial data load ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setAuthReady(true); setLoading(false); return; }
      setCurrentUserId(user.uid);
      try {
        const snap = await getDoc(doc(db, "founders", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setDisplayName(d.displayName || d.firstName || d.name || user.email?.split("@")[0] || "there");
          setPhotoURL(d.photoURL || user.photoURL || "");
        } else {
          setDisplayName(user.displayName || user.email?.split("@")[0] || "there");
          setPhotoURL(user.photoURL || "");
        }
      } catch {}
      setAuthReady(true);
      const uid = user.uid;
      await Promise.all([fetchStats(uid), fetchTasks(uid), fetchActivities(uid)]);
      await fetchJourney(uid);
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Realtime: connected investors ── */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setInvestorsLoaded(true); return; }

    const reqQ = query(
      collection(db, "fundingRequests"),
      where("founderId", "==", user.uid),
      where("status", "==", "Connected")
    );

    const unsubReq = onSnapshot(reqQ, async (snap) => {
      const seen = new Set<string>();
      const base: ConnectedInvestor[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const investorId = data.investorId || "";
        if (!investorId || seen.has(investorId)) return;
        seen.add(investorId);
        base.push({
          id: d.id,
          investorId,
          investorName: data.investorName || "Investor",
          investorEmail: data.investorEmail || "",
          investorPhoto: data.investorPhoto || "",
          opportunityTitle: data.opportunityTitle || data.title || data.fundingTitle || "Funding Opportunity",
          organization: data.organization || data.investorEmail?.split("@")[0] || "",
        });
      });

      try {
        const mSnap = await getDocs(query(collection(db, "meetings"), where("founderId", "==", user.uid)));
        const meetingByInvestor: Record<string, any> = {};
        mSnap.forEach((d) => {
          const m = d.data();
          if (!m.investorId) return;
          const existing = meetingByInvestor[m.investorId];
          if (!existing || (m.createdAt?.toMillis?.() || 0) > (existing.createdAt?.toMillis?.() || 0)) {
            meetingByInvestor[m.investorId] = m;
          }
        });
        base.forEach((inv) => {
          const m = meetingByInvestor[inv.investorId];
          if (m) {
            inv.jitsiLink = m.jitsiLink || "";
            inv.meetingDate = m.meetingDate || "";
            inv.meetingTime = m.meetingTime || "";
            if (m.organization && !inv.organization) inv.organization = m.organization;
          }
        });
      } catch (e) {
        console.error("meetings enrichment failed:", e);
      }

      try {
        await Promise.all(base.map(async (inv) => {
          try {
            const iDoc = await getDoc(doc(db, "investors", inv.investorId));
            if (iDoc.exists()) {
              const data = iDoc.data();
              inv.investorPhoto = data.photoURL || inv.investorPhoto;
              inv.investorName = data.fullName || data.name || inv.investorName;
            }
          } catch {}
        }));
      } catch (e) {
        console.error("investor profile enrichment failed:", e);
      }

   try {
        await Promise.all(base.map(async (inv) => {
          try {
            const chatId = deriveChatId(user.uid, inv.investorId);
            const chatSnap = await getDoc(doc(db, "chats", chatId));
            if (chatSnap.exists()) {
              const chatData = chatSnap.data();
inv._lastChatTime = chatData.lastMessageTime?.toMillis?.() || 0;
            } else {
              inv._lastChatTime = 0;
            }
          } catch {
            inv._lastChatTime = 0;
          }
        }));
        base.sort((a, b) => (b._lastChatTime || 0) - (a._lastChatTime || 0));
      } catch (e) {
        console.error("investor chat sort failed:", e);
      }
// Create chat docs for investors (same as mentors)
      try {
        await Promise.all(base.map(async (inv) => {
          const chatId = deriveChatId(user.uid, inv.investorId);
          const chatRef = doc(db, "chats", chatId);
          await setDoc(chatRef, {
            founderId: user.uid,
            investorId: inv.investorId,
            investorName: inv.investorName,
            lastUpdated: serverTimestamp(),
          }, { merge: true });
        }));
      } catch (e) {
        console.error("investor chat doc creation failed:", e);
      }

     try {
        await Promise.all(base.map(async (inv) => {
          try {
            const chatId = deriveChatId(user.uid, inv.investorId);
            const msgsSnap = await getDocs(
              query(
                collection(db, "chats", chatId, "messages"),
                orderBy("createdAt", "desc"),
              )
            );
            if (!msgsSnap.empty) {
              const lastMsg = msgsSnap.docs[0].data();
              inv._lastChatTime = lastMsg.createdAt?.toMillis?.() || lastMsg.timestamp?.toMillis?.() || 0;
            } else {
              inv._lastChatTime = 0;
            }
          } catch {
            inv._lastChatTime = 0;
          }
        }));
        base.sort((a, b) => (b._lastChatTime || 0) - (a._lastChatTime || 0));
      } catch (e) {
        console.error("investor chat sort failed:", e);
      }

      setConnectedInvestors(base);
      setInvestorsLoaded(true);
    }, (err) => {
      console.error("fundingRequests listener error:", err);
      setInvestorsLoaded(true);
    });

    return () => unsubReq();
  }, [authReady, currentUserId]);

  /* ── Realtime: connected mentors ── */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setMentorsLoaded(true); return; }

    const sessQ = query(
      collection(db, "sessionRequests"),
      where("founderId", "==", user.uid),
      where("status", "==", "accepted")
    );

    const unsubSess = onSnapshot(sessQ, async (snap) => {
      const seen = new Set<string>();
      const base: ConnectedMentor[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const mentorId = data.mentorId || "";
        if (!mentorId || seen.has(mentorId)) return;
        seen.add(mentorId);

        // ── KEY FIX: derive chat ID the same way as mentor side ──
        const chatDocId = deriveChatId(user.uid, mentorId);

        base.push({
          id: d.id,
          mentorId,
          mentorName: data.mentorName || "Mentor",
          mentorPhoto: data.mentorPhoto || "",
          role: data.mentorRole || "",
          expertise: data.mentorExpertise || "",
          chatDocId, // always [founderUid, mentorUid].sort().join("_")
        });
      });

      // Pull live mentor profiles
      try {
        await Promise.all(base.map(async (mentor) => {
          try {
            const mDoc = await getDoc(doc(db, "mentors", mentor.mentorId));
            if (mDoc.exists()) {
              const data = mDoc.data();
              mentor.mentorName = data.fullName || data.name || mentor.mentorName;
              mentor.mentorPhoto = data.photoURL || mentor.mentorPhoto;
              mentor.role = data.title || data.role || mentor.role;
              mentor.expertise = mentor.expertise || (Array.isArray(data.skills) ? data.skills.slice(0, 2).join(", ") : (data.expertise || ""));
            }
          } catch {}
        }));
      } catch (e) {
        console.error("mentor profile enrichment failed:", e);
      }

      // Enrich with meeting info
      try {
        const mSnap = await getDocs(query(collection(db, "meetings"), where("founderId", "==", user.uid)));
        const meetingByMentor: Record<string, any> = {};
        mSnap.forEach((d) => {
          const m = d.data();
          if (!m.mentorId) return;
          const existing = meetingByMentor[m.mentorId];
          if (!existing || (m.createdAt?.toMillis?.() || 0) > (existing.createdAt?.toMillis?.() || 0)) {
            meetingByMentor[m.mentorId] = m;
          }
        });
        base.forEach((mentor) => {
          const m = meetingByMentor[mentor.mentorId];
          if (m) {
            mentor.jitsiLink = m.jitsiLink || "";
            mentor.meetingDate = m.meetingDate || "";
            mentor.meetingTime = m.meetingTime || "";
          }
        });
      } catch (e) {
        console.error("meetings enrichment failed:", e);
      }

      // Ensure all chat docs exist in Firestore with the correct sorted UID as ID
      try {
        await Promise.all(base.map(async (mentor) => {
          const chatRef = doc(db, "chats", mentor.chatDocId);
          await setDoc(chatRef, {
            founderId: user.uid,
            founderName: auth.currentUser?.displayName || "",
            mentorId: mentor.mentorId,
            mentorName: mentor.mentorName,
            lastUpdated: serverTimestamp(),
          }, { merge: true });
        }));
      } catch (e) {
        console.error("chat doc creation failed:", e);
      }

     try {
        await Promise.all(base.map(async (mentor) => {
          try {
            const chatSnap = await getDoc(doc(db, "chats", mentor.chatDocId));
            if (chatSnap.exists()) {
              const chatData = chatSnap.data();
              mentor._lastChatTime = chatData.lastUpdated?.toMillis?.() || chatData.lastMessageTime?.toMillis?.() || 0;
            } else {
              mentor._lastChatTime = 0;
            }
          } catch {
            mentor._lastChatTime = 0;
          }
        }));
        base.sort((a, b) => (b._lastChatTime || 0) - (a._lastChatTime || 0));
      } catch (e) {
        console.error("mentor chat sort failed:", e);
      }

      setConnectedMentors(base);
      setMentorsLoaded(true);
    }, (err) => {
      console.error("sessionRequests listener error:", err);
      setMentorsLoaded(true);
    });

    return () => unsubSess();
  }, [authReady, currentUserId]);

  async function fetchStats(uid: string) {
    try {
      const fundSnap = await getDocs(query(collection(db,"fundingApplications"), where("founderId","==",uid)));
      let totalAmt = 0; fundSnap.forEach(d => { totalAmt += d.data().amountRequested||0; });
      setFundingCount(fundSnap.size); setFundingAmount(totalAmt);
      const trainSnap = await getDocs(query(collection(db,"trainingProgress"), where("founderId","==",uid)));
      if (trainSnap.size>0) { let t=0; trainSnap.forEach(d => { t+=d.data().progressPercent||0; }); setTrainingProgress(Math.round(t/trainSnap.size)); }
      const pitchSnap = await getDocs(query(collection(db,"pitches"), where("founderId","==",uid)));
      setPitchCount(pitchSnap.size);
    } catch(e) { console.error("fetchStats",e); }
  }

  async function fetchTasks(uid: string) {
    try {
      const snap = await getDocs(query(collection(db,"tasks"), where("founderId","==",uid)));
      if (!snap.empty) { setTasks(snap.docs.map(d => ({ id:d.id, title:d.data().title||"", priority:d.data().priority||"medium", dueDate:d.data().dueDate||"" }))); return; }
    } catch {}
    setTasks([
      { id:"t1", title:"Schedule mentor call",           priority:"high",   dueDate:"Today"     },
      { id:"t2", title:"Submit funding application",     priority:"medium", dueDate:"Tomorrow"  },
      { id:"t3", title:"Complete market research module",priority:"low",    dueDate:"This week" },
      { id:"t4", title:"Update business plan",           priority:"medium", dueDate:"Next week" },
    ]);
  }

  async function fetchActivities(uid: string) {
    const acts: Activity[] = [];
    try {
      const sessSnap = await getDocs(query(collection(db,"sessionRequests"), where("founderId","==",uid)));
      sessSnap.forEach(d => { const data=d.data(); acts.push({ id:d.id, type:"mentor", message:`Mentor session ${data.status||"requested"}: ${data.mentorName||"Mentor"}`, time:relativeTime(data.createdAt||data.requestedAt) }); });
      const fundSnap = await getDocs(query(collection(db,"fundingApplications"), where("founderId","==",uid)));
      fundSnap.forEach(d => { const data=d.data(); acts.push({ id:d.id+"_f", type:"funding", message:`Funding applied: ${data.fundingTitle||data.title||"Grant"}`, time:relativeTime(data.createdAt||data.submittedAt) }); });
      const pitchSnap = await getDocs(query(collection(db,"pitches"), where("founderId","==",uid)));
      pitchSnap.forEach(d => { const data=d.data(); acts.push({ id:d.id+"_p", type:"pitch", message:`Pitch submitted: ${data.title||"Your pitch"}`, time:relativeTime(data.submittedAt||data.createdAt) }); });
    } catch {}
    if (acts.length>0) { setActivities(acts); return; }
    setActivities([
      { id:"a1", type:"mentor",   message:"New mentor match available",               time:"Just now"  },
      { id:"a2", type:"funding",  message:"Funding opportunity: Women in Tech Grant", time:"5 hrs ago" },
      { id:"a3", type:"training", message:"Training module ready to start",           time:"1 day ago" },
      { id:"a4", type:"pitch",    message:"Submit your first pitch to get feedback",  time:"2 days ago"},
    ]);
  }

  async function fetchJourney(uid: string) {
    try {
      const uSnap=await getDoc(doc(db,"users",uid)); const profileOk=uSnap.exists()&&!!(uSnap.data().displayName||uSnap.data().firstName);
      const sessSnap=await getDocs(query(collection(db,"sessionRequests"), where("founderId","==",uid), where("status","==","accepted")));
      const pitchSnap=await getDocs(query(collection(db,"pitches"), where("founderId","==",uid)));
      const fundSnap=await getDocs(query(collection(db,"fundingApplications"), where("founderId","==",uid)));
      const trainSnap=await getDocs(query(collection(db,"trainingProgress"), where("founderId","==",uid)));
      const hasTrain=trainSnap.docs.some(d=>(d.data().progressPercent||0)>0);
      setJourney([
        { label:"Profile completed",         done:profileOk,          inProgress:!profileOk        },
        { label:"First mentor connected",    done:sessSnap.size>0,    inProgress:false              },
        { label:"Pitch submission",          done:pitchSnap.size>0,   inProgress:pitchSnap.size===0 },
        { label:"First funding application", done:fundSnap.size>0,    inProgress:false              },
        { label:"Training started",          done:hasTrain,           inProgress:false              },
      ]);
    } catch {}
  }

  const journeyPct = journey.length>0 ? Math.round((journey.filter(s=>s.done).length/journey.length)*100) : 20;
  const connectionsTotal = connectedMentors.length + connectedInvestors.length;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (circumference * journeyPct) / 100;

  if (!authReady||loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(145deg, #faf5ff 0%, #fdf0f7 40%, #f0f4ff 100%)" }}>
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: "#9333ea" }} />
        <p className="text-gray-500 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(145deg, #faf5ff 0%, #fdf0f7 40%, #f0f4ff 100%)", fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(216,180,254,0.18) 0%, transparent 70%)", top: -80, left: -80 }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,168,212,0.13) 0%, transparent 70%)", bottom: 0, right: 0 }} />
      </div>

      {chatMentor && (
        <ConnectionChatPopup
          chatRoomId={chatMentor.chatDocId}
          name={chatMentor.name}
          subtitle={chatMentor.role}
          photoURL={chatMentor.avatar}
          currentUserId={currentUserId}
          currentUserName={displayName}
          onClose={() => setChatMentor(null)}
        />
      )}

      {activeInvestorChat && !chatMentor && (
        <ConnectionChatPopup
          chatRoomId={deriveChatId(currentUserId, activeInvestorChat.investorId)}
          name={activeInvestorChat.investorName}
          subtitle={activeInvestorChat.organization || "Investor"}
          photoURL={activeInvestorChat.investorPhoto}
          meetingInfo={{ date: activeInvestorChat.meetingDate, time: activeInvestorChat.meetingTime, link: activeInvestorChat.jitsiLink }}
          currentUserId={currentUserId}
          currentUserName={displayName}
          onClose={() => setActiveInvestorChat(null)}
        />
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px]">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <div className="relative mb-4">
              <input type={showOld ? "text" : "password"} placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full border p-3 rounded-lg" />
              <button className="absolute right-3 top-3" onClick={() => setShowOld(!showOld)}>{showOld ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
            <div className="relative mb-4">
              <input type={showNew ? "text" : "password"} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-3 rounded-lg" />
              <button className="absolute right-3 top-3" onClick={() => setShowNew(!showNew)}>{showNew ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
            <div className="relative mb-4">
              <input type={showConfirm ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border p-3 rounded-lg" />
              <button className="absolute right-3 top-3" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    const user = auth.currentUser;
                    if (!user?.email) return;
                    if (newPassword !== confirmPassword) { alert("Passwords do not match"); return; }
                    const credential = EmailAuthProvider.credential(user.email, oldPassword);
                    await reauthenticateWithCredential(user, credential);
                    await updatePassword(user, newPassword);
                    alert("Password updated successfully");
                    setShowPasswordModal(false);
                  } catch { alert("Failed to update password"); }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg"
              >Update</button>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[400px]">
            <h2 className="text-xl font-bold mb-4">Contact Support</h2>
            {adminData ? (
              <div className="space-y-3">
                <p><strong>Name:</strong> {adminData.fullName}</p>
                <p><strong>Email:</strong> {adminData.email}</p>
                <p><strong>Phone:</strong> {adminData.phone}</p>
                <p><strong>Role:</strong> {adminData.role}</p>
              </div>
            ) : (
              <p>No admin details available yet.</p>
            )}
            <button onClick={() => setShowContactModal(false)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">Close</button>
          </div>
        </div>
      )}

      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[450px]">
            <h2 className="text-xl font-bold mb-4">Report Issue</h2>
            <input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} placeholder="Issue Title" className="w-full border p-3 rounded-lg mb-4" />
            <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="Describe your issue..." className="w-full border p-3 rounded-lg h-32" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button
                onClick={async () => {
                  await addDoc(collection(db, "reportedIssues"), {
                    founderId: auth.currentUser?.uid,
                    founderEmail: auth.currentUser?.email,
                    issueTitle,
                    issueDescription,
                    status: "pending",
                    createdAt: new Date(),
                  });
                  alert("Issue submitted successfully");
                  setShowIssueModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg"
              >Submit</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ zIndex: 1 }}>

        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2" style={{ borderColor: "#e9d5ff" }}>
              {photoURL ? <AvatarImage src={photoURL} /> : <AvatarFallback style={{ background: "#f3e8ff", color: "#9333ea" }}>{displayName?.[0]?.toUpperCase() || "F"}</AvatarFallback>}
            </Avatar>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#c084fc" }}>Founder Dashboard</p>
              <h1 className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>Hey {displayName} <span style={{ filter: "saturate(1.3)" }}>👋</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
              <div className="relative" style={{ width: 56, height: 56 }}>
                <svg width="56" height="56" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="48" cy="48" r="42" fill="none" stroke="#f3e8ff" strokeWidth="8" />
                  <circle cx="48" cy="48" r="42" fill="none" stroke="url(#grad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: "#7c3aed" }}>{journeyPct}%</div>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#4c1d95" }}>Journey</p>
                <p className="text-xs" style={{ color: "#a78bfa" }}>{journey.filter(s=>s.done).length}/{journey.length || 5} done</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}>
                <Users size={16} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none" style={{ color: "#1e1b4b" }}>{connectionsTotal}</p>
                <p className="text-xs" style={{ color: "#a78bfa" }}>connections</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Mentors",        value: connectedMentors.length,   caption: "Connected & chatting", icon: Users,    gradient: "linear-gradient(135deg, #9333ea, #7e22ce)" },
            { label: "Investor Connections",  value: connectedInvestors.length, caption: "Deal room active",     icon: Link2,    gradient: "linear-gradient(135deg, #db2777, #be185d)" },
            { label: "Training",              value: `${trainingProgress}%`,    caption: "Modules completed",    icon: BookOpen, gradient: "linear-gradient(135deg, #9333ea, #db2777)" },
            { label: "Pitches",               value: pitchCount,                caption: "Submitted so far",     icon: Star,     gradient: "linear-gradient(135deg, #c026d3, #9333ea)" },
          ].map(s => (
            <div key={s.label} className="relative overflow-hidden rounded-3xl p-5 text-white" style={{ background: s.gradient, boxShadow: "0 10px 30px rgba(147,51,234,0.22)" }}>
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-white/85">{s.label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <s.icon size={16} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-extrabold mt-3 leading-none">{s.value}</p>
              <p className="text-xs mt-3 flex items-center gap-1 text-white/75">
                <TrendingUp size={11} /> {s.caption}
              </p>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 24px rgba(147,51,234,0.08)" }}>
              <div className="flex items-center justify-between px-5 pt-5">
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#faf5ff" }}>
                  <button onClick={() => setNetworkTab("mentors")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: networkTab==="mentors" ? "linear-gradient(135deg, #9333ea, #db2777)" : "transparent", color: networkTab==="mentors" ? "#fff" : "#9333ea" }}>
                    <Users size={13} /> Mentors
                    <span className="ml-0.5 px-1.5 rounded-full text-[10px]" style={{ background: networkTab==="mentors" ? "rgba(255,255,255,0.25)" : "#f3e8ff" }}>{connectedMentors.length}</span>
                  </button>
                  <button onClick={() => setNetworkTab("investors")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: networkTab==="investors" ? "linear-gradient(135deg, #9333ea, #db2777)" : "transparent", color: networkTab==="investors" ? "#fff" : "#9333ea" }}>
                    <Link2 size={13} /> Investors
                    <span className="ml-0.5 px-1.5 rounded-full text-[10px]" style={{ background: networkTab==="investors" ? "rgba(255,255,255,0.25)" : "#f3e8ff" }}>{connectedInvestors.length}</span>
                  </button>
                </div>
                {networkTab === "mentors" && (
                  <button onClick={() => onNavigate?.("mentors")} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#9333ea" }}>
                    <Filter size={12} /> View all
                  </button>
                )}
                {networkTab === "investors" && (
                  <button onClick={() => onNavigate?.("funding")} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#9333ea" }}>
                    <Rocket size={12} /> Explore funding
                  </button>
                )}
              </div>

              <div className="p-5 pt-4 space-y-2.5">
                {networkTab === "mentors" && mentorsLoaded && connectedMentors.length > 0 && connectedMentors.map(mentor => (
                  <div key={mentor.id} className="flex items-center justify-between p-3.5 rounded-2xl transition-all hover:-translate-y-0.5" style={{ background: "#faf5ff", border: "1.5px solid #f3e8ff" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      {mentor.mentorPhoto
                        ? <img src={mentor.mentorPhoto} alt={mentor.mentorName} className="w-11 h-11 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: "#e9d5ff" }} />
                        : <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}>{mentor.mentorName?.[0] || "M"}</div>
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#1e1b4b" }}>{mentor.mentorName}</p>
                        <p className="text-xs truncate" style={{ color: "#a78bfa" }}>{mentor.role}</p>
                        {mentor.expertise && <p className="text-xs truncate font-medium" style={{ color: "#9333ea" }}>{mentor.expertise}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {mentor.jitsiLink && (
                        <button onClick={() => window.open(mentor.jitsiLink)} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl" style={{ background: "#fff", color: "#9333ea", border: "1.5px solid #e9d5ff" }}>
                          <Video size={12} /> Join
                        </button>
                      )}
                      <button
                        onClick={() => setChatMentor({
                          id: mentor.mentorId,
                          name: mentor.mentorName,
                          avatar: mentor.mentorPhoto,
                          role: mentor.role,
                          chatDocId: mentor.chatDocId, // already [founderUid, mentorUid].sort().join("_")
                        })}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", color: "#fff" }}>
                        <MessageSquare size={12} /> Chat
                      </button>
                    </div>
                  </div>
                ))}

                {networkTab === "mentors" && mentorsLoaded && connectedMentors.length === 0 && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "#faf5ff", border: "1.5px dashed #e9d5ff" }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#f3e8ff" }}>
                      <Users size={18} style={{ color: "#9333ea" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#1e1b4b" }}>No mentor connections yet</p>
                      <p className="text-xs" style={{ color: "#a78bfa" }}>Request a mentor session — accepted mentors appear here automatically.</p>
                    </div>
                    <button onClick={() => onNavigate?.("mentors")} className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0" style={{ color: "#9333ea", border: "1.5px solid #e9d5ff", background: "#fff" }}>
                      Browse
                    </button>
                  </div>
                )}

                {networkTab === "investors" && investorsLoaded && connectedInvestors.length > 0 && connectedInvestors.map(investor => (
                  <div key={investor.id} className="flex items-center justify-between p-3.5 rounded-2xl transition-all hover:-translate-y-0.5" style={{ background: "#fdf0f7", border: "1.5px solid #fbcfe8" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      {investor.investorPhoto
                        ? <img src={investor.investorPhoto} alt={investor.investorName} className="w-11 h-11 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: "#fbcfe8" }} />
                        : <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg, #c026d3, #db2777)" }}>{investor.investorName?.[0] || "I"}</div>
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#1e1b4b" }}>{investor.investorName}</p>
                        <p className="text-xs truncate" style={{ color: "#a78bfa" }}>{investor.organization}</p>
                        <p className="text-xs truncate font-medium" style={{ color: "#db2777" }}>{investor.opportunityTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {investor.jitsiLink && (
                        <button onClick={() => window.open(investor.jitsiLink)} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl" style={{ background: "#fff", color: "#db2777", border: "1.5px solid #fbcfe8" }}>
                          <Video size={12} /> Join
                        </button>
                      )}
                      <button onClick={() => setActiveInvestorChat(investor)}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #c026d3, #db2777)" }}>
                        <MessageSquare size={12} /> Chat
                      </button>
                    </div>
                  </div>
                ))}

                {networkTab === "investors" && investorsLoaded && connectedInvestors.length === 0 && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "#fdf0f7", border: "1.5px dashed #fbcfe8" }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#fce7f3" }}>
                      <Rocket size={18} style={{ color: "#db2777" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#1e1b4b" }}>No investor connections yet</p>
                      <p className="text-xs" style={{ color: "#a78bfa" }}>Apply for funding — accepted investors appear here automatically.</p>
                    </div>
                    <button onClick={() => onNavigate?.("funding")} className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0" style={{ color: "#db2777", border: "1.5px solid #fbcfe8", background: "#fff" }}>
                      Explore
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 24px rgba(147,51,234,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: "#4c1d95" }}>Upcoming Tasks</p>
                <button onClick={() => onNavigate?.("training")} className="text-xs font-semibold flex items-center gap-1" style={{ color: "#9333ea" }}>
                  All tasks <ChevronRight size={12} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
                {tasks.map(task => {
                  const c = task.priority === "high" ? "#db2777" : task.priority === "medium" ? "#c026d3" : "#9333ea";
                  return (
                    <div key={task.id} className="flex-shrink-0 rounded-2xl p-4" style={{ width: 200, background: `${c}08`, border: `1.5px solid ${c}28` }}>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${c}18`, color: c }}>{task.priority}</span>
                      <p className="text-sm font-bold mt-2.5" style={{ color: "#1e1b4b" }}>{task.title}</p>
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#a78bfa" }}><Clock size={11} />{task.dueDate}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT column */}
          <div className="space-y-6">
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 24px rgba(147,51,234,0.08)" }}>
              <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#4c1d95" }}><Zap size={14} style={{ color: "#d97706" }} />Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "New Pitch",      icon: MessageSquare, view: "pitch"    },
                  { label: "Schedule Call",  icon: Calendar,      view: "mentors"  },
                  { label: "Training",       icon: BookOpen,      view: "training" },
                  { label: "Funding",        icon: DollarSign,    view: "funding"  },
                ].map(a => (
                  <button key={a.view} onClick={() => onNavigate?.(a.view)}
                    className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ background: "#faf5ff", border: "1.5px solid #f3e8ff" }}>
                    <a.icon size={16} style={{ color: "#9333ea" }} />
                    <span className="text-xs font-semibold text-center" style={{ color: "#4c1d95" }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 24px rgba(147,51,234,0.08)" }}>
              <p className="text-sm font-bold mb-4" style={{ color: "#4c1d95" }}>Recent Activity</p>
              <div className="relative space-y-4 pl-1">
                <div className="absolute left-[15px] top-1 bottom-1 w-px" style={{ background: "#f3e8ff" }} />
                {activities.slice(0, 5).map(act => (
                  <div key={act.id} className="relative flex items-start gap-3">
                    <ActivityDot type={act.type} />
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-xs font-medium leading-snug" style={{ color: "#1e1b4b" }}>{act.message}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#c084fc" }}>{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 24px rgba(147,51,234,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: "#4c1d95" }}>Startup Journey</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#f3e8ff", color: "#9333ea" }}>{journeyPct}%</span>
              </div>
              <div className="space-y-2.5">
                {(journey.length>0 ? journey : [
                  {label:"Profile completed",done:true,inProgress:false},{label:"First mentor connected",done:false,inProgress:false},
                  {label:"Pitch submission",done:false,inProgress:true},{label:"First funding application",done:false,inProgress:false},{label:"MVP development",done:false,inProgress:false}
                ]).map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {step.done
                      ? <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#16a34a" }}><CheckCircle size={12} className="text-white" /></div>
                      : step.inProgress
                      ? <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}><Clock size={10} style={{ color: "#d97706" }} /></div>
                      : <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ border: "1.5px solid #e5e7eb" }} />}
                    <span className="text-xs font-medium" style={{ color: step.done ? "#1e1b4b" : "#a78bfa" }}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}