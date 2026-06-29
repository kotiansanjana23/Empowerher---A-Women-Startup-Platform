

import { useState, useEffect, useRef } from "react";
import {
  Search, Send, Paperclip,
  Image as ImageIcon, FileText, Loader2, Smile,
  X, Phone, Linkedin, ExternalLink,MoreVertical,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp, getDocs,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../../../../firebase";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

/* ─── Cloudinary config ─── */
const CLOUDINARY_CLOUD_NAME    = "dcgm3doyn";
const CLOUDINARY_UPLOAD_PRESET = "empowerher";

async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ fileURL: string; fileType: string; fileName: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
        resolve({ fileURL: res.secure_url, fileType: isImage ? "image" : "document", fileName: file.name });
      } else { reject(new Error("Cloudinary upload failed")); }
    };
    xhr.onerror = () => reject(new Error("Upload error"));
    xhr.send(formData);
  });
}

/* ─── Types ─── */
interface Conversation {
  id: string;
  founderId: string;
  founderName: string;
  founderPhoto: string;
  founderStartup: string;
  opportunityTitle: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  chatRoomId: string;
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
}

// NEW: Founder profile loaded from "founders" Firestore collection
interface FounderProfile {
  id: string;
  name?: string;
  photo?: string;
  startup?: string;
  bio?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  industry?: string;
  fundingRequired?: string;
  startupStage?: string;
  interests?: string[];
  pitchDeckUrl?: string;
  online?: boolean;
}

function relativeTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTimestamp(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */
export default function Messages() {
  const [investorId,       setInvestorId]       = useState<string>("");
  const [investorName,     setInvestorName]      = useState<string>("Investor");
  const [conversations,    setConversations]     = useState<Conversation[]>([]);
  const [filtered,         setFiltered]          = useState<Conversation[]>([]);
  const [selectedConv,     setSelectedConv]      = useState<Conversation | null>(null);
  const [messages,         setMessages]          = useState<ChatMessage[]>([]);
  const [messageText,      setMessageText]       = useState("");
  const [search,           setSearch]            = useState("");
  const [sending,          setSending]           = useState(false);
  const [uploadPct,        setUploadPct]         = useState<number | null>(null);
  const [showEmoji,        setShowEmoji]         = useState(false);
  const [loadingConvs,     setLoadingConvs]      = useState(true);
  const [loadingMsgs,      setLoadingMsgs]       = useState(false);

  // NEW: profile drawer state
  const [showProfile,      setShowProfile]       = useState(false);
  const [founderProfile,   setFounderProfile]    = useState<FounderProfile | null>(null);
  const [loadingProfile,   setLoadingProfile]    = useState(false);
  // NEW: calling modal state
  const [calling,          setCalling]           = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);
  const msgUnsubRef = useRef<(() => void) | null>(null);
  // NEW: profile unsubscribe ref
  const profileUnsubRef = useRef<(() => void) | null>(null);

  /* ── Get current investor ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setInvestorId(user.uid);
      setInvestorName(user.displayName || user.email?.split("@")[0] || "Investor");
    });
    return unsub;
  }, []);

  /* ── Load conversations from fundingRequests ── */
  useEffect(() => {
    if (!investorId) return;

    const q = query(
      collection(db, "fundingRequests"),
      where("investorId", "==", investorId),
      where("status", "==", "Connected"),
    );

    const unsub = onSnapshot(q, async (snap) => {
      const convPromises = snap.docs.map(async (d) => {
        const data = d.data();
        const founderId   = data.founderId   || "";
        const chatRoomId  = [investorId, founderId].sort().join("_");

        let lastMessage = "No messages yet";
        let lastTime    = "";
        let unread      = 0;

        try {
          const msgQ = query(
            collection(db, "investorChats", chatRoomId, "messages"),
            orderBy("createdAt", "desc"),
          );
          const msgSnap = await getDocs(msgQ);
          if (!msgSnap.empty) {
            const lastDoc  = msgSnap.docs[0].data();
            lastMessage    = lastDoc.fileURL
              ? (lastDoc.text || "📎 Attachment")
              : (lastDoc.text || "");
            lastTime       = relativeTime(lastDoc.createdAt);
            unread         = msgSnap.docs.filter(
              m => m.data().senderId === founderId && !m.data().seen
            ).length;
          }
        } catch {}

        return {
          id:               d.id,
          founderId,
          founderName:      data.founderName    || data.founder    || "Founder",
          founderPhoto:     data.founderPhoto   || data.founderAvatar || "",
          founderStartup:   data.startupName    || data.startup    || "",
          opportunityTitle: data.opportunityTitle || data.title    || "Funding Opportunity",
          lastMessage,
          lastTime,
          unread,
          chatRoomId,
        } as Conversation;
      });

      const convs = await Promise.all(convPromises);
      convs.sort((a, b) => b.unread - a.unread);
      setConversations(convs);
      setFiltered(convs);
      setSelectedConv(prev => prev ?? (convs[0] || null));
      setLoadingConvs(false);
    });

    return unsub;
  }, [investorId]);

  /* ── Search filter ── */
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(conversations);
    } else {
      const s = search.toLowerCase();
      setFiltered(
        conversations.filter(c =>
          c.founderName.toLowerCase().includes(s) ||
          c.founderStartup.toLowerCase().includes(s) ||
          c.opportunityTitle.toLowerCase().includes(s)
        )
      );
    }
  }, [search, conversations]);

  /* ── Realtime messages for selected conversation ── */
  useEffect(() => {
    if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    if (!selectedConv) { setMessages([]); return; }

    setLoadingMsgs(true);
    const q = query(
      collection(db, "investorChats", selectedConv.chatRoomId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map(d => ({
        id: d.id, ...(d.data() as Omit<ChatMessage, "id">),
      }));
      setMessages(msgs);
      setLoadingMsgs(false);
    });

    msgUnsubRef.current = unsub;
    return () => { unsub(); msgUnsubRef.current = null; };
  }, [selectedConv?.chatRoomId]);

  /* ── NEW: Realtime founder profile listener ── */
  useEffect(() => {
    // Clean up previous profile listener
    if (profileUnsubRef.current) { profileUnsubRef.current(); profileUnsubRef.current = null; }
    if (!selectedConv?.founderId) { setFounderProfile(null); return; }

    setLoadingProfile(true);

    const profileUnsub = onSnapshot(
      doc(db, "founders", selectedConv.founderId),
      (snap) => {
        if (snap.exists()) {
          setFounderProfile({ id: snap.id, ...(snap.data() as Omit<FounderProfile, "id">) });
        } else {
          // Fallback: build a minimal profile from conversation data
          setFounderProfile({
            id:      selectedConv.founderId,
            name:    selectedConv.founderName,
            photo:   selectedConv.founderPhoto,
            startup: selectedConv.founderStartup,
          });
        }
        setLoadingProfile(false);
      },
      (err) => {
        console.error("Founder profile listener error:", err);
        setLoadingProfile(false);
      }
    );

    profileUnsubRef.current = profileUnsub;
    return () => { profileUnsub(); profileUnsubRef.current = null; };
  }, [selectedConv?.founderId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [messages]);

  /* ── Close emoji on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Close profile drawer when conversation changes ── */
  useEffect(() => {
    setShowProfile(false);
  }, [selectedConv?.id]);

  /* ── Send text message ── */
  async function sendMessage(extra?: { fileURL: string; fileType: string; fileName: string }) {
    if (!selectedConv || !investorId) return;
    const text = messageText.trim();
    if (!text && !extra?.fileURL) return;
    setSending(true);
    setMessageText("");
    try {
      await addDoc(
        collection(db, "investorChats", selectedConv.chatRoomId, "messages"),
        {
          text:       text || "",
          senderId:   investorId,
          senderName: investorName,
          fileURL:    extra?.fileURL   || null,
          fileType:   extra?.fileType  || null,
          fileName:   extra?.fileName  || null,
          createdAt:  serverTimestamp(),
          seen:       false,
        }
      );
    } catch (e) { console.error("sendMessage", e); }
    setSending(false);
  }

  /* ── File upload ── */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      setUploadPct(0);
      const result = await uploadToCloudinary(file, pct => setUploadPct(pct));
      setUploadPct(null);
      await sendMessage(result);
    } catch (err) {
      console.error("upload failed", err);
      setUploadPct(null);
    }
  }

  /* ── Emoji ── */
  function handleEmojiClick(emojiData: EmojiClickData) {
    setMessageText(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  }

  const isMe = (msg: ChatMessage) => msg.senderId === investorId;

  /* ── NEW: open profile drawer ── */
  function openProfile() {
    setShowProfile(true);
  }

  /* ════════════════════════════════════════
     RENDER
     ════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Chat with founders and discuss investment opportunities</p>
      </div>

      {/* Main layout — relative so the drawer stays within this container */}
      <div className="relative grid grid-cols-3 gap-6 h-[calc(100vh-12rem)]">

        {/* ── Conversations List ── */}
        <Card className="p-4 bg-white/70 backdrop-blur-sm border border-purple-100 overflow-hidden flex flex-col">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search messages..."
                className="pl-10 bg-white border-purple-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loadingConvs ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm">No conversations yet.</p>
                <p className="text-xs mt-1">Connected founders will appear here.</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedConv?.id === conv.id
                      ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200"
                      : "bg-white hover:bg-purple-50 border-transparent"
                  } border`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {conv.founderPhoto ? (
                        <img
                          src={conv.founderPhoto}
                          alt={conv.founderName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                          {conv.founderName?.[0] || "F"}
                        </div>
                      )}
                      {conv.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {conv.unread > 9 ? "9+" : conv.unread}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {conv.founderName}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-1">{conv.lastTime}</span>
                      </div>
                      <p className="text-xs text-purple-600 mb-1 truncate">{conv.founderStartup || conv.opportunityTitle}</p>
                      <p className={`text-sm truncate ${conv.unread > 0 ? "font-medium text-gray-800" : "text-gray-600"}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* ── Chat Window ── */}
        <div className="col-span-2">
          <Card className="h-full bg-white/70 backdrop-blur-sm border border-purple-100 flex flex-col">
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a conversation to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* ── Chat Header — avatar & name are now clickable ── */}
                <div className="p-4 border-b border-purple-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {/* CHANGED: added onClick + cursor-pointer + hover ring */}
                    <button
                      onClick={openProfile}
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 hover:opacity-90 transition-opacity"
                      aria-label="View founder profile"
                    >
                      {selectedConv.founderPhoto ? (
                        <img
                          src={selectedConv.founderPhoto}
                          alt={selectedConv.founderName}
                          className="w-12 h-12 rounded-full border-2 border-purple-200 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                          {selectedConv.founderName?.[0] || "F"}
                        </div>
                      )}
                    </button>

                    <div>
                      {/* CHANGED: name is also clickable */}
                      <button
                        onClick={openProfile}
                        className="font-semibold text-gray-900 hover:text-purple-700 transition-colors text-left focus:outline-none"
                      >
                        {selectedConv.founderName}
                      </button>
                      <p className="text-sm text-purple-600">{selectedConv.founderStartup || selectedConv.opportunityTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {loadingMsgs ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <p className="text-sm">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${isMe(msg) ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isMe(msg)
                              ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                              : "bg-white border border-purple-100 text-gray-900"
                          } rounded-2xl p-4`}
                        >
                          {msg.fileURL && (
                            <a
                              href={msg.fileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-xs underline mb-2 ${
                                isMe(msg) ? "text-purple-200" : "text-purple-600"
                              }`}
                            >
                              {msg.fileType === "image"
                                ? <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                : <FileText   className="w-3.5 h-3.5 flex-shrink-0" />
                              }
                              <span className="truncate max-w-[180px]">
                                {msg.fileName || "📎 Attachment"}
                              </span>
                            </a>
                          )}
                          {msg.text && (
                            <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                          )}
                          <p className={`text-xs mt-2 ${isMe(msg) ? "text-purple-200" : "text-gray-500"}`}>
                            {formatTimestamp(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {uploadPct !== null && (
                    <div className="flex justify-end">
                      <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-purple-700 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading… {uploadPct}%
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Emoji picker */}
                {showEmoji && (
                  <div ref={emojiRef} className="absolute bottom-[80px] left-[35%] z-50 shadow-xl">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      height={350}
                      width={300}
                      skinTonesDisabled
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-purple-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost" size="sm"
                      className="text-purple-600 hover:bg-purple-50"
                      onClick={() => setShowEmoji(p => !p)}
                    >
                      <Smile className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost" size="sm"
                      className="text-purple-600 hover:bg-purple-50"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      onChange={handleFileChange}
                    />

                    <Input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 bg-white border-purple-200"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />

                    <Button
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => sendMessage()}
                      disabled={sending || (!messageText.trim() && uploadPct !== null)}
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ════════════════════════════════════════
            NEW: PROFILE DRAWER
            Slides in from the right, sits inside the grid container.
            ════════════════════════════════════════ */}
        <div
          className={`
            absolute top-0 right-0 h-full w-[360px] z-40
            transform transition-transform duration-300 ease-in-out
            ${showProfile ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="h-full bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden">

            {/* ── Gradient header ── */}
            <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 px-6 pt-6 pb-8 flex-shrink-0">
              {/* Close button */}
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                aria-label="Close profile"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Avatar */}
              <div className="flex flex-col items-center mt-2">
                <div className="relative">
                  {(founderProfile?.photo || selectedConv?.founderPhoto) ? (
                    <img
                      src={founderProfile?.photo || selectedConv?.founderPhoto}
                      alt={founderProfile?.name || selectedConv?.founderName}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-white/40 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-white/30 flex items-center justify-center text-white font-bold text-3xl border-4 border-white/40 shadow-lg">
                      {(founderProfile?.name || selectedConv?.founderName)?.[0] || "F"}
                    </div>
                  )}
                  {/* Online indicator */}
                  {founderProfile?.online && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                  )}
                </div>

                <h2 className="mt-3 text-xl font-bold text-white text-center leading-tight">
                  {founderProfile?.name || selectedConv?.founderName || "Founder"}
                </h2>
                <p className="text-purple-100 text-sm mt-0.5 text-center">
                  {founderProfile?.startup || selectedConv?.founderStartup || ""}
                </p>

                {founderProfile?.online !== undefined && (
                  <span className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                    founderProfile.online
                      ? "bg-green-400/20 text-green-100"
                      : "bg-white/10 text-purple-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${founderProfile.online ? "bg-green-400" : "bg-purple-300"}`} />
                    {founderProfile.online ? "Active now" : "Offline"}
                  </span>
                )}
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {loadingProfile ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : (
                <>
                  {/* Action buttons */}
                  <div className="px-4 py-4 grid grid-cols-2 gap-2 border-b border-purple-50">
                    <button
                      onClick={() => { setCalling(true); setShowProfile(false); }}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all col-span-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call Founder
                    </button>

                    {founderProfile?.pitchDeckUrl && (
                      <a
                        href={founderProfile.pitchDeckUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-all col-span-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Pitch Deck
                      </a>
                    )}

                    {founderProfile?.linkedin && (
                      <a
                        href={founderProfile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-50 transition-all col-span-1"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {/* Bio */}
                  {founderProfile?.bio && (
                    <div className="px-5 py-4 border-b border-purple-50">
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">About</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{founderProfile.bio}</p>
                    </div>
                  )}

                  {/* Details */}
                  <div className="px-5 py-4 space-y-3 border-b border-purple-50">
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Details</p>

                    {founderProfile?.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Email</p>
                          <a href={`mailto:${founderProfile.email}`} className="text-sm text-purple-600 hover:underline truncate block">
                            {founderProfile.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {founderProfile?.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Phone</p>
                          <p className="text-sm text-gray-700">{founderProfile.phone}</p>
                        </div>
                      </div>
                    )}

                    {founderProfile?.location && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Location</p>
                          <p className="text-sm text-gray-700">{founderProfile.location}</p>
                        </div>
                      </div>
                    )}

                    {founderProfile?.industry && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Industry</p>
                          <p className="text-sm text-gray-700">{founderProfile.industry}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Startup info */}
                  {(founderProfile?.fundingRequired || founderProfile?.startupStage) && (
                    <div className="px-5 py-4 border-b border-purple-50">
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Startup</p>
                      <div className="grid grid-cols-2 gap-3">
                        {founderProfile?.startupStage && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-1">Stage</p>
                            <p className="text-sm font-semibold text-purple-700">{founderProfile.startupStage}</p>
                          </div>
                        )}
                        {founderProfile?.fundingRequired && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-1">Seeking</p>
                            <p className="text-sm font-semibold text-purple-700">{founderProfile.fundingRequired}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interests / tags */}
                  {founderProfile?.interests && founderProfile.interests.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {founderProfile.interests.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Backdrop: clicking outside drawer closes it (stays within container) ── */}
        {showProfile && (
          <div
            className="absolute inset-0 z-30 bg-black/10 rounded-lg"
            onClick={() => setShowProfile(false)}
          />
        )}

        {/* ── Calling Modal ── */}
        {calling && selectedConv && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="bg-white rounded-3xl p-10 text-center shadow-2xl w-80 flex flex-col items-center">
              {/* Pulsing avatar */}
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-32 h-32 rounded-full bg-purple-300 animate-ping opacity-20" />
                <div className="absolute w-24 h-24 rounded-full bg-purple-400 animate-ping opacity-20" style={{ animationDelay: "0.3s" }} />
                {selectedConv.founderPhoto ? (
                  <img
                    src={selectedConv.founderPhoto}
                    alt={selectedConv.founderName}
                    className="relative w-20 h-20 rounded-full border-4 border-purple-400 object-cover shadow-lg z-10"
                  />
                ) : (
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-purple-300 shadow-lg z-10">
                    {selectedConv.founderName?.[0] || "F"}
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                {selectedConv.founderName}
              </h2>
              <p className="text-gray-400 text-sm mt-1 mb-8">Calling...</p>

              {/* End call button */}
              <button
                onClick={() => setCalling(false)}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg"
                aria-label="End call"
              >
                {/* Phone-off icon drawn inline */}
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 12.5l2.5 2.5m0 0l-2.5 2.5M19 15H5m7-9a9 9 0 00-9 9" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5.5C3 14.06 9.94 21 18.5 21c.386 0 .77-.014 1.149-.042a.75.75 0 00.698-.725v-3.042a.75.75 0 00-.63-.74l-2.55-.425a.75.75 0 00-.737.285l-.92 1.23a12.45 12.45 0 01-5.81-5.81l1.23-.92a.75.75 0 00.285-.737l-.425-2.55a.75.75 0 00-.74-.63H3.767a.75.75 0 00-.724.698A11.1 11.1 0 003 5.5z" />
                </svg>
              </button>
              <p className="text-xs text-gray-400 mt-3">Tap to end call</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}