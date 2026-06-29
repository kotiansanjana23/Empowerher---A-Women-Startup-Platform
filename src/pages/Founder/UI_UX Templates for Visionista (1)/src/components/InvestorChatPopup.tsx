/**
 * InvestorChatPopup.tsx
 *
 * Realtime popup chat between a founder and an investor.
 * - Messages stored in Firestore collection: investorChats
 * - File/image/PDF uploads via Cloudinary (reuses your existing upload logic)
 * - Emoji picker via emoji-picker-react
 * - Fully realtime via onSnapshot
 *
 * Install deps if not already present:
 *   npm install emoji-picker-react
 */

import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../../../firebase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  X, Send, Smile, Paperclip, Image as ImageIcon,
  FileText, Loader2, Download,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  fileURL?: string;
  fileType?: "image" | "pdf" | "doc" | "other";
  fileName?: string;
  createdAt: any;
  seen: boolean;
}

interface Props {
  investorId: string;
  investorName: string;
  investorPhoto: string;
  investorCompany?: string;
  onClose: () => void;
}

/* ─── Cloudinary upload helper ───────────────────────────── */
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset";
const CLOUDINARY_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    || "your_cloud_name";

async function uploadToCloudinary(file: File): Promise<{ url: string; type: "image" | "pdf" | "doc" | "other" }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const resourceType = file.type.startsWith("image/") ? "image" : "raw";
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();

  let type: "image" | "pdf" | "doc" | "other" = "other";
  if (file.type.startsWith("image/"))        type = "image";
  else if (file.type === "application/pdf")  type = "pdf";
  else if (file.type.includes("word") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) type = "doc";

  return { url: data.secure_url, type };
}

/* ─── chatId helper ──────────────────────────────────────── */
function getChatId(a: string, b: string) {
  return [a, b].sort().join("__");
}

/* ─── Component ──────────────────────────────────────────── */
export function InvestorChatPopup({
  investorId, investorName, investorPhoto, investorCompany = "", onClose,
}: Props) {
  const currentUser = auth.currentUser;
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [text,          setText]          = useState("");
  const [showEmoji,     setShowEmoji]     = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [sending,       setSending]       = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatId = currentUser ? getChatId(currentUser.uid, investorId) : "";

  /* ── Realtime listener ── */
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "investorChats"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map(d => ({
        id: d.id, ...(d.data() as Omit<ChatMessage, "id">),
      }));
      setMessages(msgs);
      // Mark unseen investor messages as seen
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.senderId === investorId && !data.seen) {
          updateDoc(doc(db, "investorChats", d.id), { seen: true }).catch(() => {});
        }
      });
    });
    return unsub;
  }, [chatId, investorId]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send text/file message ── */
  async function sendMessage(fileURL?: string, fileType?: "image"|"pdf"|"doc"|"other", fileName?: string) {
    if (!currentUser || (!text.trim() && !fileURL)) return;
    setSending(true);
    try {
      await addDoc(collection(db, "investorChats"), {
        chatId,
        senderId:   currentUser.uid,
        receiverId: investorId,
        message:    text.trim(),
        fileURL:    fileURL   || null,
        fileType:   fileType  || null,
        fileName:   fileName  || null,
        createdAt:  serverTimestamp(),
        seen:       false,
      });
      setText("");
    } catch (e) { console.error("sendMessage", e); }
    setSending(false);
  }

  /* ── Handle file pick ── */
  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, type } = await uploadToCloudinary(file);
      await sendMessage(url, type, file.name);
    } catch (err) { console.error("upload error", err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ── Emoji click ── */
  function handleEmoji(emojiData: EmojiClickData) {
    setText(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  }

  /* ── Helpers ── */
  function formatTime(ts: any) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const initials = investorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    /* ── Overlay ── */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-6 sm:pb-6 bg-black/30 backdrop-blur-sm">
      {/* ── Chat window ── */}
      <div className="w-full max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
           style={{ height: "min(600px, 90vh)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white/40">
              {investorPhoto ? <AvatarImage src={investorPhoto} /> : <AvatarFallback className="bg-purple-400 text-white text-sm">{initials}</AvatarFallback>}
            </Avatar>
            <div>
              <p className="font-semibold text-sm leading-tight">{investorName}</p>
              {investorCompany && <p className="text-xs text-purple-200 leading-tight">{investorCompany}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <Send className="h-6 w-6 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Start a conversation</p>
              <p className="text-xs mt-1 text-gray-400">Say hello to {investorName}!</p>
            </div>
          )}

          {messages.map(msg => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                  isMe
                    ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-sm"
                    : "bg-white text-gray-900 border border-gray-100 rounded-bl-sm"
                }`}>
                  {/* File attachment */}
                  {msg.fileURL && (
                    <div className="mb-2">
                      {msg.fileType === "image" ? (
                        <img src={msg.fileURL} alt="attachment" className="rounded-lg max-w-full max-h-40 object-cover" />
                      ) : (
                        <a href={msg.fileURL} target="_blank" rel="noopener noreferrer"
                           className={`flex items-center gap-2 text-xs underline ${isMe ? "text-purple-200" : "text-purple-600"}`}>
                          {msg.fileType === "pdf" ? <FileText className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                          <span className="truncate max-w-[140px]">{msg.fileName || "Attachment"}</span>
                        </a>
                      )}
                    </div>
                  )}
                  {msg.message && <p className="text-sm leading-relaxed break-words">{msg.message}</p>}
                  <p className={`text-[10px] mt-1 text-right ${isMe ? "text-purple-200" : "text-gray-400"}`}>
                    {formatTime(msg.createdAt)}
                    {isMe && <span className="ml-1">{msg.seen ? "✓✓" : "✓"}</span>}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Emoji Picker */}
        {showEmoji && (
          <div className="absolute bottom-[72px] right-4 z-50 shadow-xl rounded-xl overflow-hidden">
            <EmojiPicker onEmojiClick={handleEmoji} height={350} width={300} />
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-3">
          <div className="flex items-center gap-2">
            {/* Emoji */}
            <button
              onClick={() => setShowEmoji(p => !p)}
              className="text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0"
            >
              <Smile className="h-5 w-5" />
            </button>

            {/* File picker */}
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx"
              className="hidden" onChange={handleFilePick} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-purple-500" /> : <Paperclip className="h-5 w-5" />}
            </button>

            {/* Text */}
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message…"
              className="flex-1 bg-gray-50 border-gray-200 rounded-full text-sm h-9 px-4 focus-visible:ring-purple-400"
              disabled={sending}
            />

            {/* Send */}
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex-shrink-0"
              onClick={() => sendMessage()}
              disabled={sending || (!text.trim())}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
