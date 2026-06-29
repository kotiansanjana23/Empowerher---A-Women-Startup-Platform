import { useState, useRef, useEffect } from "react";
import {
  Send, Paperclip, Smile, Search, X, Phone, Linkedin, Mail,
  MessageCircle, Calendar, Globe, Video, Clock, CheckCircle, ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, doc, setDoc, getDocs, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../../../../firebase";
import { onAuthStateChanged } from "firebase/auth";

/* ================= TYPES ================= */
interface FirestoreMessage {
  id: string;
  sender: "founder" | "mentor";
  text: string;
  timestamp: any;
}

interface Conversation {
  chatId: string;       // always [founderUid, mentorUid].sort().join("_")
  founderUid: string;
  mentorUid: string;
  founderName: string;
  founderPhoto: string;
  startup: string;
  online: boolean;
  bio: string;
  linkedin: string;
  email: string;
  website?: string;
  about?: string;
  companySize?: string;
  role?: string;
  location?: string;
  industry?: string;
  stage?: string;
}

interface Meeting {
  date: string;
  time: string;
  title: string;
  jitsiRoom: string;
}

/* ================= HELPERS ================= */
function formatTime(timestamp: any): string {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function generateJitsiRoom(founderName: string): string {
  const slug = founderName.toLowerCase().replace(/\s+/g, "-");
  const rand = Math.random().toString(36).substring(2, 7);
  return `empowerher-${slug}-${rand}`;
}

/** Derive the shared chat ID — same formula used on founder side */
function deriveChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

const AVATAR_COLORS = [
  { bg: "linear-gradient(135deg,#7C3AED,#EC4899)", text: "#fff" },
  { bg: "linear-gradient(135deg,#6D28D9,#DB2777)", text: "#fff" },
  { bg: "linear-gradient(135deg,#8B5CF6,#F472B6)", text: "#fff" },
  { bg: "linear-gradient(135deg,#5B21B6,#BE185D)", text: "#fff" },
  { bg: "linear-gradient(135deg,#A78BFA,#F9A8D4)", text: "#5B21B6" },
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Avatar ── */
function Avatar({
  src, name, size = 44, onClick, ring = false,
}: {
  src?: string; name: string; size?: number; onClick?: () => void; ring?: boolean;
}) {
  const [err, setErr] = useState(false);
  const colors = avatarColor(name);
  const initials = getInitials(name);
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: "50%",
    cursor: onClick ? "pointer" : "default", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.36, fontWeight: 700, overflow: "hidden",
    boxShadow: ring ? `0 0 0 3px #a855f7, 0 0 0 5px rgba(168,85,247,0.3)` : undefined,
    transition: "transform 0.15s",
  };

  if (!src || err) {
    return (
      <div style={{ ...base, background: colors.bg, color: colors.text }} onClick={onClick}
        onMouseEnter={e => onClick && ((e.target as HTMLElement).style.transform = "scale(1.05)")}
        onMouseLeave={e => onClick && ((e.target as HTMLElement).style.transform = "scale(1)")}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      onClick={onClick}
      style={{ ...base, objectFit: "cover" }}
    />
  );
}

/* ── Profile Info Row ── */
function InfoRow({ icon, label, value, href }: {
  icon: React.ReactNode; label: string; value: string; href?: string;
}) {
  const inner = (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
      borderRadius: 12, background: "#faf5ff", border: "1px solid #F3E8FF",
      textDecoration: "none", transition: "background 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f3e8ff")}
      onMouseLeave={e => (e.currentTarget.style.background = "#faf5ff")}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(236,72,153,0.08))",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#c084fc", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
        <p style={{ fontSize: 12, color: "#7C3AED", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      </div>
      {href && <ExternalLink size={12} color="#c084fc" style={{ flexShrink: 0 }} />}
    </div>
  );

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a>;
  }
  return inner;
}

/* ── Meeting Scheduler Modal ── */
function MeetingScheduler({
  conv, onClose, onScheduled,
}: {
  conv: Conversation; onClose: () => void; onScheduled: (m: Meeting) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  const [title, setTitle] = useState(`Meeting with ${conv.founderName.split(" ")[0]}`);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [room] = useState(() => generateJitsiRoom(conv.founderName));
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    setSaving(true);
    try {
      const meeting: Meeting = { date, time, title, jitsiRoom: room };
      await addDoc(collection(db, "chats", conv.chatId, "messages"), {
        sender: "mentor",
        text: `📅 Meeting scheduled: **${title}** on ${date} at ${time}\n🔗 Join: https://meet.jit.si/${room}`,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        type: "meeting",
        meetingData: meeting,
      });
      onScheduled(meeting);
      setStep("confirm");
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(91,33,182,0.18)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#fff", borderRadius: 24, width: 420,
        boxShadow: "0 32px 80px rgba(109,40,217,0.22)",
        overflow: "hidden", position: "relative",
      }}>
        <div style={{
          background: "linear-gradient(135deg,#7C3AED 0%,#a855f7 50%,#EC4899 100%)",
          padding: "28px 28px 24px", position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            width: 30, height: 30, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.25)", color: "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}><X size={14} /></button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={22} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Schedule Meeting</p>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "2px 0 0" }}>with {conv.founderName.split(" ")[0]}</p>
            </div>
          </div>
        </div>

        {step === "form" && (
          <div style={{ padding: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6D28D9", display: "block", marginBottom: 6 }}>Meeting Title</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 12,
                    border: "1.5px solid #E9D5FF", fontSize: 14, color: "#1a1a2e",
                    outline: "none", boxSizing: "border-box", background: "#faf5ff",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6D28D9", display: "block", marginBottom: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> Date</span>
                  </label>
                  <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 12,
                      border: "1.5px solid #E9D5FF", fontSize: 13, color: "#1a1a2e",
                      outline: "none", boxSizing: "border-box", background: "#faf5ff",
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6D28D9", display: "block", marginBottom: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> Time</span>
                  </label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 12,
                      border: "1.5px solid #E9D5FF", fontSize: 13, color: "#1a1a2e",
                      outline: "none", boxSizing: "border-box", background: "#faf5ff",
                    }} />
                </div>
              </div>

              <div style={{
                background: "linear-gradient(135deg,#faf5ff,#fdf2f8)", borderRadius: 12,
                padding: "12px 14px", border: "1.5px solid #E9D5FF",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg,#7C3AED,#EC4899)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Video size={16} color="#fff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6D28D9", margin: 0 }}>Jitsi Meet Room</p>
                  <p style={{ fontSize: 11, color: "#a855f7", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    meet.jit.si/{room}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSchedule} disabled={saving || !date || !time || !title}
                style={{
                  padding: "13px", borderRadius: 14, border: "none",
                  background: saving ? "#E9D5FF" : "linear-gradient(135deg,#7C3AED,#EC4899)",
                  color: saving ? "#a855f7" : "#fff", fontWeight: 700, fontSize: 15,
                  cursor: saving ? "default" : "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {saving ? "Sending…" : <><Calendar size={16} /> Schedule & Notify Founder</>}
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div style={{ padding: 28, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,#7C3AED,#EC4899)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 18, color: "#1a1a2e", margin: "0 0 6px" }}>Meeting Scheduled!</p>
            <p style={{ fontSize: 13, color: "#7C3AED", margin: "0 0 20px" }}>{date} at {time}</p>

            <div style={{
              background: "#faf5ff", borderRadius: 14, padding: "14px 16px",
              border: "1.5px solid #E9D5FF", marginBottom: 20, textAlign: "left",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6D28D9", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Join Link</p>
              <p style={{ fontSize: 12, color: "#a855f7", margin: 0, wordBreak: "break-all" }}>
                https://meet.jit.si/{room}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => window.open(`https://meet.jit.si/${room}`, "_blank")}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#7C3AED,#EC4899)",
                  color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              ><Video size={15} /> Join Now</button>
              <button onClick={onClose} style={{
                flex: 1, padding: "11px", borderRadius: 12,
                border: "1.5px solid #E9D5FF", background: "#faf5ff",
                color: "#7C3AED", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function Messages() {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [message, setMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [calling, setCalling] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [scheduledMeeting, setScheduledMeeting] = useState<Meeting | null>(null);
  const [mentorUid, setMentorUid] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<any>(null);

  /* ── Get current mentor UID ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setMentorUid(user.uid);
    });
    return unsub;
  }, []);

  /* ── Load conversations from sessionRequests where this mentor is accepted ── */
  useEffect(() => {
    if (!mentorUid) return;

    async function load() {
      try {
        // 1. Find all accepted session requests for this mentor
        const { getDocs: gd, collection: col, query: q, where: w } = await import("firebase/firestore");
        const sessSnap = await gd(q(col(db, "sessionRequests"), w("mentorId", "==", mentorUid), w("status", "==", "accepted")));

        if (sessSnap.empty) {
          setLoadingChats(false);
          return;
        }

        const loaded: Conversation[] = [];
        const seenFounders = new Set<string>();

        for (const sessDoc of sessSnap.docs) {
          const sess = sessDoc.data();
          const founderUid = sess.founderId as string;
          if (!founderUid || seenFounders.has(founderUid)) continue;
          seenFounders.add(founderUid);

          // 2. Derive the shared chat ID — same formula as founder side
          const chatId = deriveChatId(founderUid, mentorUid);

          // 3. Ensure the chat doc exists in Firestore with correct fields
          const chatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(chatRef);

          // Fetch founder profile for display info
          let founderName = sess.founderName || founderUid;
          let founderPhoto = sess.founderPhoto || "";
          let founderEmail = sess.founderEmail || "";
          let founderBio = "";
          let startup = "";
          let role = "";
          let location = "";
          let industry = "";
          let stage = "";
          let linkedin = "";
          let website = "";

          try {
            const fDoc = await getDoc(doc(db, "founders", founderUid));
            if (fDoc.exists()) {
              const fd = fDoc.data();
              founderName = fd.fullName || fd.name || fd.displayName || founderName;
              founderPhoto = fd.photoURL || founderPhoto;
              founderEmail = fd.email || founderEmail;
              founderBio = fd.bio || fd.about || fd.description || "";
              startup = fd.startupName || fd.companyName || fd.company || "";
              role = fd.role || fd.jobTitle || fd.title || "";
              location = fd.location || fd.city || "";
              industry = fd.industry || fd.sector || "";
              stage = fd.stage || fd.fundingStage || "";
              linkedin = fd.linkedin || fd.linkedinUrl || "";
              website = fd.website || fd.websiteUrl || "";
            }
          } catch (_) {}

          // 4. Create/update the chat doc with sorted UID as ID
          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              founderId: founderUid,
              founderName,
              founderEmail,
              founderPhoto,
              mentorId: mentorUid,
              mentorName: sess.mentorName || "",
              startup: startup || "—",
              online: false,
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
            });
          } else {
            // Update with latest info
            await setDoc(chatRef, {
              founderId: founderUid,
              mentorId: mentorUid,
              lastUpdated: serverTimestamp(),
            }, { merge: true });
          }

          loaded.push({
            chatId,
            founderUid,
            mentorUid,
            founderName,
            founderPhoto,
            startup: startup || "—",
            online: chatSnap.exists() ? (chatSnap.data()?.online ?? false) : false,
            bio: founderBio,
            about: founderBio,
            email: founderEmail,
            linkedin,
            website,
            role,
            location,
            industry,
            stage,
          });
        }

        setConversations(loaded);
        if (loaded.length > 0) setSelected(loaded[0]);
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        setLoadingChats(false);
      }
    }

    load();
  }, [mentorUid]);

  /* ── Live messages ── */
  useEffect(() => {
    if (!selected) return;
    setMessages([]);
    const q = query(
      collection(db, "chats", selected.chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({
        id: d.id,
        sender: d.data().sender || (d.data().senderId === mentorUid ? "mentor" : "founder"),
        text: d.data().text,
        timestamp: d.data().createdAt || d.data().timestamp,
      })));
    });
    return () => unsub();
  }, [selected, mentorUid]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (calling) {
      setCallSeconds(0);
      callTimerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
    } else clearInterval(callTimerRef.current);
    return () => clearInterval(callTimerRef.current);
  }, [calling]);

  const formatCallTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Send message ── */
  const handleSend = async () => {
    if (!message.trim() || !selected) return;
    const text = message.trim();
    setMessage("");
    try {
      // Ensure chat doc exists before writing message
      await setDoc(doc(db, "chats", selected.chatId), {
        founderId: selected.founderUid,
        mentorId: selected.mentorUid,
        founderName: selected.founderName,
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, "chats", selected.chatId, "messages"), {
        sender: "mentor",
        senderId: mentorUid,
        senderName: "Mentor",
        text,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });
    } catch (err) { console.error(err); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    try {
      await addDoc(collection(db, "chats", selected.chatId, "messages"), {
        sender: "mentor",
        senderId: mentorUid,
        senderName: "Mentor",
        text: `📎 ${file.name}`,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });
    } catch (err) { console.error(err); }
  };

  const emojis = ["😀","😂","😍","🔥","👍","🎉","❤️","😎","👏","✨","💡","🚀","🎯","💜","🤝"];
  const filtered = conversations.filter(c =>
    c.founderName.toLowerCase().includes(search.toLowerCase()) ||
    c.startup.toLowerCase().includes(search.toLowerCase())
  );

  const groupedMessages = messages.reduce((groups: { date: string; msgs: FirestoreMessage[] }[], msg) => {
    const date = msg.timestamp?.toDate
      ? msg.timestamp.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      : "Today";
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else groups.push({ date, msgs: [msg] });
    return groups;
  }, []);

  const renderMessageText = (text: string, isMentor: boolean) => {
    if (text.includes("📅 Meeting scheduled:")) {
      const lines = text.split("\n");
      const titleLine = lines[0].replace("📅 Meeting scheduled: ", "");
      const onLine = lines[1] || "";
      const linkLine = lines[2] || "";
      const jitsiUrl = linkLine.replace("🔗 Join: ", "");
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Calendar size={14} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>{titleLine}</span>
          </div>
          <p style={{ fontSize: 12, margin: "0 0 8px", opacity: 0.85 }}>{onLine}</p>
          <button
            onClick={() => window.open(jitsiUrl, "_blank")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: isMentor ? "rgba(255,255,255,0.2)" : "linear-gradient(135deg,#7C3AED,#EC4899)",
              color: "#fff",
            }}
          ><Video size={12} /> Join Meeting</button>
        </div>
      );
    }
    return text;
  };

  return (
    <div style={{
      height: "calc(100vh - 4rem)", display: "flex",
      background: "linear-gradient(160deg,#faf5ff 0%,#fdf2f8 100%)",
      position: "relative", overflow: "hidden", fontFamily: "inherit",
    }}>

      {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
      <div style={{
        width: 300, display: "flex", flexDirection: "column",
        background: "#fff", borderRight: "1px solid #F3E8FF", flexShrink: 0,
      }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #F3E8FF" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg,#7C3AED,#EC4899)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageCircle size={14} color="#fff" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Messages</p>
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#7C3AED",
              background: "rgba(124,58,237,0.1)", borderRadius: 20, padding: "2px 8px",
            }}>{conversations.length}</span>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#c084fc" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search founders…"
              style={{
                width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                fontSize: 13, borderRadius: 10, border: "1.5px solid #F3E8FF",
                background: "#faf5ff", color: "#1a1a2e", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {loadingChats && (
            <div style={{ padding: "20px 12px", textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #a855f7", borderTopColor: "transparent", margin: "0 auto", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 12, color: "#c084fc", marginTop: 8 }}>Loading conversations…</p>
            </div>
          )}
          {!loadingChats && filtered.length === 0 && (
            <p style={{ fontSize: 13, color: "#c084fc", padding: "20px 12px", textAlign: "center" }}>No conversations found</p>
          )}
          {filtered.map(conv => {
            const isActive = selected?.chatId === conv.chatId;
            return (
              <button key={conv.chatId} onClick={() => { setSelected(conv); setShowProfile(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: isActive
                    ? "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(236,72,153,0.06))"
                    : "transparent",
                  borderLeft: isActive ? "3px solid #a855f7" : "3px solid transparent",
                  textAlign: "left", marginBottom: 2, transition: "all 0.15s",
                }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar src={conv.founderPhoto} name={conv.founderName} size={42} />
                  {conv.online && (
                    <span style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 10, height: 10, borderRadius: "50%",
                      background: "#4ade80", border: "2px solid #fff",
                    }} />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#7C3AED" : "#1a1a2e", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {conv.founderName}
                  </p>
                  <p style={{ fontSize: 11, color: isActive ? "#c084fc" : "#9ca3af", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {conv.startup}
                  </p>
                </div>
                {isActive && <ChevronRight size={14} color="#c084fc" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ CHAT AREA ═══════════════ */}
      {selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Chat header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
            background: "#fff", borderBottom: "1px solid #F3E8FF",
            boxShadow: "0 1px 8px rgba(124,58,237,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}
              onClick={() => setShowProfile(!showProfile)}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar src={selected.founderPhoto} name={selected.founderName} size={44} ring={showProfile} />
                {selected.online && (
                  <span style={{
                    position: "absolute", bottom: 1, right: 1, width: 11, height: 11,
                    borderRadius: "50%", background: "#4ade80", border: "2px solid #fff",
                  }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", margin: 0 }}>{selected.founderName}</p>
                <p style={{ fontSize: 12, color: selected.online ? "#4ade80" : "#c084fc", margin: "2px 0 0" }}>
                  {selected.online ? "● Active now" : "● Offline"}{selected.startup ? ` · ${selected.startup}` : ""}
                </p>
                <p style={{ fontSize: 10, color: "#d8b4fe", margin: "1px 0 0", fontFamily: "monospace" }}>
                  Chat ID: {selected.chatId.slice(0, 20)}…
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setCalling(true)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                borderRadius: 10, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.08))",
                color: "#7C3AED", fontSize: 13, fontWeight: 600,
              }}><Phone size={14} /> Call</button>

              <button onClick={() => setShowMeeting(true)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                borderRadius: 10, border: "none", cursor: "pointer",
                background: scheduledMeeting
                  ? "linear-gradient(135deg,#7C3AED,#EC4899)"
                  : "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.08))",
                color: scheduledMeeting ? "#fff" : "#7C3AED",
                fontSize: 13, fontWeight: 600,
              }}>
                <Calendar size={14} />
                {scheduledMeeting ? "Scheduled ✓" : "Schedule"}
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: 4,
            background: "linear-gradient(160deg,#faf5ff 0%,#fdf2f8 100%)",
          }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.5 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(236,72,153,0.1))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageCircle size={26} color="#a855f7" />
                </div>
                <p style={{ fontSize: 14, color: "#a855f7" }}>No messages yet — say hello!</p>
              </div>
            )}

            {groupedMessages.map(group => (
              <div key={group.date}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 8px" }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,#E9D5FF)" }} />
                  <span style={{ fontSize: 11, color: "#c084fc", fontWeight: 500, whiteSpace: "nowrap" }}>{group.date}</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#E9D5FF,transparent)" }} />
                </div>

                {group.msgs.map((msg, i) => {
                  const isMentor = msg.sender === "mentor";
                  const isFirst = i === 0 || group.msgs[i - 1].sender !== msg.sender;
                  return (
                    <div key={msg.id} style={{
                      display: "flex", justifyContent: isMentor ? "flex-end" : "flex-start",
                      alignItems: "flex-end", gap: 8, marginBottom: 3,
                    }}>
                      {!isMentor && isFirst && (
                        <Avatar src={selected.founderPhoto} name={selected.founderName} size={28} />
                      )}
                      {!isMentor && !isFirst && <div style={{ width: 28 }} />}
                      <div style={{
                        maxWidth: 420, padding: "10px 15px", borderRadius: 18,
                        borderBottomRightRadius: isMentor ? 4 : 18,
                        borderBottomLeftRadius: isMentor ? 18 : 4,
                        background: isMentor
                          ? "linear-gradient(135deg,#7C3AED,#9333ea)"
                          : "#fff",
                        color: isMentor ? "#fff" : "#1a1a2e",
                        border: isMentor ? "none" : "1px solid #F3E8FF",
                        fontSize: 14, lineHeight: 1.5,
                        boxShadow: isMentor
                          ? "0 4px 16px rgba(124,58,237,0.25)"
                          : "0 1px 4px rgba(0,0,0,0.04)",
                      }}>
                        {renderMessageText(msg.text, isMentor)}
                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: "12px 20px", background: "#fff", borderTop: "1px solid #F3E8FF",
            display: "flex", alignItems: "center", gap: 10, position: "relative",
          }}>
            <input type="file" ref={fileRef} onChange={handleFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()} style={{
              width: 36, height: 36, borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.08))",
              color: "#7C3AED", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}><Paperclip size={15} /></button>

            <button onClick={() => setShowEmoji(!showEmoji)} style={{
              width: 36, height: 36, borderRadius: 10, border: "none",
              background: showEmoji ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.08))",
              color: showEmoji ? "#fff" : "#7C3AED",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}><Smile size={15} /></button>

            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message…"
              style={{
                flex: 1, padding: "9px 16px", borderRadius: 12,
                border: "1.5px solid #F3E8FF", background: "#faf5ff",
                color: "#1a1a2e", fontSize: 14, outline: "none",
              }}
            />

            <button onClick={handleSend} disabled={!message.trim()} style={{
              width: 40, height: 40, borderRadius: 12, border: "none",
              background: message.trim() ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "#F3E8FF",
              color: message.trim() ? "#fff" : "#c084fc",
              cursor: message.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "all 0.15s", boxShadow: message.trim() ? "0 4px 12px rgba(124,58,237,0.3)" : "none",
            }}><Send size={16} /></button>

            {showEmoji && (
              <div style={{
                position: "absolute", bottom: 64, left: 60,
                background: "#fff", border: "1px solid #F3E8FF", borderRadius: 16,
                padding: 12, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6,
                boxShadow: "0 8px 32px rgba(124,58,237,0.15)", zIndex: 20,
              }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => { setMessage(m => m + e); setShowEmoji(false); }}
                    style={{ fontSize: 20, border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}
                    onMouseOver={ev => (ev.currentTarget.style.background = "#faf5ff")}
                    onMouseOut={ev => (ev.currentTarget.style.background = "none")}>{e}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.4 }}>
          <MessageCircle size={40} color="#a855f7" />
          <p style={{ fontSize: 14, color: "#a855f7" }}>Select a conversation</p>
        </div>
      )}

      {/* ═══════════════ PROFILE PANEL ═══════════════ */}
      {selected && (
        <div style={{
          position: "absolute", top: 0, right: 0, height: "100%", width: 320,
          background: "#fff", borderLeft: "1px solid #F3E8FF",
          transform: showProfile ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex", flexDirection: "column", zIndex: 30, overflowY: "auto",
          boxShadow: showProfile ? "-8px 0 32px rgba(124,58,237,0.08)" : "none",
        }}>
          <div style={{
            background: "linear-gradient(135deg,#7C3AED 0%,#a855f7 45%,#EC4899 100%)",
            padding: "36px 20px 28px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 10, position: "relative",
          }}>
            <button onClick={() => setShowProfile(false)} style={{
              position: "absolute", top: 14, right: 14, width: 30, height: 30,
              borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.2)",
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}><X size={14} /></button>

            <Avatar src={selected.founderPhoto} name={selected.founderName} size={92} ring />

            {selected.online && (
              <span style={{
                fontSize: 10, fontWeight: 700, background: "rgba(74,222,128,0.2)",
                color: "#4ade80", padding: "3px 10px", borderRadius: 20,
                border: "1px solid rgba(74,222,128,0.4)", letterSpacing: "0.05em",
              }}>● ACTIVE NOW</span>
            )}

            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 800, fontSize: 18, color: "#fff", margin: 0 }}>{selected.founderName}</p>
              {selected.role && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: "4px 0 0", fontWeight: 500 }}>{selected.role}</p>
              )}
              {selected.startup && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>@ {selected.startup}</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {selected.location && (
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", color: "#fff", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.25)" }}>
                  📍 {selected.location}
                </span>
              )}
              {selected.stage && (
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", color: "#fff", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.25)" }}>
                  🚀 {selected.stage}
                </span>
              )}
              {selected.industry && (
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", color: "#fff", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.25)" }}>
                  🏭 {selected.industry}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setCalling(true)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: 20, border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.15)", color: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)",
              }}><Phone size={13} /> Call</button>
              <button onClick={() => { setShowMeeting(true); setShowProfile(false); }} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: 20, border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.15)", color: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)",
              }}><Calendar size={13} /> Meet</button>
            </div>
          </div>

          <div style={{ padding: "20px 18px 0" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c084fc", marginBottom: 10 }}>About</p>
            <div style={{ background: "linear-gradient(135deg,#faf5ff,#fdf2f8)", borderRadius: 14, padding: "14px 16px", border: "1px solid #F3E8FF" }}>
              <p style={{ fontSize: 13, color: selected.bio ? "#374151" : "#c084fc", lineHeight: 1.65, margin: 0, fontStyle: selected.bio ? "normal" : "italic" }}>
                {selected.bio || "No bio added yet."}
              </p>
            </div>
          </div>

          <div style={{ padding: "16px 18px 0" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c084fc", marginBottom: 10 }}>Startup</p>
            <div style={{
              borderRadius: 14, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(236,72,153,0.05))",
              border: "1px solid #E9D5FF",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg,#7C3AED,#EC4899)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: 18 }}>🚀</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#7C3AED", margin: 0 }}>
                  {selected.startup || "—"}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 18px 24px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c084fc", marginBottom: 10 }}>Contact & Links</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selected.email ? (
                <InfoRow icon={<Mail size={14} color="#a855f7" />} label="Email" value={selected.email} href={`mailto:${selected.email}`} />
              ) : (
                <div style={{ padding: "10px 14px", borderRadius: 12, border: "1px dashed #E9D5FF", textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "#c084fc", margin: 0, fontStyle: "italic" }}>No email on file</p>
                </div>
              )}
              {selected.linkedin && <InfoRow icon={<Linkedin size={14} color="#a855f7" />} label="LinkedIn" value="View Profile" href={selected.linkedin} />}
              {selected.website && <InfoRow icon={<Globe size={14} color="#a855f7" />} label="Website" value={selected.website.replace(/^https?:\/\//, "")} href={selected.website} />}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MEETING SCHEDULER ═══════════════ */}
      {showMeeting && selected && (
        <MeetingScheduler
          conv={selected}
          onClose={() => setShowMeeting(false)}
          onScheduled={m => { setScheduledMeeting(m); setShowMeeting(false); }}
        />
      )}

      {/* ═══════════════ CALL MODAL ═══════════════ */}
      {calling && selected && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(124,58,237,0.2)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 28, padding: "48px 40px",
            textAlign: "center", width: 320, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 12, border: "1px solid #F3E8FF",
            boxShadow: "0 32px 80px rgba(124,58,237,0.25)",
          }}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <Avatar src={selected.founderPhoto} name={selected.founderName} size={88} ring />
            </div>
            <p style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", margin: 0 }}>{selected.founderName}</p>
            {selected.startup && <p style={{ fontSize: 13, color: "#c084fc", margin: 0 }}>{selected.startup}</p>}
            <div style={{
              background: "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(236,72,153,0.06))",
              borderRadius: 20, padding: "6px 20px", marginTop: 4,
            }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#7C3AED", fontVariantNumeric: "tabular-nums", margin: 0 }}>
                {formatCallTime(callSeconds)}
              </p>
            </div>
            <button onClick={() => setCalling(false)} style={{
              marginTop: 16, padding: "12px 40px", borderRadius: 14,
              background: "linear-gradient(135deg,#fee2e2,#fecaca)", color: "#7f1d1d",
              fontWeight: 600, fontSize: 15, cursor: "pointer",
              border: "1px solid #fca5a5",
            }}>End call</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0%,100% { transform: scale(1); opacity: 0.2; } 50% { transform: scale(1.15); opacity: 0.05; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E9D5FF; border-radius: 4px; }
      `}</style>
    </div>
  );
}