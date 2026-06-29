import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Smile, Video } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useEffect, useRef, useState } from "react";
import { db, auth } from "../../../../../../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

interface FounderInfo {
  name: string;
  photo: string;
  startup: string;
  online: boolean;
}

interface ChatPageProps {
  // When used as a component (from Dashboard)
  mentorId?: string;
  chatId?: string;
  mentorName?: string;
  mentorAvatar?: string;
  mentorRole?: string;
  onBack?: () => void;
}

export function ChatPage({
  mentorId: propMentorId,
  chatId: propChatId,
  mentorName: propMentorName,
  mentorAvatar: propMentorAvatar,
  mentorRole: propMentorRole,
  onBack,
}: ChatPageProps) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [founder, setFounder] = useState<FounderInfo | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Determine the current user (founder) ID
  const currentUserId = auth.currentUser?.uid || "";

  // Determine mentor ID — from props (Dashboard) or from URL param
  const mentorId = propMentorId || paramId || "";

  // Build a consistent chatId:
  // Always sort [founderId, mentorId] so both sides generate the same string.
  const chatId = propChatId
    ? propChatId
    : currentUserId && mentorId
    ? [currentUserId, mentorId].sort().join("_")
    : mentorId.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  /* ── Load mentor/founder info ── */
  useEffect(() => {
    // If name was passed as a prop, use it directly
    if (propMentorName) {
      setFounder({
        name: propMentorName,
        photo: propMentorAvatar || "",
        startup: propMentorRole || "",
        online: false,
      });
      return;
    }

    if (!mentorId) return;

    async function loadMentorInfo() {
      try {
        // Try fetching from "mentors" collection first
        const mentorDoc = await getDoc(doc(db, "mentors", mentorId));
        if (mentorDoc.exists()) {
          const data = mentorDoc.data();
          setFounder({
            name: data.fullName || data.name || mentorId,
            photo: data.photoURL || data.photo || "",
            startup: data.title || data.role || "",
            online: data.online ?? false,
          });
          return;
        }
        // Fallback: try chat document
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          setFounder({
            name: data.mentorName || data.founderName || mentorId,
            photo: data.mentorPhoto || data.founderPhoto || "",
            startup: data.startup || "",
            online: data.online ?? false,
          });
        } else {
          setFounder({ name: mentorId, photo: "", startup: "", online: false });
        }
      } catch (err) {
        console.error("Failed to load mentor info:", err);
        setFounder({ name: mentorId, photo: "", startup: "", online: false });
      }
    }

    loadMentorInfo();
  }, [mentorId, chatId, propMentorName, propMentorAvatar, propMentorRole]);

  /* ── Listen to messages in real time ── */
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [chatId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send message ── */
  const handleSend = async () => {
    if (!message.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: message.trim(),
      senderId: auth.currentUser?.uid,
      senderName: auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Founder",
      // Use "founder" role so mentor's Messages.tsx shows it on the left side
      sender: "founder",
      role: "founder",
      timestamp: serverTimestamp(),
            createdAt: serverTimestamp(),

    });

    setMessage("");
  };

  /* ── Attach file ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: `📎 ${file.name}`,
      senderId: auth.currentUser?.uid,
      senderName: auth.currentUser?.email?.split("@")[0] || "Founder",
      sender: "founder",
      role: "founder",
      timestamp: serverTimestamp(),
            createdAt: serverTimestamp(),

    });
  };

  const handleConfirmMeeting = () => {
    if (!meetingDate) {
      alert("Please select day, date and time");
      return;
    }
    const formattedDate = new Date(meetingDate).toLocaleString();
    setShowCalendar(false);
    alert(`📅 Meeting Scheduled on ${formattedDate}`);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const emojis = ["😊", "🚀", "👍", "🔥", "💡", "🎯"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* ── HEADER ── */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        {founder ? (
          <>
            {founder.photo ? (
              <img
                src={founder.photo}
                alt={founder.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}>
                {founder.name?.[0]?.toUpperCase() || "M"}
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-medium text-black">{founder.name}</h2>
              {founder.startup && (
                <p className="text-sm text-gray-600">{founder.startup}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-600">
                  {founder.online ? "Active Now" : "Online"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 flex-1">Loading...</p>
        )}

        {/* Schedule Meeting */}
        <div className="relative">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            <Video size={16} />
            Schedule Meeting
          </button>

          {showCalendar && (
            <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-md p-4 space-y-3 z-50 w-64">
              <input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full"
              />
              <button
                onClick={handleConfirmMeeting}
                className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700"
              >
                Confirm Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ background: "#f3e8ff" }}>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Say hello to {founder?.name?.split(" ")[0] || "your mentor"}!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          // Support both "sender" and "role" fields for compatibility
          const isMe = msg.senderId === auth.currentUser?.uid
            || msg.sender === "founder"
            || msg.role === "founder";
          // If senderId exists, use it for accurate comparison
          const isMine = msg.senderId
            ? msg.senderId === auth.currentUser?.uid
            : isMe;

          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md rounded-2xl px-4 py-3 shadow-sm ${
                  isMine
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {(msg.timestamp || msg.createdAt)?.toDate?.().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || ""}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 relative">
          <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <Paperclip size={20} />
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-14 left-10 bg-white border shadow-md rounded-lg p-2 flex gap-2 z-10">
              {emojis.map((emoji, index) => (
                <span
                  key={index}
                  className="cursor-pointer text-xl"
                  onClick={() => {
                    setMessage(message + emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black bg-white"
          />

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2 rounded-lg disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Keep default export for backward compatibility with route-based usage
export default ChatPage;