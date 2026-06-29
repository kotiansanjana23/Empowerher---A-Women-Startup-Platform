
import { useEffect, useRef, useState } from "react";
import { db, auth } from "../../../../../firebase";
import EmojiPicker from "emoji-picker-react";
import { Rnd } from "react-rnd";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  setDoc,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ArrowLeft, Send, Paperclip, Smile, ExternalLink } from "lucide-react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  role: "founder" | "mentor";
  timestamp: any;
}

interface ChatPageProps {
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  mentorRole: string;
  onBack: () => void;
}
/* ── Render text with clickable URLs ── */
function renderText(text: string, isSelf: boolean) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 underline break-all font-medium ${
            isSelf ? "text-purple-100 hover:text-white" : "text-purple-600 hover:text-purple-800"
          }`}
        >
          <ExternalLink size={11} className="shrink-0" />
          {part}
        </a>
      );
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
    ));
  });
}

export function ChatPage({  mentorId,mentorName, mentorAvatar, mentorRole, onBack }: ChatPageProps) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading]     = useState(true);
  const bottomRef                 = useRef<HTMLDivElement>(null);

const chatId = [
  auth.currentUser?.uid,
  mentorId
]
  .sort()
  .join("_");

  const mentorInitials = mentorName
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  /* ── Create/update parent chat doc so mentor inbox can discover it ── */
  useEffect(() => {
    if (!chatId || !auth.currentUser) return;
    const email = auth.currentUser.email || "";
    setDoc(doc(db, "chats", chatId), {
      founderName:  auth.currentUser.displayName || email.split("@")[0] || "Founder",
      founderPhoto: auth.currentUser.photoURL || "",
      founderEmail: email,
      startup:      "Your Startup",
      online:       true,
      mentorName,
      mentorAvatar,
      lastUpdated:  serverTimestamp(),
    }, { merge: true });
  }, [chatId]);

  /* ── Realtime messages ── */
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
  }, [chatId]);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const handleEmojiClick = (emojiData: any) => {
  setNewMessage((prev) => prev + emojiData.emoji);
};
  /* ── Send text message ── */
  const sendMessage = async (text: string) => {
    if (!text.trim() || !auth.currentUser) return;
    const name = auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Founder";
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId:   auth.currentUser.uid,
      senderName: name,
      role:       "founder",
      timestamp:  serverTimestamp(),
    });
    setDoc(doc(db, "chats", chatId), {
      lastMessage:     text,
      lastMessageTime: serverTimestamp(),
      online:          true,
    }, { merge: true });
  };

  const handleSend = async () => {
    const msg = newMessage.trim();
    if (!msg) return;
    setNewMessage("");
    await sendMessage(msg);
  };

  /* ── Create Jitsi meeting + send link as message ── */
  const handleCreateMeeting = async () => {
    const room = `empowerher-${Date.now()}`;
    const link = `https://meet.jit.si/${room}`;
    await sendMessage(`🎥 Join our video session:\n${link}`);
    window.open(link, "_blank");
  };

  return (
    /* ── Outer: page wrapper — centers the card ── */
   

      <Rnd
  default={{
    x: window.innerWidth - 420,
    y: 80,
    width: 380,
    height: 600,
  }}
  minWidth={320}
  minHeight={450}
  maxWidth={700}
  maxHeight={900}
  bounds="window"
  className="z-50"
>
  <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarImage src={mentorAvatar} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-semibold">
                {mentorInitials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{mentorName}</p>
            <p className="text-xs text-green-500">Online</p>
          </div>

          {/* Mini create meeting button in header */}
         
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-sm">Say hello to {mentorName}!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.role === "founder";
              const time   = msg.timestamp?.toDate?.().toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit"
              }) || "";

              return (
                <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isSelf
                      ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                  }`}>
                    <div>{renderText(msg.text, isSelf)}</div>
                    <p className={`text-[10px] mt-1 ${isSelf ? "text-purple-200 text-right" : "text-gray-400"}`}>
                      {time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 placeholder-gray-400"
            />

            {/* 🎥 Create Meeting button */}
          <div className="relative">
  <button
    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
    className="p-2 rounded-xl bg-gray-100 hover:bg-yellow-100 hover:text-yellow-600 text-gray-500 transition"
  >
    <Smile size={18} />
  </button>

  {showEmojiPicker && (
    <div className="absolute bottom-14 right-0 z-50">
      <EmojiPicker onEmojiClick={handleEmojiClick} />
    </div>
  )}
</div>


            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>
    
    </Rnd>
  );
}