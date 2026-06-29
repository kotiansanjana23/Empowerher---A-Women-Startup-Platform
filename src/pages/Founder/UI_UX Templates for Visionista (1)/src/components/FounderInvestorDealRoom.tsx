import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Star, Send, Smile, Pin, Trash2, Reply,
  Check, CheckCheck, X, FileText, TrendingUp, Award,
  ExternalLink, Download, DollarSign, BarChart2,
  Clock, Globe, StickyNote, Plus, Activity,
  Users2, Calculator, Pencil, Save, RefreshCw, Mail,
  Phone, MapPin, Link, Video, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Banknote, Percent, FileSignature, RotateCcw,
  Linkedin, BadgeDollarSign, Sparkles, NotebookPen, Paperclip,
  File, Zap, Globe2, ShieldAlert, Send as SendIcon,
  ThumbsUp, MessageSquare, Building2, Target, Eye,
  Briefcase, TrendingDown, Tag, ArrowLeft, Layers,
  Bell, Lock, Unlock, Shield, BarChart, Heart
} from "lucide-react";
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, setDoc, getDoc, where, getDocs,
  Timestamp, 
} from "firebase/firestore";
import { db, auth } from "../../../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvestorProfile {
  id: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  photo?: string;
  avatar?: string;
  image?: string;
  fund?: string;
  firm?: string;
  company?: string;
  bio?: string;
  sectors?: string[];
  stages?: string[];
  ticketSizeMin?: string;
  ticketSizeMax?: string;
  ticketSize?: string;
  portfolio?: string[];
  linkedIn?: string;
  linkedin?: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  verified?: boolean;
  online?: boolean;
  totalInvestments?: number | string;
  totalDeals?: number | string;
  yearsExperience?: number | string;
}

interface DealConnection {
  id: string;
  investorId: string;
  investorName: string;
  founderId: string;
  founderName: string;
  startupName: string;
  sector: string;
  stage: string;
  description?: string;
  pitchDeckUrl?: string;
  status: "pending" | "accepted" | "passed";
  createdAt: Timestamp;
  fundingStatus?: string;
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
  type: "text" | "meeting" | "file" | "system" | "funding_offer" | "counter_offer";
  meetingData?: { date: string; time: string; link: string; title: string };
  fileData?: { name: string; url: string; size: string; fileType: string };
  offerData?: FundingOffer;
  systemText?: string;
}

interface FundingOffer {
  id?: string;
  fromId: string;
  fromName: string;
  fromRole: "investor" | "founder";
  minAmount: string;
  maxAmount: string;
  equity: string;
  valuation: string;
  terms: string;
  comments?: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  timestamp?: Timestamp;
  isCounter?: boolean;
  counterTo?: string;
}

interface StickyNoteType {
  id: string;
  text: string;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface InvestorFeedback {
  id: string;
  investorId: string;
  investorName: string;
  recId: string;
  startupName: string;
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
  { bg: "bg-pink-100",   border: "border-pink-300",   text: "text-pink-900",   label: "Pink" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-900", label: "Purple" },
  { bg: "bg-green-100",  border: "border-green-300",  text: "text-green-900",  label: "Green" },
  { bg: "bg-blue-100",   border: "border-blue-300",   text: "text-blue-900",   label: "Blue" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-900", label: "Orange" },
];

// ─── Animated Background Orbs ─────────────────────────────────────────────────

const BackgroundOrbs: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
      style={{ background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)" }}
    />
    <motion.div
      animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)" }}
    />
    <motion.div
      animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full"
      style={{ background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)" }}
    />
  </div>
);

// ─── Shimmer Effect ───────────────────────────────────────────────────────────

const ShimmerCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
        animation: "shimmer 3s infinite",
      }}
    />
    {children}
    <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
  </div>
);

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

const EmojiPicker: React.FC<{ onSelect: (e: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
    className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-2xl border border-purple-100 p-3 z-50 grid grid-cols-5 gap-1 w-52"
    style={{ boxShadow: "0 8px 32px rgba(147,51,234,0.18)" }}>
    {EMOJIS.map(e => (
      <button key={e} onClick={() => { onSelect(e); onClose(); }}
        className="text-xl hover:bg-purple-50 rounded-lg p-1.5 transition-colors">{e}</button>
    ))}
  </motion.div>
);

// ─── System Message ───────────────────────────────────────────────────────────

const SystemMessage: React.FC<{ text: string; timestamp: Timestamp }> = ({ text, timestamp }) => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="flex-1 h-px bg-purple-100" />
    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-3 py-1.5">
      <Zap size={11} className="text-purple-400" />
      <span className="text-xs text-purple-500 font-medium">{text}</span>
    </div>
    <div className="flex-1 h-px bg-purple-100" />
  </div>
);

// ─── Meeting Card (inside chat) ───────────────────────────────────────────────

const MeetingCard: React.FC<{ meetingData: Message["meetingData"]; isOwn: boolean }> = ({ meetingData, isOwn }) => {
  if (!meetingData) return null;
  return (
    <div className={`min-w-[240px] rounded-2xl border-2 overflow-hidden ${isOwn ? "border-pink-300/50 bg-white/10" : "border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50"}`}>
      <div className={`px-4 py-2.5 flex items-center gap-2 ${isOwn ? "bg-white/20" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
        <Video size={14} className="text-white flex-shrink-0" />
        <span className={`text-xs font-bold uppercase tracking-wide ${isOwn ? "text-white/80" : "text-white"}`}>Meeting Invite</span>
      </div>
      <div className="p-4 space-y-1">
        <p className={`font-bold text-sm ${isOwn ? "text-white" : "text-purple-900"}`}>{meetingData.title}</p>
        <p className={`text-xs ${isOwn ? "text-pink-200" : "text-gray-500"}`}>📅 {meetingData.date} at {meetingData.time}</p>
        {meetingData.link && (
          <a href={meetingData.link} target="_blank" rel="noreferrer"
            className={`mt-2 flex items-center justify-center gap-2 text-xs font-bold rounded-xl px-3 py-2 transition-colors ${
              isOwn ? "bg-white/25 hover:bg-white/35 text-white border border-white/30" : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-md"
            }`}>
            <Video size={12} /> Join Meeting →
          </a>
        )}
      </div>
    </div>
  );
};

// ─── File Bubble ──────────────────────────────────────────────────────────────

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
            <a href={fileData.url} download target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100"><Download size={12} /></a>
          </div>
        </div>
      ) : (
        <a href={fileData.url} target="_blank" rel="noreferrer" download className="flex items-center gap-3 hover:opacity-90 transition-opacity">
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

// ─── Helper: format INR ───────────────────────────────────────────────────────

/**
 * Converts a raw amount string (which may contain "$", "₹", commas, "L", "Cr", etc.)
 * into a clean ₹ display string using Indian number formatting.
 *
 * Examples:
 *   "$200,000"  → "₹2,00,000"
 *   "₹50L"      → "₹50L"      (already INR shorthand — kept as-is)
 *   "800000"    → "₹8,00,000"
 */
function toINR(raw: string): string {
  if (!raw) return raw;

  // Already using ₹ shorthand (L / Cr) — return as-is
  if (/₹/.test(raw)) return raw;

  // Strip currency symbols and commas to get a clean number string
  const cleaned = raw.replace(/[$,\s]/g, "");

  const num = parseFloat(cleaned);
  if (isNaN(num)) return raw; // non-numeric — return unchanged

  // Indian number formatting (lakhs / crores)
  if (num >= 1_00_00_000) {
    const cr = (num / 1_00_00_000).toFixed(num % 1_00_00_000 === 0 ? 0 : 2);
    return `₹${cr} Cr`;
  }
  if (num >= 1_00_000) {
    const l = (num / 1_00_000).toFixed(num % 1_00_000 === 0 ? 0 : 2);
    return `₹${l} L`;
  }

  // Plain Indian comma formatting for smaller amounts
  const s = Math.round(num).toString();
  let result = s.slice(-3);
  let rest = s.slice(0, -3);
  while (rest.length > 2) {
    result = rest.slice(-2) + "," + result;
    rest = rest.slice(0, -2);
  }
  if (rest) result = rest + "," + result;
  return `₹${result}`;
}

/**
 * Computes implied valuation string in INR from maxAmount + equity strings.
 */
function calcValuationINR(maxAmount: string, equity: string): string {
  const amt = parseFloat(maxAmount.replace(/[^0-9.]/g, ""));
  const eq  = parseFloat(equity);
  if (!isNaN(amt) && !isNaN(eq) && eq > 0) {
    return toINR(String(Math.round((amt / eq) * 100)));
  }
  return "";
}

// ─── Counter Offer Modal ──────────────────────────────────────────────────────

const CounterOfferModal: React.FC<{
  originalOffer: FundingOffer;
  onSubmit: (data: { minAmount: string; maxAmount: string; equity: string; comments: string }) => void;
  onClose: () => void;
  founderName: string;
}> = ({ originalOffer, onSubmit, onClose, founderName }) => {
  const [minAmount, setMinAmount] = useState(originalOffer.minAmount);
  const [maxAmount, setMaxAmount] = useState(originalOffer.maxAmount);
  const [equity, setEquity]       = useState(originalOffer.equity);
  const [comments, setComments]   = useState("");

  const valuation = calcValuationINR(maxAmount, equity);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(88,28,135,0.35)", backdropFilter: "blur(12px)" }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl border border-purple-100 w-full max-w-md overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(147,51,234,0.3)" }}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4 flex items-center gap-3">
          <RotateCcw size={18} className="text-white" />
          <h3 className="font-bold text-white flex-1">Counter Offer</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-5 pt-4 pb-2">
          <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100">
            <p className="text-xs text-purple-500 font-bold mb-1.5">Responding to Investor's Offer</p>
            <div className="flex gap-3 text-xs text-purple-700">
              <span className="font-semibold">{toINR(originalOffer.minAmount)}–{toINR(originalOffer.maxAmount)}</span>
              <span>·</span>
              <span>{originalOffer.equity}% equity</span>
              {originalOffer.valuation && <><span>·</span><span>{toINR(originalOffer.valuation)}</span></>}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-blue-700 mb-2 block flex items-center gap-1.5"><Banknote size={12} /> Your Preferred Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">Minimum</label>
                <input value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="e.g. ₹10,00,000"
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">Maximum</label>
                <input value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="e.g. ₹50,00,000"
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-blue-700 mb-2 block flex items-center gap-1.5"><Percent size={12} /> Your Preferred Equity %</label>
            <div className="flex items-center gap-3">
              <input value={equity} onChange={e => setEquity(e.target.value)} type="number" min="0.1" max="100" step="0.1" placeholder="e.g. 8"
                className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <span className="text-2xl font-bold text-blue-200">%</span>
            </div>
          </div>
          <AnimatePresence>
            {valuation && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70 mb-0.5">Implied Valuation</p>
                    <p className="text-2xl font-bold">{valuation}</p>
                  </div>
                  <Calculator size={22} className="text-white/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <label className="text-xs font-bold text-blue-700 mb-2 block flex items-center gap-1.5"><MessageSquare size={12} /> Your Reasoning / Comments</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)}
              placeholder="Explain your counter terms…"
              className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <button
            onClick={() => onSubmit({ minAmount, maxAmount, equity, comments })}
            disabled={!minAmount || !maxAmount || !equity}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl py-3 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            <SendIcon size={14} /> Send Counter Offer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Feedback Radar Chart ─────────────────────────────────────────────────────

const FeedbackRadar: React.FC<{ scores: Pick<InvestorFeedback, "innovation"|"marketPotential"|"scalability"|"team"|"risk">; overallScore: number }> = ({ scores, overallScore }) => {
  const keys = ["innovation", "marketPotential", "scalability", "team", "risk"] as const;
  const labels = ["Innovation", "Market", "Scale", "Team", "Risk"];
  const colors = ["#7c3aed", "#3b82f6", "#10b981", "#f97316", "#ef4444"];
  const cx = 130, cy = 130, r = 100;
  const angles = keys.map((_, i) => (i / keys.length) * 2 * Math.PI - Math.PI / 2);
  const points = keys.map((k, i) => {
    const val = scores[k] / 10;
    return { x: cx + r * val * Math.cos(angles[i]), y: cy + r * val * Math.sin(angles[i]) };
  });
  const polygon = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={260} height={260} className="mx-auto">
      {[0.2,0.4,0.6,0.8,1.0].map((g, i) => (
        <circle key={i} cx={cx} cy={cy} r={r*g} fill="none" stroke="#e5e7eb" strokeWidth={0.8} />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="#e5e7eb" strokeWidth={0.8} />
      ))}
      <polygon points={polygon} fill="rgba(147,51,234,0.15)" stroke="rgba(147,51,234,0.7)" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={colors[i]} stroke="white" strokeWidth={1.5} />
      ))}
      {angles.map((a, i) => {
        const lx = cx + (r+18) * Math.cos(a);
        const ly = cy + (r+18) * Math.sin(a);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600" fill={colors[i]}>{labels[i]}</text>
        );
      })}
      <text x={cx} y={cy-10} textAnchor="middle" fontSize="24" fontWeight="900" fill="#7c3aed">{overallScore}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize="11" fill="#9ca3af">/ 10</text>
    </svg>
  );
};

// ─── FUNDING TAB ─────────────────────────────────────────────────────────────

const FundingTab: React.FC<{
  dealId: string;
  investorId: string;
  investorName: string;
  founderId: string;
  founderName: string;
  chatId: string;
}> = ({ dealId, investorId, investorName, founderId, founderName, chatId }) => {
  const [offers, setOffers] = useState<(FundingOffer & { docId: string; msgId?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterTarget, setCounterTarget] = useState<FundingOffer | null>(null);
  const messagesRef = collection(db, "mentorInvestorChats", chatId, "messages");

  useEffect(() => {
    const offersRef = collection(db, "fundingOffers", dealId, "offers");
    const q = query(offersRef, orderBy("timestamp", "desc"));
    return onSnapshot(q, snap => {
      setOffers(snap.docs.map(d => ({ docId: d.id, ...d.data() } as FundingOffer & { docId: string })));
      setLoading(false);
    });
  }, [dealId]);

  const handleAccept = async (offer: FundingOffer & { docId: string }) => {
    await updateDoc(doc(db, "fundingOffers", dealId, "offers", offer.docId), {
      status: "accepted", respondedAt: serverTimestamp()
    });
    await addDoc(messagesRef, {
      senderId: "system", senderName: "System",
      text: "", systemText: `🎉 ${founderName} accepted the funding offer!`,
      timestamp: serverTimestamp(), seen: false, pinned: false, replyTo: null, type: "system"
    });
    await addDoc(collection(db, "notifications"), {
      to: investorId, from: founderId, type: "offer_accepted",
      message: `🎉 ${founderName} accepted your funding offer!`,
      read: false, createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "mentorRecommendations", dealId), { fundingStatus: "term_sheet" });
  };

  const handleReject = async (offer: FundingOffer & { docId: string }) => {
    await updateDoc(doc(db, "fundingOffers", dealId, "offers", offer.docId), {
      status: "rejected", respondedAt: serverTimestamp()
    });
    await addDoc(messagesRef, {
      senderId: "system", senderName: "System",
      text: "", systemText: `${founderName} declined the funding offer.`,
      timestamp: serverTimestamp(), seen: false, pinned: false, replyTo: null, type: "system"
    });
    await addDoc(collection(db, "notifications"), {
      to: investorId, from: founderId, type: "offer_rejected",
      message: `${founderName} declined your funding offer.`,
      read: false, createdAt: serverTimestamp(),
    });
  };

  const handleCounter = async (data: { minAmount: string; maxAmount: string; equity: string; comments: string }) => {
    if (!counterTarget) return;
    const originalDocId = (counterTarget as any).docId;
    if (originalDocId) {
      await updateDoc(doc(db, "fundingOffers", dealId, "offers", originalDocId), { status: "countered" });
    }
    await addDoc(collection(db, "fundingOffers", dealId, "offers"), {
      fromId: founderId, fromName: founderName, fromRole: "founder",
      ...data, valuation: "", terms: "", status: "pending",
      timestamp: serverTimestamp(), isCounter: true, counterTo: originalDocId || null,
    });
    await addDoc(messagesRef, {
      senderId: "system", senderName: "System",
      text: "", systemText: `${founderName} sent a counter offer — view in Funding tab`,
      timestamp: serverTimestamp(), seen: false, pinned: false, replyTo: null, type: "system"
    });
    await addDoc(collection(db, "notifications"), {
      to: investorId, from: founderId, type: "counter_offer",
      message: `${founderName} sent a counter offer: ${toINR(data.minAmount)}–${toINR(data.maxAmount)} for ${data.equity}% equity`,
      read: false, createdAt: serverTimestamp(),
    });
    setCounterTarget(null);
  };

  const pendingOffers  = offers.filter(o => o.fromRole === "investor" && o.status === "pending");
  const historyOffers  = offers.filter(o => o.status !== "pending" || o.fromRole === "founder");

  const statusConfig = {
    pending:   { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Awaiting Response" },
    accepted:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  dot: "bg-green-400",  label: "Accepted 🎉" },
    rejected:  { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-600",    dot: "bg-red-400",    label: "Rejected" },
    countered: { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   dot: "bg-blue-400",   label: "Countered" },
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <RefreshCw size={24} className="text-purple-400 animate-spin" />
      <p className="text-sm text-purple-400">Loading funding offers…</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Offers", value: offers.filter(o => o.fromRole === "investor").length, icon: <BadgeDollarSign size={18} />, grad: "from-pink-500 to-purple-600" },
          { label: "Pending",      value: pendingOffers.length,                                  icon: <Clock size={18} />,          grad: "from-amber-400 to-orange-500" },
          { label: "Accepted",     value: offers.filter(o => o.status === "accepted").length,    icon: <CheckCircle size={18} />,    grad: "from-emerald-400 to-green-500" },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`bg-gradient-to-br ${s.grad} rounded-2xl p-4 text-white shadow-lg relative overflow-hidden`}>
            <div className="absolute -bottom-3 -right-3 opacity-20">{React.cloneElement(s.icon, { size: 48 })}</div>
            <div className="relative">
              {s.icon}
              <p className="text-2xl font-black mt-1">{s.value}</p>
              <p className="text-xs text-white/70">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active / Pending Offers */}
      {pendingOffers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="font-bold text-purple-900 text-sm">Pending Offers — Action Required</h3>
          </div>
          <div className="space-y-4">
            {pendingOffers.map((offer, i) => (
              <motion.div key={offer.docId}
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className="bg-gradient-to-br from-purple-50 via-pink-50 to-white rounded-3xl border-2 border-purple-200 shadow-xl overflow-hidden"
                style={{ boxShadow: "0 8px 32px rgba(147,51,234,0.12)" }}>
                {/* Offer Header */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <BadgeDollarSign size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">Funding Offer from {offer.fromName}</p>
                    <p className="text-pink-200 text-xs">{offer.isCounter ? "Counter Offer" : "New Offer"}</p>
                  </div>
                  <span className="flex items-center gap-1.5 bg-amber-400/90 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    <Clock size={11} /> Pending
                  </span>
                </div>

                {/* Offer Details Grid */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Min Amount", value: toINR(offer.minAmount), icon: <Banknote size={14} />, color: "text-purple-600 bg-purple-50 border-purple-100" },
                      { label: "Max Amount", value: toINR(offer.maxAmount), icon: <TrendingUp size={14} />, color: "text-pink-600 bg-pink-50 border-pink-100" },
                      { label: "Equity",     value: `${offer.equity}%`,     icon: <Percent size={14} />,  color: "text-violet-600 bg-violet-50 border-violet-100" },
                    ].map((item, j) => (
                      <div key={j} className={`rounded-2xl p-3 border text-center ${item.color}`}>
                        <div className="flex justify-center mb-1 opacity-60">{item.icon}</div>
                        <p className="font-black text-lg leading-tight">{item.value}</p>
                        <p className="text-[10px] opacity-60 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {offer.valuation && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-3 mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70">Implied Valuation</p>
                        <p className="text-xl font-black text-white">{toINR(offer.valuation)}</p>
                      </div>
                      <Calculator size={24} className="text-white/40" />
                    </div>
                  )}

                  {offer.terms && (
                    <div className="bg-white rounded-2xl p-3 border border-purple-100 mb-4">
                      <p className="text-xs font-bold text-purple-400 mb-1 uppercase tracking-wide">Terms</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{offer.terms}</p>
                    </div>
                  )}
                  {offer.comments && (
                    <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100 mb-4">
                      <p className="text-xs font-bold text-purple-400 mb-1 uppercase tracking-wide">Investor Note</p>
                      <p className="text-sm text-purple-700">{offer.comments}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleAccept(offer)}
                      className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-2xl py-3.5 font-bold text-sm transition-all shadow-lg shadow-green-200 hover:shadow-green-300">
                      <CheckCircle size={18} />
                      <span className="text-xs">Accept</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setCounterTarget(offer)}
                      className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-blue-400 to-violet-500 text-white rounded-2xl py-3.5 font-bold text-sm transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300">
                      <RotateCcw size={18} />
                      <span className="text-xs">Counter</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleReject(offer)}
                      className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-rose-400 to-red-500 text-white rounded-2xl py-3.5 font-bold text-sm transition-all shadow-lg shadow-red-200 hover:shadow-red-300">
                      <XCircle size={18} />
                      <span className="text-xs">Reject</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No pending offers */}
      {pendingOffers.length === 0 && offers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <motion.div
            animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg">
            <BadgeDollarSign size={32} className="text-purple-300" />
          </motion.div>
          <h3 className="font-bold text-purple-900 text-lg">No Funding Offers Yet</h3>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            Once the investor sends a funding offer, it will appear here. You can then accept, reject, or counter.
          </p>
        </div>
      )}

      {/* History */}
      {historyOffers.length > 0 && (
        <div>
          <h3 className="font-bold text-purple-900 text-sm mb-3 flex items-center gap-2">
            <Clock size={14} className="text-purple-400" /> Offer History
          </h3>
          <div className="space-y-3">
            {historyOffers.map((offer, i) => {
              const sc = statusConfig[offer.status];
              return (
                <motion.div key={offer.docId}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`${sc.bg} border ${sc.border} rounded-2xl p-4 flex items-center gap-4`}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">{offer.isCounter ? "Counter" : offer.fromRole === "founder" ? "Your Counter" : "Offer"}</span>
                      <span className="text-xs text-gray-400">from {offer.fromName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{toINR(offer.minAmount)}–{toINR(offer.maxAmount)} · {offer.equity}% equity</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${sc.bg} ${sc.text} border ${sc.border}`}>{sc.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      <AnimatePresence>
        {counterTarget && (
          <CounterOfferModal
            originalOffer={counterTarget}
            founderName={founderName}
            onSubmit={handleCounter}
            onClose={() => setCounterTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Chat Component ──────────────────────────────────────────────────────

const DealChatPane: React.FC<{
  chatId: string;
  founderId: string;
  founderName: string;
  investorId: string;
  investorName: string;
  investorAvatar: string;
  investorOnline: boolean;
  dealId: string;
}> = ({ chatId, founderId, founderName, investorId, investorName, investorAvatar, investorOnline, dealId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pinnedMsgs, setPinnedMsgs] = useState<Message[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesRef = collection(db, "mentorInvestorChats", chatId, "messages");

  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setPinnedMsgs(msgs.filter(m => m.pinned));
      msgs.filter(m => !m.seen && m.senderId !== founderId).forEach(m =>
        updateDoc(doc(messagesRef, m.id), { seen: true })
      );
    });
  }, [chatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (type: Message["type"] = "text", extra?: Partial<Message>) => {
    if (type === "text" && !input.trim()) return;
    await addDoc(messagesRef, {
      senderId: founderId,
      senderName: founderName || "Founder",
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

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "empowerher");
    const res = await fetch("https://api.cloudinary.com/v1_1/dcgm3doyn/auto/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const size = file.size < 1024*1024 ? `${(file.size/1024).toFixed(1)} KB` : `${(file.size/(1024*1024)).toFixed(1)} MB`;
      await sendMessage("file", { text: `Shared a file: ${file.name}`, fileData: { name: file.name, url, size, fileType: file.type } });
    } catch (err) { console.error(err); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const pinMessage   = (msg: Message) => updateDoc(doc(messagesRef, msg.id), { pinned: !msg.pinned });
  const deleteMessage = (id: string)  => deleteDoc(doc(messagesRef, id));
  const formatTime   = (ts: Timestamp) =>
    ts?.toDate ? new Date(ts.toDate()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  const displayMessages = messages.filter(m =>
    m.type !== "funding_offer" && m.type !== "counter_offer"
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-violet-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="relative flex-shrink-0">
          <img src={investorAvatar} alt={investorName} className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${investorOnline ? "bg-green-400" : "bg-gray-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{investorName}</p>
          {investorOnline && <p className="text-xs font-medium text-green-200">● Active now</p>}
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-2.5 py-1.5">
          <Shield size={11} className="text-green-300" />
          <span className="text-white/80 text-[10px] font-semibold">Encrypted</span>
        </div>
        {pinnedMsgs.length > 0 && (
          <button onClick={() => setShowPinned(v => !v)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg px-2.5 py-1.5 transition-colors">
            <Pin size={12} /> {pinnedMsgs.length}
          </button>
        )}
      </div>

      {/* Pinned bar */}
      <AnimatePresence>
        {showPinned && pinnedMsgs.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-50 border-b border-yellow-200 px-3 py-2 flex-shrink-0 overflow-hidden">
            <p className="text-xs font-bold text-yellow-700 mb-1.5 flex items-center gap-1"><Pin size={11} /> Pinned</p>
            {pinnedMsgs.slice(0, 3).map(m => (
              <div key={m.id} className="text-xs text-yellow-800 bg-yellow-100 rounded-lg px-2.5 py-1.5 mb-1 truncate">
                <span className="font-semibold">{m.senderName}:</span> {m.text}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-pink-50 border-b border-pink-100 px-3 py-2 flex items-center gap-2 flex-shrink-0">
            <Reply size={13} className="text-pink-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-pink-400 font-semibold">{replyTo.senderName}</p>
              <p className="text-xs text-pink-600 truncate">{replyTo.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-pink-400 hover:text-pink-600"><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5"
        style={{ background: "linear-gradient(180deg, #fdf2f8 0%, #f5f0ff 100%)" }}>
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <MessageCircle size={26} className="text-purple-400" />
            </motion.div>
            <p className="text-sm text-purple-400 font-medium">Start a conversation with {investorName}</p>
            <p className="text-xs text-purple-300 text-center max-w-[200px]">Chat, share files & schedule meetings here. Funding offers are in the Funding tab.</p>
          </div>
        )}

        {displayMessages.map(msg => {
          if (msg.type === "system") {
            return <SystemMessage key={msg.id} text={msg.systemText || msg.text} timestamp={msg.timestamp} />;
          }
          const isOwn = msg.senderId === founderId;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
              <div className={`max-w-[80%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && <p className="text-[10px] text-purple-400 font-semibold mb-0.5 px-1">{msg.senderName}</p>}
                {msg.replyTo && (
                  <div className={`text-xs px-2.5 py-1.5 rounded-xl mb-1 border-l-2 max-w-full ${isOwn ? "bg-pink-100 border-pink-400 text-pink-700" : "bg-purple-50 border-purple-300 text-purple-600"}`}>
                    <span className="font-semibold">{msg.replyTo.senderName}: </span>
                    {msg.replyTo.text.slice(0, 50)}{msg.replyTo.text.length > 50 ? "…" : ""}
                  </div>
                )}
                {msg.type === "meeting" && msg.meetingData ? (
                  <div className={`rounded-2xl overflow-hidden ${isOwn ? "bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-200/50" : ""}`}>
                    <MeetingCard meetingData={msg.meetingData} isOwn={isOwn} />
                  </div>
                ) : msg.type === "file" && msg.fileData ? (
                  <div className={`px-3.5 py-2.5 rounded-2xl ${isOwn ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-sm shadow-lg shadow-pink-200/50" : "bg-white text-gray-800 border border-purple-100 rounded-bl-sm shadow-sm"}`}>
                    <FileBubble fileData={msg.fileData} isOwn={isOwn} />
                  </div>
                ) : (
                  <div className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwn ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-sm shadow-lg shadow-pink-200/50" : "bg-white text-gray-800 border border-purple-100 rounded-bl-sm shadow-sm"}`}>
                    <p className="break-words">{msg.text}</p>
                    {msg.pinned && <Pin size={10} className="absolute -top-1.5 -right-1 text-yellow-500 bg-white rounded-full shadow-sm" />}
                  </div>
                )}
                <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                  {isOwn && (msg.seen ? <CheckCheck size={11} className="text-pink-400" /> : <Check size={11} className="text-gray-400" />)}
                </div>
                <div className={`hidden group-hover:flex items-center gap-1 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  {[
                    { icon: <Reply size={12} />,  action: () => setReplyTo(msg),       color: "hover:text-purple-500" },
                    { icon: <Pin size={12} />,    action: () => pinMessage(msg),        color: msg.pinned ? "text-yellow-500" : "hover:text-yellow-500" },
                    ...(isOwn ? [{ icon: <Trash2 size={12} />, action: () => deleteMessage(msg.id), color: "hover:text-red-400" }] : []),
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
        <div ref={messagesEndRef} />
      </div>

      {uploading && (
        <div className="bg-purple-50 border-t border-purple-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <RefreshCw size={13} className="text-purple-400 animate-spin" />
          <span className="text-xs text-purple-500">Uploading…</span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-purple-100 bg-white px-3 py-2.5 flex-shrink-0">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.csv" />
        <div className="flex items-center gap-2 bg-pink-50/80 rounded-2xl px-3.5 py-2 border border-pink-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <button onClick={() => fileInputRef.current?.click()}
            className="text-pink-300 hover:text-purple-500 transition-colors rounded-lg p-1 flex-shrink-0">
            <Paperclip size={17} />
          </button>
          <input ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Message investor…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-pink-300 focus:outline-none" />
          <div className="flex items-center gap-1.5 relative">
            <button onClick={() => setShowEmoji(v => !v)} className="text-pink-300 hover:text-pink-500 transition-colors rounded-lg p-1">
              <Smile size={18} />
            </button>
            <AnimatePresence>
              {showEmoji && <EmojiPicker onSelect={e => setInput(v => v + e)} onClose={() => setShowEmoji(false)} />}
            </AnimatePresence>
            <button onClick={() => sendMessage()} disabled={!input.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-2 hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm shadow-pink-200">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ investor: InvestorProfile; deal: DealConnection }> = ({ investor, deal }) => {
  const avatar = investor.photoURL || investor.photo || investor.avatar || investor.image
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${investor.id}`;
  const name = investor.fullName || investor.name || investor.displayName || "Investor";
  const fund = investor.fund || investor.firm || investor.company || "Investment Fund";

  const links = [
    { label: "LinkedIn", href: investor.linkedIn || investor.linkedin, icon: <Linkedin size={13} />, color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
    { label: "Website",  href: investor.website,                       icon: <Globe size={13} />,    color: "text-purple-600 border-purple-200 hover:bg-purple-50" },
    { label: "Email",    href: investor.email ? `mailto:${investor.email}` : undefined, icon: <Mail size={13} />, color: "text-pink-600 border-pink-200 hover:bg-pink-50" },
  ].filter(l => l.href);

  const stats = [
{ label: "Funding Range", value: ((investor as any).funding || "—").toString().replace(/\$/g, "₹"), icon: <BadgeDollarSign size={16} />, color: "from-purple-100 to-purple-50 text-purple-700" },
    { label: "Interests",     value: (investor as any).interests || "—".toString().replace(/\$/g, "₹"),  icon: <Target size={16} />,          color: "from-pink-100 to-pink-50 text-pink-700" },
    { label: "Company Size",  value: (investor as any).companySize || (investor as any).company || "—", icon: <Building2 size={16} />, color: "from-violet-100 to-violet-50 text-violet-700" },
  ];

  // Format ticket size in INR
  const ticketDisplay = (() => {
    if (investor.ticketSize) return toINR(investor.ticketSize);
    if (investor.ticketSizeMin) {
      const min = toINR(investor.ticketSizeMin);
      const max = investor.ticketSizeMax ? toINR(investor.ticketSizeMax) : "";
      return max ? `${min} – ${max}` : `${min}+`;
    }
    return null;
  })();

  return (
    <div className="space-y-5">
      {/* Hero card with shimmer */}
      <ShimmerCard className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-violet-50 rounded-3xl p-6 border border-pink-100 overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-pink-200/30 to-purple-200/30 -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-violet-200/20 to-transparent translate-y-8 -translate-x-8" />
        <div className="flex items-start gap-5 relative">
          <div className="relative flex-shrink-0">
            <div className="p-0.5 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-600 shadow-xl shadow-purple-200">
              <img src={avatar} alt={name} className="w-22 h-22 rounded-2xl object-cover border-2 border-white" style={{ width: 88, height: 88 }} />
            </div>
            {investor.verified && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 border-2 border-white flex items-center justify-center shadow-md">
                <Shield size={14} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-purple-900">{name}</h2>
              {investor.verified && (
                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
                  <Shield size={10} /> Verified
                </span>
              )}
              {investor.online && (
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                  ● Active now
                </motion.span>
              )}
            </div>
            <p className="text-purple-500 font-semibold mt-0.5">{fund}</p>
            {investor.location && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1"><MapPin size={12} /> {investor.location}</p>
            )}
            {investor.bio && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{investor.bio}</p>}
            {links.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {links.map((l, i) => (
                  <motion.a key={i} href={l.href} target="_blank" rel="noreferrer"
                    whileHover={{ y: -2 }}
                    className={`flex items-center gap-1.5 text-xs font-semibold border rounded-xl px-3 py-1.5 transition-colors bg-white shadow-sm ${l.color}`}>
                    {l.icon} {l.label}
                  </motion.a>
                ))}
              </div>
            )}
          </div>
        </div>
      </ShimmerCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => {
          const parts = s.color.split(" ");
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08, type: "spring" }}
              whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(147,51,234,0.15)" }}
              className={`bg-gradient-to-br ${parts[0]} ${parts[1]} rounded-2xl p-4 border border-white shadow-sm cursor-default transition-all`}>
              <span className={parts[2]}>{s.icon}</span>
              <p className={`font-bold text-xl mt-1 ${parts[2]}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Investment focus */}
      {((investor.sectors ?? []).length > 0 || (investor.stages ?? []).length > 0 || ticketDisplay) && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-purple-50 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
            <h3 className="font-bold text-purple-900 text-sm flex items-center gap-2">
              <Target size={15} className="text-purple-400" /> Investment Focus
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {(investor.sectors ?? []).length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Sectors</p>
                <div className="flex flex-wrap gap-2">
                  {(investor.sectors ?? []).map((s, i) => (
                    <motion.span key={i} whileHover={{ scale: 1.05 }}
                      className="text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700 rounded-xl px-3 py-1.5 cursor-default">{s}</motion.span>
                  ))}
                </div>
              </div>
            )}
            {(investor.stages ?? []).length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Stage Preference</p>
                <div className="flex flex-wrap gap-2">
                  {(investor.stages ?? []).map((s, i) => (
                    <motion.span key={i} whileHover={{ scale: 1.05 }}
                      className="text-xs font-semibold bg-pink-50 border border-pink-200 text-pink-700 rounded-xl px-3 py-1.5 cursor-default">{s}</motion.span>
                  ))}
                </div>
              </div>
            )}
            {ticketDisplay && (
              <ShimmerCard className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1.5">Ticket Size</p>
                <p className="text-xl font-bold text-green-700">{ticketDisplay}</p>
              </ShimmerCard>
            )}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {(investor.portfolio ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-purple-50">
            <h3 className="font-bold text-purple-900 text-sm flex items-center gap-2">
              <Briefcase size={15} className="text-purple-400" /> Portfolio Companies
            </h3>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {(investor.portfolio ?? []).map((co, i) => (
              <motion.span key={i} whileHover={{ scale: 1.05, y: -2 }}
                className="text-sm font-semibold bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 text-purple-700 rounded-xl px-3 py-2 cursor-default shadow-sm">
                {co}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Deal info */}
      <ShimmerCard className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl p-5 border border-violet-100 shadow-sm">
        <h3 className="font-bold text-violet-900 text-sm mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-yellow-500" /> Your Deal
        </h3>
        <div className="space-y-2">
          {[
            { label: "Startup", value: deal.startupName },
            { label: "Sector",  value: deal.sector },
            { label: "Stage",   value: deal.stage },
            { label: "Status",  value: deal.status === "accepted" ? "✅ Active Deal" : deal.status },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 w-20 flex-shrink-0">{item.label}</span>
              <span className="font-semibold text-purple-800">{item.value}</span>
            </div>
          ))}
        </div>
      </ShimmerCard>
    </div>
  );
};

// ─── Feedback Tab ─────────────────────────────────────────────────────────────

const FeedbackTab: React.FC<{ deal: DealConnection; founderId: string }> = ({ deal, founderId }) => {
  const [feedback, setFeedback] = useState<InvestorFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "startupFeedbacks"), where("recId", "==", deal.id));
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) setFeedback({ id: snap.docs[0].id, ...snap.docs[0].data() } as InvestorFeedback);
      setLoading(false);
    });
    return () => unsub();
  }, [deal.id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <RefreshCw size={24} className="text-purple-400 animate-spin" />
      <p className="text-sm text-purple-400">Loading evaluation…</p>
    </div>
  );

  if (!feedback) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg">
        <BarChart2 size={32} className="text-purple-300" />
      </motion.div>
      <h3 className="font-bold text-purple-900 text-lg">No Evaluation Yet</h3>
      <p className="text-sm text-gray-400 text-center max-w-xs">The investor hasn't submitted their evaluation yet. Check back soon!</p>
    </div>
  );

  const CRITERIA = [
    { key: "innovation",      label: "Innovation",       color: "from-violet-500 to-purple-600",  bg: "bg-violet-50",  text: "text-violet-700",  bar: "bg-violet-500" },
    { key: "marketPotential", label: "Market Potential", color: "from-blue-500 to-cyan-600",      bg: "bg-blue-50",    text: "text-blue-700",    bar: "bg-blue-500" },
    { key: "scalability",     label: "Scalability",      color: "from-emerald-500 to-green-600",  bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
    { key: "team",            label: "Team",             color: "from-orange-500 to-amber-600",   bg: "bg-orange-50",  text: "text-orange-700",  bar: "bg-orange-500" },
    { key: "risk",            label: "Risk Level",       color: "from-rose-500 to-red-600",       bg: "bg-rose-50",    text: "text-rose-700",    bar: "bg-rose-500" },
  ] as const;

  const recConfig = {
    consider:   { color: "bg-blue-50 text-blue-700 border-blue-200",    label: "💼 Consider for Investment" },
    needs_work: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "⚡ Needs More Work" },
    pass:       { color: "bg-red-50 text-red-600 border-red-200",       label: "✗ Pass" },
  };

  const scores = { innovation: feedback.innovation, marketPotential: feedback.marketPotential, scalability: feedback.scalability, team: feedback.team, risk: feedback.risk };

  return (
    <div className="space-y-5">
      <ShimmerCard className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-violet-900 flex items-center gap-2"><Star size={18} className="text-yellow-500" /> Investor Evaluation</h3>
          <span className="text-xs text-violet-400">{feedback.createdAt?.toDate ? new Date(feedback.createdAt.toDate()).toLocaleDateString("en-IN") : ""}</span>
        </div>
        <p className="text-sm text-violet-500">by {feedback.investorName} · {deal.startupName}</p>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span className={`text-sm font-bold px-4 py-2 rounded-full border-2 ${recConfig[feedback.recommendation].color}`}>{recConfig[feedback.recommendation].label}</span>
          <span className={`text-lg font-black px-4 py-2 rounded-2xl border-2 ${feedback.overallScore >= 7 ? "bg-green-50 text-green-700 border-green-300" : feedback.overallScore >= 5 ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-red-50 text-red-600 border-red-300"}`}>{feedback.overallScore}/10</span>
        </div>
      </ShimmerCard>

      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
        <h4 className="font-bold text-purple-900 text-sm mb-4 flex items-center gap-2 justify-center"><BarChart size={14} className="text-purple-400" /> Score Visualisation</h4>
        <FeedbackRadar scores={scores} overallScore={feedback.overallScore} />
      </div>

      <div className="space-y-3">
        {CRITERIA.map((c, ci) => {
          const val = feedback[c.key as keyof typeof scores] as number;
          return (
            <motion.div key={c.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ci * 0.07 }}
              className={`${c.bg} rounded-2xl p-4 border border-white/80 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${c.text}`}>{c.label}</span>
                <span className={`text-xl font-black ${c.text}`}>{val}<span className="text-sm font-normal">/10</span></span>
              </div>
              <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${val * 10}%` }} transition={{ duration: 0.8, ease: "easeOut", delay: ci * 0.07 }}
                  className={`h-full rounded-full bg-gradient-to-r ${c.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {feedback.comments && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
          <h4 className="font-bold text-purple-900 text-sm mb-3 flex items-center gap-2"><MessageSquare size={15} className="text-purple-400" /> Investor Feedback</h4>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{feedback.comments}</p>
        </div>
      )}
    </div>
  );
};

// ─── Notes Tab ────────────────────────────────────────────────────────────────

const NotesTab: React.FC<{ founderId: string; dealId: string }> = ({ founderId, dealId }) => {
  const [notes, setNotes] = useState<StickyNoteType[]>([]);
  const [newText, setNewText] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const notesRef = collection(db, "founderPrivateNotes", `${founderId}_${dealId}`, "notes");

  useEffect(() => {
    const q = query(notesRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => { setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as StickyNoteType))); });
  }, [founderId, dealId]);

  const addNote = async () => {
    if (!newText.trim()) return;
    await addDoc(notesRef, { text: newText.trim(), color: selectedColor.toString(), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), authorId: founderId });
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
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <Lock size={14} className="text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700 font-medium">These notes are <strong>private</strong> — only you can see them.</p>
      </div>
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <NotebookPen size={17} className="text-amber-600" />
          <h3 className="font-bold text-amber-800">New Private Note</h3>
        </div>
        <div className="flex gap-2 mb-3">
          {NOTE_COLORS.map((c, i) => (
            <button key={i} onClick={() => setSelectedColor(i)}
              className={`w-7 h-7 rounded-full ${c.bg} border-2 transition-all ${selectedColor === i ? `${c.border} scale-110 shadow-md` : "border-white"}`} />
          ))}
        </div>
        <textarea value={newText} onChange={e => setNewText(e.target.value)}
          placeholder="Write your private notes, thoughts, questions…"
          className={`w-full ${NOTE_COLORS[selectedColor].bg} border ${NOTE_COLORS[selectedColor].border} rounded-xl px-3.5 py-3 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 ${NOTE_COLORS[selectedColor].text}`} />
        <button onClick={addNote} disabled={!newText.trim()}
          className="mt-3 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm shadow-amber-200">
          <Plus size={15} /> Pin Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-10">
          <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity }}>
            <StickyNote size={36} className="text-yellow-200 mx-auto mb-3" />
          </motion.div>
          <p className="text-amber-400 font-medium text-sm">No private notes yet</p>
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
                  whileHover={{ y: -4, rotate: 1, boxShadow: "0 12px 28px rgba(0,0,0,0.12)" }}
                  className={`${c.bg} border ${c.border} rounded-2xl p-4 shadow-md relative group cursor-default`}>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gray-400/60 shadow-sm" />
                  <div className="mt-3">
                    {editId === note.id ? (
                      <div className="space-y-2">
                        <textarea value={editText} onChange={e => setEditText(e.target.value)}
                          className={`w-full ${c.bg} border ${c.border} rounded-lg px-2 py-1.5 text-sm resize-none h-20 focus:outline-none ${c.text}`} />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(note.id)} className="flex items-center gap-1 text-xs bg-white/60 rounded-lg px-2.5 py-1.5 font-semibold text-green-700 hover:bg-white/80"><Save size={11} /> Save</button>
                          <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm leading-relaxed ${c.text} whitespace-pre-wrap break-words`}>{note.text}</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
                          <p className={`text-[10px] ${c.text} opacity-60`}>{note.createdAt?.toDate ? new Date(note.createdAt.toDate()).toLocaleDateString("en-IN") : ""}</p>
                          <div className="hidden group-hover:flex gap-1">
                            <button onClick={() => { setEditId(note.id); setEditText(note.text); }} className="text-current opacity-60 hover:opacity-100 rounded p-1"><Pencil size={12} /></button>
                            <button onClick={() => deleteDoc(doc(notesRef, note.id))} className="text-current opacity-60 hover:opacity-100 rounded p-1"><Trash2 size={12} /></button>
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

// ─── Investor Connection Card ─────────────────────────────────────────────────

const InvestorConnectionCard: React.FC<{
  deal: DealConnection;
  investor: InvestorProfile | null;
  onClick: () => void;
  index: number;
}> = ({ deal, investor, onClick, index }) => {
  const avatar = investor?.photoURL || investor?.photo || investor?.avatar || investor?.image || null;
  const name = investor?.fullName || investor?.name || deal.investorName || "Investor";
  const fund = investor?.fund || investor?.firm || investor?.company || "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const gradients = [
    { ring: "from-pink-400 to-purple-500", orb: "from-pink-100 to-purple-100", text: "text-purple-600" },
    { ring: "from-violet-400 to-pink-500", orb: "from-violet-100 to-pink-100", text: "text-violet-600" },
    { ring: "from-purple-400 to-pink-400", orb: "from-purple-100 to-pink-50",  text: "text-pink-600" },
  ];
  const g = gradients[index % gradients.length];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 260, damping: 22 }}
      whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(147,51,234,0.16)" }}
      onClick={onClick}
      className="bg-white rounded-3xl border border-purple-100 shadow-sm cursor-pointer group relative overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(147,51,234,0.07)" }}>

      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/0 via-purple-50/0 to-violet-50/0 group-hover:from-pink-50/70 group-hover:via-purple-50/40 group-hover:to-violet-50/30 transition-all duration-300 rounded-3xl pointer-events-none" />
      <div className={`h-1 w-full bg-gradient-to-r ${g.ring} rounded-t-3xl`} />

      <div className="p-5 relative">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className={`p-[2.5px] rounded-2xl bg-gradient-to-br ${g.ring} shadow-lg group-hover:shadow-xl transition-shadow`}>
              {avatar ? (
                <img src={avatar} alt={name} className="w-16 h-16 rounded-[14px] object-cover border-[2.5px] border-white block" />
              ) : (
                <div className={`w-16 h-16 rounded-[14px] bg-gradient-to-br ${g.orb} border-[2.5px] border-white flex items-center justify-center`}>
                  <span className={`font-black text-xl ${g.text}`}>{initials}</span>
                </div>
              )}
            </div>
            {investor?.verified && (
              <motion.div whileHover={{ scale: 1.15 }}
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 border-2 border-white flex items-center justify-center shadow-md">
                <Shield size={11} className="text-white" />
              </motion.div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="font-black text-gray-900 group-hover:text-purple-900 transition-colors text-[15px] leading-tight">{name}</h3>
                </div>
                {fund && <p className="text-sm font-semibold text-purple-500 truncate">{fund}</p>}
                <p className="text-xs text-gray-400 mt-0.5 truncate">{deal.startupName} · {deal.sector} · {deal.stage}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 shadow-sm">
                <CheckCircle size={10} /> Active Deal
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-purple-50 to-pink-50 ${g.text} border border-purple-100 rounded-full px-2.5 py-1 shadow-sm`}>
                <BadgeDollarSign size={10} /> Funding Open
              </span>
            </div>
          </div>

          <motion.div
            whileHover={{ x: 3 }}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 flex items-center justify-center group-hover:from-purple-100 group-hover:to-pink-100 group-hover:border-purple-200 transition-all shadow-sm">
            <Eye size={15} className="text-purple-400 group-hover:text-purple-600 transition-colors" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Locked Placeholder ───────────────────────────────────────────────────────

const LockedDealSpace: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
    <div className="relative">
      <motion.div animate={{ boxShadow: ["0 0 0 0 rgba(147,51,234,0.2)", "0 0 0 20px rgba(147,51,234,0)", "0 0 0 0 rgba(147,51,234,0)"] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <Lock size={36} className="text-purple-300" />
      </motion.div>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
        <Sparkles size={14} className="text-white" />
      </motion.div>
    </div>
    <div>
      <h2 className="text-2xl font-bold text-purple-900 mb-2">Investor Deal Space</h2>
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
        This space unlocks when an investor accepts your recommendation from a mentor.
      </p>
    </div>
    <div className="grid grid-cols-3 gap-4 max-w-sm w-full">
      {[
        { icon: <MessageCircle size={20} />, label: "Real-time Chat",  color: "from-pink-400 to-pink-600" },
        { icon: <BadgeDollarSign size={20} />, label: "Funding Offers", color: "from-purple-400 to-purple-600" },
        { icon: <BarChart2 size={20} />,      label: "Analytics",       color: "from-violet-400 to-violet-600" },
      ].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          whileHover={{ y: -4 }}
          className={`bg-gradient-to-br ${item.color} rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg text-white`}>
          {item.icon}
          <p className="text-xs font-semibold">{item.label}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// ─── Sliding Tab Indicator ────────────────────────────────────────────────────

const SlidingTabs: React.FC<{
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}> = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-0 px-3 pt-1 border-t border-purple-50 bg-white/60 overflow-x-auto relative">
    {tabs.map((t) => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200 z-10 ${
          activeTab === t.id ? "text-pink-700" : "text-gray-500 hover:text-purple-600"
        }`}>
        {t.icon} {t.label}
        {activeTab === t.id && (
          <motion.div layoutId="tab-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }} />
        )}
      </button>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const FounderInvestorDealRoom: React.FC = () => {
  const [founderId, setFounderId]       = useState("");
  const [founderName, setFounderName]   = useState("Founder");
  const [deals, setDeals]               = useState<DealConnection[]>([]);
  const [investorProfiles, setInvestorProfiles] = useState<Record<string, InvestorProfile>>({});
  const [selectedDeal, setSelectedDeal] = useState<DealConnection | null>(null);
  const [activeTab, setActiveTab]       = useState<"overview" | "chat" | "funding" | "feedback" | "notes">("overview");
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      if (user) {
        setFounderId(user.uid);
        const snap = await getDoc(doc(db, "founders", user.uid)).catch(() => null);
        if (snap?.exists()) {
          const d = snap.data();
          setFounderName(d.fullName || d.name || user.displayName || "Founder");
        } else {
          setFounderName(user.displayName || "Founder");
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!founderId) return;
    const q = query(collection(db, "mentorRecommendations"), where("founderId", "==", founderId), where("status", "==", "accepted"));
    const unsub = onSnapshot(q, async snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DealConnection));
      setDeals(list);
      setLoading(false);
      for (const deal of list) {
        if (!investorProfiles[deal.investorId]) {
          try {
            const inv = await getDoc(doc(db, "investors", deal.investorId));
            if (inv.exists()) setInvestorProfiles(prev => ({ ...prev, [deal.investorId]: { id: deal.investorId, ...inv.data() } as InvestorProfile }));
          } catch (e) {}
        }
      }
    });
    return () => unsub();
  }, [founderId]);

  const investor           = selectedDeal ? (investorProfiles[selectedDeal.investorId] || null) : null;
  const chatId             = selectedDeal ? [founderId, selectedDeal.investorId].sort().join("_fc_") : "";
  const investorAvatar     = investor?.photoURL || investor?.photo || investor?.avatar || investor?.image
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDeal?.investorId || "investor"}`;
  const investorDisplayName = investor?.fullName || investor?.name || selectedDeal?.investorName || "Investor";

  const TABS = [
    { id: "overview" as const, label: "Overview",  icon: <Target size={14} /> },
    { id: "chat"     as const, label: "Chat",       icon: <MessageCircle size={14} /> },
    { id: "funding"  as const, label: "Funding",    icon: <BadgeDollarSign size={14} /> },
    { id: "feedback" as const, label: "Feedback",   icon: <Star size={14} /> },
    { id: "notes"    as const, label: "My Notes",   icon: <StickyNote size={14} /> },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-violet-50/50 flex items-center justify-center">
      <BackgroundOrbs />
      <div className="flex flex-col items-center gap-3 relative z-10">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
          <RefreshCw size={28} className="text-purple-400" />
        </motion.div>
        <p className="text-purple-400 font-medium">Loading your deal space…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-violet-50/50 relative">
      <BackgroundOrbs />

      {/* Header */}
      <div className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-pink-100/70 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <ShimmerCard className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-200">
            <Unlock size={18} className="text-white" />
          </ShimmerCard>
          <div>
            <h1 className="text-xl font-bold text-purple-900">Investor Deal Space</h1>
            <p className="text-xs text-purple-400">
              {deals.length > 0 ? `${deals.length} active investor connection${deals.length !== 1 ? "s" : ""}` : "No active connections yet"}
            </p>
          </div>
          {deals.length > 0 && (
            <motion.div animate={{ boxShadow: ["0 0 0 0 rgba(74,222,128,0.3)", "0 0 0 6px rgba(74,222,128,0)", "0 0 0 0 rgba(74,222,128,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-auto flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-700 font-semibold">{deals.length} Deal{deals.length !== 1 ? "s" : ""} Active</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
        {deals.length === 0 ? (
          <LockedDealSpace />
        ) : !selectedDeal ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-bold text-purple-900">Your Investor Connections</h2>
              <span className="text-xs bg-purple-100 text-purple-700 font-bold rounded-full px-2.5 py-0.5">{deals.length}</span>
            </div>
            {deals.map((deal, i) => (
              <motion.div key={deal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <InvestorConnectionCard
                  deal={deal}
                  investor={investorProfiles[deal.investorId] || null}
                  onClick={() => { setSelectedDeal(deal); setActiveTab("overview"); }}
                  index={i}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {/* Back + deal header */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-pink-100 mb-4 overflow-hidden shadow-lg">
              <ShimmerCard className="bg-gradient-to-r from-pink-500 via-purple-600 to-violet-600 px-5 py-4">
                <div className="flex items-center gap-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDeal(null)}
                    className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors text-white backdrop-blur-sm">
                    <ArrowLeft size={17} />
                  </motion.button>
                  <div className="relative flex-shrink-0">
                    <div className="p-0.5 rounded-xl bg-white/30 shadow-lg">
                      <img src={investorAvatar} alt={investorDisplayName} className="w-12 h-12 rounded-xl object-cover" />
                    </div>
                    {investor?.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center">
                        <Shield size={9} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-white">{investorDisplayName}</h2>
                      {investor?.fund && <span className="text-pink-200 text-sm">· {investor.fund}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-white/70 text-xs">{selectedDeal.startupName}</span>
                      <span className="text-white/50 text-xs">·</span>
                      <span className="text-white/70 text-xs">{selectedDeal.sector}</span>
                      <span className="bg-green-400/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  </div>
                  {investor?.online && (
                    <div className="flex items-center gap-2">
                      <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <span className="text-xs font-semibold text-green-200">Online</span>
                    </div>
                  )}
                </div>
              </ShimmerCard>

              <SlidingTabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as typeof activeTab)} />
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className={activeTab === "chat" ? "h-[65vh] max-w-2xl" : ""}>

                {activeTab === "overview" && investor && (
                  <div className="max-w-2xl"><OverviewTab investor={investor} deal={selectedDeal} /></div>
                )}
                {activeTab === "overview" && !investor && (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                        <RefreshCw size={22} className="text-purple-300" />
                      </motion.div>
                      <p className="text-purple-400 text-sm">Loading investor profile…</p>
                    </div>
                  </div>
                )}

                {activeTab === "chat" && (
                  <DealChatPane
                    chatId={chatId}
                    founderId={founderId}
                    founderName={founderName}
                    investorId={selectedDeal.investorId}
                    investorName={investorDisplayName}
                    investorAvatar={investorAvatar}
                    investorOnline={!!investor?.online}
                    dealId={selectedDeal.id}
                  />
                )}

                {activeTab === "funding" && (
                  <div className="max-w-2xl">
                    <FundingTab
                      dealId={selectedDeal.id}
                      investorId={selectedDeal.investorId}
                      investorName={investorDisplayName}
                      founderId={founderId}
                      founderName={founderName}
                      chatId={chatId}
                    />
                  </div>
                )}

                {activeTab === "feedback" && (
                  <div className="max-w-2xl"><FeedbackTab deal={selectedDeal} founderId={founderId} /></div>
                )}

                {activeTab === "notes" && (
                  <div className="max-w-2xl"><NotesTab founderId={founderId} dealId={selectedDeal.id} /></div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default FounderInvestorDealRoom;