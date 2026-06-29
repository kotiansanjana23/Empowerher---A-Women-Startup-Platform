import { useState, useRef, useEffect } from "react";
import { db, auth } from "../../../../../../firebase";
import {
  doc, getDoc, setDoc, collection, query, where,
  onSnapshot, orderBy, limit, getDocs, Timestamp,addDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  TrendingUp, Eye, Heart, Calendar, FileText,
  Bell, ChevronDown, UserPen, Settings, LogOut,
  Headset, Bug, Lock, BellOff, Shield,
  ChevronRight, X, Upload, Camera, Check,
  DollarSign, Users, Activity, BarChart2,
  CheckCircle, Clock, Award,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ModalId = "editProfile" | "settings" | "contact" | "report" | "logout" | null;
type SubModalId = "changePassword" | "notifPrefs" | "securityQuestions" | null;

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  bio: string;
  linkedin: string;
  location: string;
  interests: string;
  funding: string;
  avatar: string;
  aboutCompany: string;
  companySize: string;
}

interface LiveStats {
  totalStartupsViewed: number;
  interestedStartups: number;
  meetingsScheduled: number;
  fundingRequests: number;
}

interface LiveMeeting {
  id: string;
  startupName: string;
  founder: string;
  founderImage: string;
  date: string;
  time: string;
  status: string;
  link?: string;
}

interface LiveNotif {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}

interface RecommendedStartup {
  id: string;
  name: string;
  description: string;
  industry: string;
  stage: string;
  sector: string;
  founderName: string;
  fundingNeeded?: number;
  growthRate?: number;
  logo?: string;
  status?: string;
}

interface FundingOfferSummary {
  id: string;
  startupName: string;
  amount: string;
  equity: string;
  status: string;
  timestamp: Timestamp;
}

interface FeedbackSummary {
  id: string;
  startupName: string;
  overallScore: number;
  recommendation: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favorite book?",
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const formatRelativeTime = (ts: Timestamp | undefined): string => {
  if (!ts?.toDate) return "";
  const diff = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AVAILABILITY = [
  { label: "Available for Meetings", color: "#7B61FF" },
  { label: "Busy", color: "#f59e0b" },
  { label: "Open to Networking", color: "#10b981" },
  { label: "Accepting Pitches", color: "#EC4899" },
];

const INDUSTRY_COLORS = ["#7B61FF", "#EC4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

// ─── Reusable Overlay ──────────────────────────────────────────────────────────
function Overlay({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── Notif Toggle Row ──────────────────────────────────────────────────────────
function NotifToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-purple-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button
        onClick={() => setEnabled((e) => !e)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-purple-500" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, gradient,
}: { label: string; value: number | string; sub: string; icon: React.ReactNode; gradient: string }) {
  return (
    <Card className={`p-6 ${gradient} border-none text-white relative overflow-hidden`}>
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-2 w-20 h-20 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1.5 tracking-tight">{value}</p>
          <p className="text-white/60 text-xs mt-2 flex items-center gap-1">
            <Activity className="w-3 h-3" />{sub}
          </p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  // ── Auth & profile ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile>({
    name: "", email: "", phone: "", company: "", bio: "",
    linkedin: "", location: "", interests: "", funding: "$500K – $2M",
    avatar: "", aboutCompany: "", companySize: "",
  });
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Live Firestore data ────────────────────────────────────────────────────
  const [stats, setStats] = useState<LiveStats>({
    totalStartupsViewed: 0, interestedStartups: 0,
    meetingsScheduled: 0, fundingRequests: 0,
  });
  const [meetings, setMeetings] = useState<LiveMeeting[]>([]);
  const [notifications, setNotifications] = useState<LiveNotif[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedStartup[]>([]);
  const [fundingOffers, setFundingOffers] = useState<FundingOfferSummary[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackSummary[]>([]);
  const [investmentChartData, setInvestmentChartData] = useState<{ month: string; amount: number }[]>([]);
  const [industryData, setIndustryData] = useState<{ name: string; value: number; color: string }[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [modal, setModal] = useState<ModalId>(null);
  const [subModal, setSubModal] = useState<SubModalId>(null);
  const [availability, setAvailability] = useState<string[]>(["Available for Meetings"]);
  const [activeStatsTab, setActiveStatsTab] = useState<"offers" | "feedbacks">("offers");

  // ── Security questions state ───────────────────────────────────────────────
 const [secQ1, setSecQ1] = useState(SECURITY_QUESTIONS[0]);
  const [secA1, setSecA1] = useState("");
  const [secQ2, setSecQ2] = useState(SECURITY_QUESTIONS[1]);
  const [secA2, setSecA2] = useState("");
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Contact / Report fields
  const [contactSubject, setContactSubject] = useState("General Inquiry");
  const [contactMessage, setContactMessage] = useState("");
  const [issueCategory, setIssueCategory] = useState("Bug / Error");
  const [issueDescription, setIssueDescription] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load profile from Firestore ────────────────────────────────────────────
  useEffect(() => {
    let settled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) return;
      try {
        const ref = doc(db, "investors", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            name: d.fullName ?? user.displayName ?? "",
            email: user.email ?? "",
            phone: d.phone ?? "",
            company: d.company ?? "",
            bio: d.bio ?? "",
            linkedin: d.linkedin ?? "",
            location: d.location ?? "",
            interests: d.interests ?? "",
            funding: d.funding ?? "$500K – $2M",
            avatar: d.photoURL ?? user.photoURL ?? "",
            aboutCompany: d.aboutCompany ?? "",
            companySize: d.companySize ?? "",
          });
          if (d.securityQ1) setSecQ1(d.securityQ1);
          if (d.securityQ2) setSecQ2(d.securityQ2);
        } else {
          const seed = {
            fullName: user.displayName ?? "", email: user.email ?? "",
            phone: "", company: "", bio: "", linkedin: "", location: "",
            interests: "", funding: "$500K – $2M",
            photoURL: user.photoURL ?? "", aboutCompany: "", companySize: "",
            createdAt: new Date(),
          };
          await setDoc(ref, seed);
          setProfile({ ...seed, name: seed.fullName, avatar: seed.photoURL });
        }
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        if (!settled) { settled = true; setLoading(false); }
      }
    });
    const timeout = setTimeout(() => { if (!settled) { settled = true; setLoading(false); } }, 6000);
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  // ── Live: meetings ──────────────────────────────────────────────────────────
// ── Live: meetings ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "meetings"),
      where("investorId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    return onSnapshot(q, (snap) => {
      const list: LiveMeeting[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          startupName: data.startup ?? "Meeting",
          founder: data.founderName ?? "—",
          founderImage: data.founderPhoto ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.id}`,
          date: data.meetingDate ?? "",
          time: data.meetingTime ?? "",
          status: data.status ?? "scheduled",
          link: data.jitsiLink ?? "",
        };
      });
      setMeetings(list);
      setStats((prev) => ({ ...prev, meetingsScheduled: list.length }));
    });
  }, [currentUser]);

  // ── Live: notifications ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    return onSnapshot(q, (snap) => {
      const list: LiveNotif[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.type?.replace(/_/g, " ") ?? "Notification",
          message: data.message ?? "",
          time: formatRelativeTime(data.createdAt),
          read: data.read ?? false,
          type: data.type ?? "",
        };
      });
      setNotifications(list);
    });
  }, [currentUser]);

  // ── Live: recommendations (startups) ──────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "mentorRecommendations"),
      where("investorId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    return onSnapshot(q, (snap) => {
      const all: RecommendedStartup[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.startupName ?? "Startup",
          description: data.description ?? "",
          industry: data.sector ?? data.industry ?? "Technology",
          stage: data.stage ?? "Seed",
          sector: data.sector ?? "",
          founderName: data.founderName ?? "",
          fundingNeeded: data.fundingNeeded ?? 0,
          growthRate: data.growthRate ?? Math.floor(Math.random() * 40) + 10,
          logo: data.founderPhoto || data.logo || "",
          status: data.status ?? "pending",
        };
      });

      // Keep only the latest recommendation per startup name
      const seen = new Set<string>();
      const list: RecommendedStartup[] = [];
      for (const r of all) {
        if (seen.has(r.name)) continue;
        seen.add(r.name);
        list.push(r);
      }

      setRecommendations(list);
      setStats((prev) => ({
        ...prev,
        totalStartupsViewed: list.length,
        interestedStartups: list.filter((r) => (r as any).status === "accepted").length,
      }));

      const industryCount: Record<string, number> = {};
      list.forEach((r) => {
        const key = r.industry || r.sector || "Other";
        industryCount[key] = (industryCount[key] ?? 0) + 1;
      });
      const total = list.length || 1;
      const distrib = Object.entries(industryCount).map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length],
      }));
      setIndustryData(distrib);
    });
  }, [currentUser]);

  // ── Live: funding offers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "mentorRecommendations"),
      where("investorId", "==", currentUser.uid),
      where("status", "==", "accepted")
    );
    const unsubRecs = onSnapshot(q, async (snap) => {
      setStats((prev) => ({ ...prev, fundingRequests: snap.size }));
      const allOffers: FundingOfferSummary[] = [];
      for (const recDoc of snap.docs) {
        const recData = recDoc.data();
        try {
          const offersSnap = await getDocs(
            query(collection(db, "fundingOffers", recDoc.id, "offers"), orderBy("timestamp", "desc"), limit(3))
          );
          offersSnap.docs.forEach((od) => {
            const o = od.data();
            allOffers.push({
              id: od.id,
              startupName: recData.startupName ?? "Startup",
              amount: `${o.minAmount ?? ""}–${o.maxAmount ?? ""}`,
              equity: o.equity ?? "",
              status: o.status ?? "pending",
              timestamp: o.timestamp,
            });
          });
        } catch (_) {}
      }
const seen = new Set<string>();
      const deduped: FundingOfferSummary[] = [];
      for (const o of allOffers.sort((a, b) => {
        const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tb - ta;
      })) {
        if (seen.has(o.startupName)) continue;
        seen.add(o.startupName);
        deduped.push(o);
      }
      setFundingOffers(deduped.slice(0, 5));    });
    return unsubRecs;
  }, [currentUser]);

  // ── Live: feedbacks given ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "startupFeedbacks"),
      where("investorId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    return onSnapshot(q, (snap) => {
      setFeedbacks(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          startupName: data.startupName ?? "Startup",
          overallScore: data.overallScore ?? 0,
          recommendation: data.recommendation ?? "consider",
        };
      }));
    });
  }, [currentUser]);

  // ── Build investment chart data ────────────────────────────────────────────
  useEffect(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const chartData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: months[d.getMonth()], amount: 0 };
    });
    meetings.forEach((m) => {
      if (!m.date) return;
      const d = new Date(m.date);
      const label = months[d.getMonth()];
      const idx = chartData.findIndex((c) => c.month === label);
      if (idx !== -1) chartData[idx].amount += 1;
    });
    recommendations.forEach((_, i) => {
      if (chartData[i % 6]) chartData[i % 6].amount += Math.floor(Math.random() * 200 + 100);
    });
    setInvestmentChartData(chartData);
  }, [meetings, recommendations]);

  // ── Outside click handler ──────────────────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Save profile ───────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "investors", currentUser.uid), {
        fullName: profile.name, email: profile.email,
        phone: profile.phone, company: profile.company,
        bio: profile.bio, linkedin: profile.linkedin,
        location: profile.location, interests: profile.interests,
        funding: profile.funding, photoURL: profile.avatar,
        aboutCompany: profile.aboutCompany, companySize: profile.companySize,
        updatedAt: new Date(),
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setModal(null); }, 1200);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  // ── Save security questions ────────────────────────────────────────────────
  async function handleSaveSecurityQuestions() {
    if (!currentUser) return;
    if (!secA1.trim() || !secA2.trim()) {
      alert("Please answer both security questions.");
      return;
    }
    setSavingSecurity(true);
    try {
      await setDoc(doc(db, "investors", currentUser.uid), {
        securityQ1: secQ1, securityA1: secA1,
        securityQ2: secQ2, securityA2: secA2,
        updatedAt: new Date(),
      }, { merge: true });
      setSecA1(""); setSecA2("");
      setSubModal(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save security questions.");
    } finally {
      setSavingSecurity(false);
    }
  }

function openModal(id: ModalId) { setProfileOpen(false); setModal(id); }

  async function handleSendContact() {
    if (!contactMessage.trim()) { alert("Please enter a message."); return; }
    try {
      await addDoc(collection(db, "contactMessages"), {
        investorId: currentUser?.uid || null,
        investorEmail: currentUser?.email || null,
        subject: contactSubject,
        message: contactMessage,
        createdAt: new Date(),
      });
      alert("Message sent!");
      setContactMessage("");
      setModal(null);
    } catch (e) { console.error(e); alert("Failed to send."); }
  }

  async function handleSubmitIssue() {
    if (!issueDescription.trim()) { alert("Please describe the issue."); return; }
    try {
      await addDoc(collection(db, "reportedIssues"), {
        investorId: currentUser?.uid || null,
        investorEmail: currentUser?.email || null,
        issueCategory,
        issueDescription,
        status: "pending",
        createdAt: new Date(),
      });
      alert("Issue submitted!");
      setIssueDescription("");
      setModal(null);
    } catch (e) { console.error(e); alert("Failed to submit."); }
  }
    function toggleAvailability(label: string) {
    setAvailability((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const upcomingMeetings = meetings.slice(0, 3);
  const recommendedStartups = recommendations.slice(0, 4);

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 animate-pulse" />
          </div>
          <p className="text-sm text-gray-400 font-medium tracking-wide">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const firstName = profile.name?.split(" ")[0] || "Investor";

  return (
    <div className="space-y-6">

      {/* ── Welcome ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's your live investment activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* ── Notification bell ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
              className="relative p-2.5 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
            >
              <Bell className="w-5 h-5 text-purple-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-purple-100 rounded-2xl shadow-2xl z-40 overflow-hidden"
                style={{ boxShadow: "0 12px 40px rgba(123,97,255,0.18)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-pink-50">
                  <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                  <span className="text-xs text-purple-500 font-medium">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">No notifications yet</div>
                  ) : notifications.slice(0, 8).map((n) => (
                    <div key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-purple-50 last:border-0 hover:bg-purple-50/40 cursor-pointer transition-colors ${!n.read ? "bg-purple-50/60" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold
                        ${n.type === "meeting_invite" ? "bg-gradient-to-br from-blue-500 to-purple-500"
                          : n.type === "funding_offer" ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : n.type === "feedback_received" ? "bg-gradient-to-br from-yellow-500 to-amber-500"
                          : "bg-gradient-to-br from-purple-500 to-pink-500"}`}>
                        {n.type === "meeting_invite" ? "📅" : n.type === "funding_offer" ? "💰" : n.type === "feedback_received" ? "⭐" : "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-snug line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 text-center border-t border-purple-50 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                  <span className="text-xs text-purple-600 font-medium cursor-pointer hover:underline">
                    View all notifications →
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Profile dropdown ── */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
              className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-white border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all"
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {firstName.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <p className="font-semibold text-sm text-gray-900">{profile.name || "Investor"}</p>
                <p className="text-xs text-purple-400">Investor</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 w-56 bg-white border border-purple-100 rounded-2xl shadow-2xl z-40 overflow-hidden"
                style={{ boxShadow: "0 8px 40px rgba(123,97,255,0.18)", animation: "dropIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div className="px-4 py-3 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full border-2 border-white shadow mb-2 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mb-2">
                      {firstName.charAt(0)}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                </div>

                <div className="p-2">
                  {[
                    { icon: <UserPen className="w-4 h-4" />, label: "Edit Profile", action: () => openModal("editProfile") },
                    { icon: <Settings className="w-4 h-4" />, label: "Settings", action: () => openModal("settings") },
                    { icon: <Bell className="w-4 h-4" />, label: "Notifications", action: () => { setProfileOpen(false); setNotifOpen(true); } },
                  ].map(({ icon, label, action }) => (
                    <button key={label} onClick={action}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 font-medium hover:bg-purple-50 hover:text-purple-700 transition-all">
                      <span className="text-purple-400">{icon}</span>{label}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-purple-100" />
                  {[
                    { icon: <Headset className="w-4 h-4" />, label: "Contact Us", action: () => openModal("contact") },
                    { icon: <Bug className="w-4 h-4" />, label: "Report Issue", action: () => openModal("report") },
                  ].map(({ icon, label, action }) => (
                    <button key={label} onClick={action}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 font-medium hover:bg-purple-50 hover:text-purple-700 transition-all">
                      <span className="text-purple-400">{icon}</span>{label}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-purple-100" />
                  <button onClick={() => openModal("logout")}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 font-medium hover:bg-red-50 transition-all">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard
          label="Startups Viewed"
          value={stats.totalStartupsViewed}
          sub="From mentor recs"
          icon={<Eye className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
        />
        <StatCard
          label="Accepted Startups"
          value={stats.interestedStartups}
          sub="Deal room active"
          icon={<Heart className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-pink-400 to-pink-600"
        />
        <StatCard
          label="Meetings Scheduled"
          value={stats.meetingsScheduled}
          sub="Via Jitsi invites"
          icon={<Calendar className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          label="Active Deals"
          value={stats.fundingRequests}
          sub="Funding in progress"
          icon={<FileText className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-pink-500 to-purple-600"
        />
      </div>

      {/* ── Charts + sidebar ── */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">

          {/* Investment Activity Chart */}
          <Card className="p-6 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Investment Activity</h3>
                <p className="text-sm text-gray-400">Deal & meeting volume · last 6 months</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-none">Live data</Badge>
            </div>
            {investmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={investmentChartData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7B61FF" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3E8FF" />
                  <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E9D5FF", borderRadius: "12px", fontSize: 13 }} />
                  <Line type="monotone" dataKey="amount" stroke="url(#lineGrad)" strokeWidth={3}
                    dot={{ fill: "#7B61FF", r: 5, strokeWidth: 2, stroke: "white" }}
                    activeDot={{ r: 7, fill: "#EC4899" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                No activity data yet — schedule meetings to see chart
              </div>
            )}
          </Card>

          {/* Recommended Startups */}
          <Card className="p-6 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Recommended Startups</h3>
                <p className="text-sm text-gray-400">From your connected mentors · Firestore live</p>
              </div>
              <Badge className="bg-pink-100 text-pink-700 border-none">{recommendations.length} total</Badge>
            </div>
            {recommendedStartups.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <Award className="w-8 h-8 text-purple-200" />
                No recommendations yet — connect with a mentor in the Deal Room
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recommendedStartups.map((startup) => (
                  <div key={startup.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                        {startup.logo ? (
                          <img src={startup.logo} alt={startup.name} className="w-12 h-12 object-cover" />
                        ) : (
                          <span className="text-purple-600 font-bold text-lg">{startup.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{startup.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{startup.founderName}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{startup.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] px-2">{startup.industry}</Badge>
                          <Badge className="bg-pink-100 text-pink-700 border-none text-[10px] px-2">{startup.stage}</Badge>
                          {startup.growthRate ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />{startup.growthRate}%
                            </span>
                          ) : null}
                        </div>
                        {startup.fundingNeeded ? (
                          <p className="mt-2 text-sm font-semibold text-purple-700">
                            ${(startup.fundingNeeded / 1000).toFixed(0)}K needed
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Funding Offers & Feedback Tabs */}
          <Card className="p-6 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              {(["offers", "feedbacks"] as const).map((t) => (
                <button key={t} onClick={() => setActiveStatsTab(t)}
                  className={`text-sm font-semibold pb-1 border-b-2 transition-all capitalize ${activeStatsTab === t ? "border-purple-500 text-purple-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {t === "offers" ? "💰 Funding Offers" : "⭐ Feedbacks Given"}
                </button>
              ))}
            </div>

            {activeStatsTab === "offers" && (
              fundingOffers.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                  <DollarSign className="w-8 h-8 text-purple-200" />
                  No funding offers yet — accept founders in the Deal Room to start
                </div>
              ) : (
                <div className="space-y-3">
                  {fundingOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-3 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{offer.startupName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{offer.amount} · {offer.equity}% equity</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeStatsTab === "feedbacks" && (
              feedbacks.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                  <BarChart2 className="w-8 h-8 text-purple-200" />
                  No feedbacks submitted yet — rate startups in the Deal Room
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-purple-100 bg-pink-50/40 hover:bg-pink-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{f.startupName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 10 }, (_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < f.overallScore ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gray-200"}`} />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">{f.overallScore}/10</span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize ${
                        f.recommendation === "consider" ? "bg-blue-50 text-blue-700 border-blue-200"
                          : f.recommendation === "pass" ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}>
                        {f.recommendation.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* Industry Pie */}
          <Card className="p-5 bg-white border border-purple-100 shadow-sm">
            <h3 className="font-semibold text-base text-gray-900 mb-4">Startup Industries</h3>
            {industryData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-gray-300 text-xs">No data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={industryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                      paddingAngle={4} dataKey="value">
                      {industryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: "10px", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {industryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Upcoming Meetings */}
          <Card className="p-5 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base text-gray-900">Upcoming Meetings</h3>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            {upcomingMeetings.length === 0 ? (
              <div className="py-6 text-center text-gray-300 text-xs flex flex-col items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-100" />
                No meetings yet
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id}
                    className="p-3 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/60 to-pink-50/40 hover:shadow-md transition-all">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {meeting.startupName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 truncate">{meeting.startupName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{meeting.founder}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span className="text-[11px] text-purple-600 font-medium">{meeting.date}</span>
                          {meeting.time && <span className="text-[11px] text-gray-400">· {meeting.time}</span>}
                        </div>
                        {meeting.link && (
                          <a href={meeting.link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-pink-600 font-semibold mt-1.5 hover:underline">
                            📹 Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Live Notifications panel */}
         
        </div>
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Edit Profile */}
      <Overlay open={modal === "editProfile"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[580px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Edit Profile</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-purple-100" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-4 border-purple-100">
                    <span className="text-white font-bold text-2xl">{firstName.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => setProfile(prev => ({ ...prev, avatar: reader.result as string }));
                  reader.readAsDataURL(file);
                }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {([
                { label: "Full Name", field: "name" as const, type: "text" },
                { label: "Email", field: "email" as const, type: "email" },
                { label: "Phone Number", field: "phone" as const, type: "tel" },
                { label: "Company / Investor Firm", field: "company" as const, type: "text" },
              ]).map(({ label, field, type }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                  <input type={type} value={profile[field] as string}
                    onChange={(e) => setProfile(prev => ({ ...prev, [field]: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                </div>
              ))}

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Investor Bio</label>
                <textarea value={profile.bio} rows={3}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all resize-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Size</label>
                <select value={profile.companySize}
                  onChange={(e) => setProfile(prev => ({ ...prev, companySize: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all">
                  <option value="">Select company size</option>
                  {["1-10 Employees", "11-50 Employees", "51-200 Employees", "201-500 Employees", "500+ Employees"].map(o => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              {([
                { label: "LinkedIn Profile", field: "linkedin" as const, type: "url" },
                { label: "Location", field: "location" as const, type: "text" },
                { label: "Investment Interests", field: "interests" as const, type: "text" },
              ]).map(({ label, field, type }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                  <input type={type} value={profile[field] as string}
                    onChange={(e) => setProfile(prev => ({ ...prev, [field]: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                </div>
              ))}

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">About Company</label>
                <textarea value={profile.aboutCompany} rows={3}
                  onChange={(e) => setProfile(prev => ({ ...prev, aboutCompany: e.target.value }))}
                  placeholder="Tell founders about your company, vision, and what you bring beyond capital…"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all resize-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Funding Range</label>
                <select value={profile.funding}
                  onChange={(e) => setProfile(prev => ({ ...prev, funding: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all">
{["₹10L – ₹50L", "₹50L – ₹2Cr", "₹2Cr – ₹10Cr", "₹10Cr – ₹50Cr", "₹50Cr+"].map(o => (                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Availability Status</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY.map(({ label, color }) => {
                  const active = availability.includes(label);
                  return (
                    <button key={label} type="button" onClick={() => toggleAvailability(label)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${active ? "border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-sm" : "border-gray-200 text-gray-500 hover:border-purple-300"}`}>
                      <span className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: active ? color : "#d1d5db", boxShadow: active ? `0 0 0 3px ${color}33` : "none" }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-purple-50">
              <button onClick={() => setModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-600 transition-all">
                Cancel
              </button>
              <button onClick={handleSaveProfile} disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
                {saving ? "Saving…" : saveSuccess ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </Overlay>

      {/* ── Settings ── */}
      <Overlay open={modal === "settings"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[420px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Settings</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {[
              { icon: <Lock className="w-5 h-5 text-purple-500" />, label: "Change Password", desc: "Update your account password", action: () => setSubModal("changePassword") },
              { icon: <BellOff className="w-5 h-5 text-purple-500" />, label: "Notification Preferences", desc: "Manage what alerts you receive", action: () => setSubModal("notifPrefs") },
              { icon: <Shield className="w-5 h-5 text-purple-500" />, label: "Security Questions", desc: "Set backup questions for account recovery", action: () => setSubModal("securityQuestions") },
            ].map(({ icon, label, desc, action }) => (
              <button key={label} onClick={action}
                className="flex items-center justify-between w-full p-4 rounded-xl border border-purple-50 hover:bg-purple-50/60 hover:border-purple-200 transition-all group">
                <div className="flex items-center gap-3">
                  {icon}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Change Password sub-modal */}
        {subModal === "changePassword" && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Change Password</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                    <input type="password" placeholder={`Enter ${label.toLowerCase()}`}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSubModal(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
                <button onClick={() => setSubModal(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Preferences sub-modal */}
        {subModal === "notifPrefs" && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Notification Preferences</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <NotifToggleRow label="Meeting reminders" desc="Get notified before meetings" defaultOn={true} />
              <NotifToggleRow label="Funding request updates" desc="Status changes on applications" defaultOn={true} />
              <NotifToggleRow label="New startup matches" desc="Startups matching your interests" defaultOn={false} />
              <NotifToggleRow label="Message notifications" desc="New messages from founders" defaultOn={true} />
              <div className="mt-5 text-right">
                <button onClick={() => setSubModal(null)} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90">Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Security Questions sub-modal */}
        {subModal === "securityQuestions" && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Security Questions</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Set up backup questions used to verify your identity if you ever need to recover your account.
              </p>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question 1</label>
                  <select value={secQ1} onChange={(e) => setSecQ1(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                    {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={secA1}
                    onChange={(e) => setSecA1(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question 2</label>
                  <select value={secQ2} onChange={(e) => setSecQ2(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                    {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={secA2}
                    onChange={(e) => setSecA2(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSubModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">
                  Cancel
                </button>
                <button onClick={handleSaveSecurityQuestions} disabled={savingSecurity}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 disabled:opacity-60">
                  {savingSecurity ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Overlay>

      {/* Contact Us */}
      <Overlay open={modal === "contact"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[460px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Contact Support</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</label>
              <select value={contactSubject} onChange={(e) => setContactSubject(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                <option>General Inquiry</option><option>Technical Issue</option><option>Billing</option>
                <option>Feature Request</option><option>Partnership</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
              <textarea rows={4} placeholder="Describe how we can help you..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-purple-50">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
              <button onClick={handleSendContact} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90">Send Message</button>
            </div>
          </div>
        </div>
      </Overlay>

      {/* Report Issue */}
      <Overlay open={modal === "report"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[420px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Report an Issue</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issue Category</label>
              <select value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                <option>Bug / Error</option><option>UI / Display Issue</option><option>Performance</option>
                <option>Data Incorrect</option><option>Account Access</option><option>Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Describe the Issue</label>
              <textarea rows={4} placeholder="What happened? Steps to reproduce..." value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 resize-none" />
            </div>
            
            <div className="flex justify-end gap-3 pt-2 border-t border-purple-50">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
              <button onClick={handleSubmitIssue} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90">Submit Report</button>
            </div>
          </div>
        </div>
      </Overlay>

      {/* Logout */}
      <Overlay open={modal === "logout"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
            <LogOut className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Log out of EmpowerHer?</h3>
          <p className="text-sm text-gray-400 mb-6">You'll need to sign in again to access your investor dashboard.</p>
          <div className="flex flex-col gap-3">
            <button onClick={async () => { await signOut(auth); }}
              className="w-full py-3 text-sm font-semibold text-red-500 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-all">
              Yes, Logout
            </button>
            <button onClick={() => setModal(null)}
              className="w-full py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-600 transition-all">
              Cancel, Stay In
            </button>
          </div>
        </div>
      </Overlay>

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: scale(0.88) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}