import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../../../../../firebase";
import {
  collection, query, where, onSnapshot, orderBy, limit, getDocs,
  doc, getDoc, setDoc, Timestamp, updateDoc,addDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Users, Calendar, DollarSign, CheckCircle2,
  Bell, ChevronDown, UserPen, Settings, LogOut,
  Headset, Bug, Lock, BellOff, Shield,
  ChevronRight, X, Upload, Camera,
  Clock, MessageSquare, Activity, TrendingUp,
  BarChart2, Award, Star, UserCheck, AlertCircle,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type ModalId = "editProfile" | "settings" | "contact" | "report" | "logout" | null;
type SubModalId = "changePassword" | "notifPrefs" | "securityQuestions" | null;

interface MentorProfile {
  name: string; email: string; phone: string; expertise: string;
  bio: string; linkedin: string; location: string; avatar: string;
  yearsExp: string; industries: string;
}

interface LiveStats {
  totalFounders: number; pendingRequests: number;
  sessionsCompleted: number; investorsConnected: number;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "session_request" | "message" | "pitch" | "evaluation" | "general";
  sourceId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRelativeTime = (ts: Timestamp | Date | undefined): string => {
  if (!ts) return "";
  const date = ts instanceof Timestamp ? ts.toDate() : ts;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const INDUSTRY_COLORS = ["#7B61FF", "#EC4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

const NOTIF_META: Record<string, { emoji: string; color: string; bg: string }> = {
  session_request: { emoji: "📅", color: "#7B61FF", bg: "from-blue-500 to-purple-500" },
  message:         { emoji: "💬", color: "#10b981", bg: "from-green-500 to-emerald-500" },
  pitch:           { emoji: "🚀", color: "#f59e0b", bg: "from-orange-400 to-pink-500" },
  evaluation:      { emoji: "⭐", color: "#EC4899", bg: "from-pink-500 to-rose-500" },
  general:         { emoji: "🔔", color: "#7B61FF", bg: "from-purple-500 to-pink-500" },
};

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favorite book?",
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Overlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function NotifToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-purple-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button onClick={() => setEnabled((e) => !e)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-purple-500" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function StatCard({ label, value, sub, icon, gradient }: {
  label: string; value: number | string; sub: string; icon: React.ReactNode; gradient: string;
}) {
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [profile, setProfile] = useState<MentorProfile>({
    name: "", email: "", phone: "", expertise: "", bio: "",
    linkedin: "", location: "", avatar: "", yearsExp: "", industries: "",
  });
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [stats, setStats] = useState<LiveStats>({
    totalFounders: 0, pendingRequests: 0, sessionsCompleted: 0, investorsConnected: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  // ── Unified real-time notifications ──
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [industryData, setIndustryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [growthData] = useState([
    { month: "Jan", startups: 28 }, { month: "Feb", startups: 32 },
    { month: "Mar", startups: 35 }, { month: "Apr", startups: 40 },
    { month: "May", startups: 44 }, { month: "Jun", startups: 48 },
  ]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [modal, setModal] = useState<ModalId>(null);
  const [subModal, setSubModal] = useState<SubModalId>(null);

  // Security questions form state
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

  const mentorName = auth.currentUser?.displayName || profile.name;
  const mentorEmail = auth.currentUser?.email || profile.email;
  const firstName = profile.name?.split(" ")[0] || "Mentor";

  // ── Load profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    let settled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) return;
      try {
        const ref = doc(db, "mentors", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            name: d.fullName ?? user.displayName ?? "",
            email: user.email ?? "", phone: d.phone ?? "",
            expertise: d.expertise ?? "", bio: d.bio ?? "",
            linkedin: d.linkedin ?? "", location: d.location ?? "",
            avatar: d.photoURL ?? user.photoURL ?? "",
            yearsExp: d.yearsExp ?? "", industries: d.industries ?? "",
          });
          if (d.securityQ1) setSecQ1(d.securityQ1);
          if (d.securityQ2) setSecQ2(d.securityQ2);
        } else {
          const seed = {
            fullName: user.displayName ?? "", email: user.email ?? "",
            phone: "", expertise: "", bio: "", linkedin: "", location: "",
            photoURL: user.photoURL ?? "", yearsExp: "", industries: "", createdAt: new Date(),
          };
          await setDoc(ref, seed);
          setProfile({ ...seed, name: seed.fullName, avatar: seed.photoURL });
        }
      } catch (e) { console.error(e); }
      finally { if (!settled) { settled = true; setLoading(false); } }
    });
    const t = setTimeout(() => { if (!settled) { settled = true; setLoading(false); } }, 6000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // ── UNIFIED NOTIFICATIONS ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mentorName && !mentorEmail) return;
    const unsubs: (() => void)[] = [];

    if (mentorName) {
      const q = query(
        collection(db, "sessionRequests"),
        where("mentorName", "==", mentorName),
        orderBy("createdAt", "desc"),
        limit(15)
      );
      unsubs.push(onSnapshot(q, (snap) => {
        const newNotifs: AppNotification[] = snap.docs.map((d) => {
          const data = d.data();
          const isPending = data.status === "pending";
          return {
            id: `sr-${d.id}`,
            type: "session_request",
            title: isPending ? "New Session Request" : `Request ${data.status}`,
            message: `${data.founderName || data.founder || "A founder"} ${isPending ? "sent you a session request" : `— status: ${data.status}`}${data.topic ? ` · ${data.topic}` : ""}`,
            time: formatRelativeTime(data.createdAt),
            read: data.status !== "pending",
            sourceId: d.id,
          };
        });
        setNotifications((prev) => {
          const filtered = prev.filter((n) => !n.id.startsWith("sr-"));
          return [...filtered, ...newNotifs].sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
        });
      }));
    }

    const pq = query(collection(db, "pitches"), orderBy("createdAt", "desc"), limit(10));
    unsubs.push(onSnapshot(pq, (snap) => {
      const newNotifs: AppNotification[] = snap.docs
        .filter((d) => !d.data().isDraft)
        .map((d) => {
          const data = d.data();
          return {
            id: `pitch-${d.id}`,
            type: "pitch",
            title: "Pitch Submitted",
            message: `${data.founderName || data.startupName || "A founder"} submitted a pitch${data.startupName ? ` for ${data.startupName}` : ""}`,
            time: formatRelativeTime(data.createdAt),
            read: data.status === "reviewed",
            sourceId: d.id,
          };
        });
      setNotifications((prev) => {
        const filtered = prev.filter((n) => !n.id.startsWith("pitch-"));
        return [...filtered, ...newNotifs].sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
      });
    }));

    const eq = query(collection(db, "evaluations"), orderBy("createdAt", "desc"), limit(10));
    unsubs.push(onSnapshot(eq, (snap) => {
      const newNotifs: AppNotification[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: `eval-${d.id}`,
          type: "evaluation",
          title: "Readiness Evaluation",
          message: `${data.founderName || "A founder"} completed a readiness evaluation — score: ${data.percentage ?? data.totalScore ?? "?"}`,
          time: formatRelativeTime(data.createdAt),
          read: !!data.reviewed,
          sourceId: d.id,
        };
      });
      setNotifications((prev) => {
        const filtered = prev.filter((n) => !n.id.startsWith("eval-"));
        return [...filtered, ...newNotifs].sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
      });
    }));

    if (auth.currentUser) {
      const nq = query(
        collection(db, "notifications"),
        where("to", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(15)
      );
      unsubs.push(onSnapshot(nq, (snap) => {
        const newNotifs: AppNotification[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: `notif-${d.id}`,
            type: (data.type as any) ?? "general",
            title: data.type?.replace(/_/g, " ") ?? "Notification",
            message: data.message ?? "",
            time: formatRelativeTime(data.createdAt),
            read: data.read ?? false,
            sourceId: d.id,
          };
        });
        setNotifications((prev) => {
          const filtered = prev.filter((n) => !n.id.startsWith("notif-"));
          return [...filtered, ...newNotifs].sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
        });
      }));
    }

    return () => unsubs.forEach((u) => u());
  }, [mentorName, mentorEmail]);

  const handleOpenNotif = () => {
    setNotifOpen((o) => !o);
    setProfileOpen(false);
    if (!notifOpen) {
      setTimeout(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }, 2000);
    }
  };

  // ── Accepted founders + industry data ────────────────────────────────────
  useEffect(() => {
    if (!mentorName) return;
    const q = query(collection(db, "sessionRequests"), where("mentorName", "==", mentorName), where("status", "==", "accepted"));
    return onSnapshot(q, (snap) => {
      setStats((prev) => ({ ...prev, totalFounders: snap.size }));
      const industries: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const ind = d.data().industry || "Others";
        industries[ind] = (industries[ind] || 0) + 1;
      });
      const total = snap.size || 1;
      const distrib = Object.entries(industries).map(([name, count], i) => ({
        name, value: Math.round((count / total) * 100),
        color: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length],
      }));
      setIndustryData(distrib.length > 0 ? distrib : [
        { name: "FinTech", value: 31, color: "#7B61FF" },
        { name: "HealthTech", value: 25, color: "#EC4899" },
        { name: "EdTech", value: 17, color: "#10b981" },
        { name: "E-commerce", value: 15, color: "#f59e0b" },
        { name: "Others", value: 12, color: "#3b82f6" },
      ]);
    });
  }, [mentorName]);

  // ── Pending requests count ────────────────────────────────────────────────
  useEffect(() => {
    if (!mentorName) return;
    const q = query(collection(db, "sessionRequests"), where("mentorName", "==", mentorName), where("status", "==", "pending"));
    return onSnapshot(q, (snap) => setStats((prev) => ({ ...prev, pendingRequests: snap.size })));
  }, [mentorName]);

  // ── Sessions completed + upcoming ─────────────────────────────────────────
  useEffect(() => {
    if (!mentorEmail) return;
    const q = query(collection(db, "mentorSessions"), where("mentorEmail", "==", mentorEmail));
    return onSnapshot(q, (snap) => {
      const total = snap.docs.reduce((acc, d) => acc + (d.data().completedSessions || 0), 0);
      setStats((prev) => ({ ...prev, sessionsCompleted: total }));
      const upcoming = snap.docs
        .filter((d) => d.data().completedSessions < d.data().totalSessions)
        .slice(0, 3)
        .map((d) => ({
          id: d.id,
          founder: d.data().founderName || d.data().founderEmail || "Founder",
          startup: d.data().topic || "General mentoring",
          time: d.data().scheduledAt || "Scheduled",
          topic: d.data().topic || "Mentoring session",
        }));
      setUpcomingSessions(upcoming);
    });
  }, [mentorEmail]);

  // ── Investors Connected ───────────────────────────────────────────────────
  useEffect(() => {
  if (!currentUser) return;
  const q = query(
    collection(db, "connectionRequests"),
    where("fromId", "==", currentUser.uid),
    where("status", "in", ["accepted", "Accepted"])
  );
  return onSnapshot(q, (snap) => {
    setStats((prev) => ({ ...prev, investorsConnected: snap.size }));
  });
}, [currentUser]);

  // ── Readiness evaluations ─────────────────────────────────────────────────


  // ── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Save profile ──────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "mentors", currentUser.uid), {
        fullName: profile.name, email: profile.email, phone: profile.phone,
        expertise: profile.expertise, bio: profile.bio, linkedin: profile.linkedin,
        location: profile.location, photoURL: profile.avatar,
        yearsExp: profile.yearsExp, industries: profile.industries, updatedAt: new Date(),
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setModal(null); }, 1200);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  // ── Save security questions ───────────────────────────────────────────────
  async function handleSaveSecurityQuestions() {
    if (!currentUser) return;
    if (!secA1.trim() || !secA2.trim()) {
      alert("Please answer both security questions.");
      return;
    }
    setSavingSecurity(true);
    try {
      await setDoc(doc(db, "mentors", currentUser.uid), {
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
        mentorId: currentUser?.uid || null,
        mentorEmail: currentUser?.email || null,
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
        mentorId: currentUser?.uid || null,
        mentorEmail: currentUser?.email || null,
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
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return (
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

  return (
    <div className="space-y-6">

      {/* ── Welcome Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here's your live mentoring activity</p>
        </div>

        <div className="flex items-center gap-3">

          {/* ── Notification Bell ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotif}
              className="relative p-2.5 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
            >
              <Bell className="w-5 h-5 text-purple-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-12 w-96 bg-white border border-purple-100 rounded-2xl shadow-2xl z-40 overflow-hidden"
                style={{ boxShadow: "0 12px 40px rgba(123,97,255,0.18)" }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-500" />
                    <span className="font-bold text-gray-900 text-sm">Notifications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <span className="text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-2.5 py-0.5">
                        {unreadCount} new
                      </span>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-purple-200" />
                      </div>
                      <p className="text-sm text-gray-400">No notifications yet</p>
                      <p className="text-xs text-gray-300">Session requests and messages will appear here</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const meta = NOTIF_META[n.type] ?? NOTIF_META.general;
                      return (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3.5 border-b border-purple-50 last:border-0 hover:bg-purple-50/40 cursor-pointer transition-colors ${!n.read ? "bg-purple-50/60" : ""}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm bg-gradient-to-br ${meta.bg}`}>
                            {meta.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 mb-0.5">{n.title}</p>
                            <p className="text-xs text-gray-500 leading-snug line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{n.time}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mt-1 flex-shrink-0 shadow-sm shadow-purple-300" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-5 py-3 border-t border-purple-50 bg-gradient-to-r from-purple-50/50 to-pink-50/50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{notifications.length} total</span>
                    <button
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                      className="text-xs text-purple-600 font-semibold hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Profile Dropdown ── */}
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
                <p className="font-semibold text-sm text-gray-900">{profile.name || "Mentor"}</p>
                <p className="text-xs text-purple-400">Mentor</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-14 w-56 bg-white border border-purple-100 rounded-2xl shadow-2xl z-40 overflow-hidden"
                style={{ boxShadow: "0 8px 40px rgba(123,97,255,0.18)", animation: "dropIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
              >
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

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard label="Total Founders" value={stats.totalFounders} sub="Accepted sessions"
          icon={<Users className="w-6 h-6" />} gradient="bg-gradient-to-br from-purple-500 to-purple-700" />
        <StatCard label="Pending Requests" value={stats.pendingRequests} sub="Awaiting response"
          icon={<Calendar className="w-6 h-6" />} gradient="bg-gradient-to-br from-pink-400 to-pink-600" />
        <StatCard label="Sessions Completed" value={stats.sessionsCompleted} sub="All time"
          icon={<CheckCircle2 className="w-6 h-6" />} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard label="Investors Connected" value={stats.investorsConnected} sub="Active connections"
          icon={<TrendingUp className="w-6 h-6" />} gradient="bg-gradient-to-br from-pink-500 to-purple-600" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">

          {/* Startup Growth Chart */}
          <Card className="p-6 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Startup Growth</h3>
                <p className="text-sm text-gray-400">Founders onboarded · last 6 months</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-none">Live data</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={growthData}>
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
                <Line type="monotone" dataKey="startups" stroke="url(#lineGrad)" strokeWidth={3}
                  dot={{ fill: "#7B61FF", r: 5, strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 7, fill: "#EC4899" }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Sessions & Evaluations Tab */}
          <Card className="p-6 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <h3 className="text-sm font-semibold text-purple-700 pb-1 border-b-2 border-purple-500">
                🗓 Upcoming Sessions
              </h3>
            </div>

{(
                upcomingSessions.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                  <Clock className="w-8 h-8 text-purple-200" />
                  No upcoming sessions. Create one in Session Hub!
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm">
                          {getInitials(session.founder)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{session.founder}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{session.topic}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">{session.time}</span>
                    </div>
                  ))}
                </div>
              )
            )}

           
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* ── Enhanced Industry Pie Chart ── */}
          <Card className="p-5 bg-white border border-purple-100 shadow-sm">
            <h3 className="font-semibold text-base text-gray-900 mb-1">Founder Industries</h3>
            <p className="text-xs text-gray-400 mb-4">Distribution across sectors</p>
            {industryData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-gray-300 text-xs">No data</div>
            ) : (
              <>
                {/* Donut chart with centered label */}
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {industryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [`${v}%`, "Share"]}
                        contentStyle={{ borderRadius: "10px", fontSize: 12, border: "1px solid #E9D5FF" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centered sector count */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-bold text-purple-700">{industryData.length}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">sectors</p>
                  </div>
                </div>

                {/* 2-column legend with color-coded percentages */}
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                  {industryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] text-gray-600 truncate flex-1">{item.name}</span>
                      <span
                        className="text-[11px] font-bold flex-shrink-0"
                        style={{ color: item.color }}
                      >
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Top sector highlight pill */}
                {(() => {
                  const top = [...industryData].sort((a, b) => b.value - a.value)[0];
                  return top ? (
                    <div
                      className="mt-4 rounded-xl p-3 flex items-center gap-2.5"
                      style={{ background: `${top.color}18`, border: `1px solid ${top.color}33` }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: top.color }}
                      >
                        <Star className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-800">Top sector: {top.name}</p>
                        <p className="text-[10px] text-gray-400">{top.value}% of your founders</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </>
            )}
          </Card>

          {/* Next Sessions */}
          <Card className="p-5 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base text-gray-900">Next Sessions</h3>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="py-6 text-center text-gray-300 text-xs flex flex-col items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-100" />
                No sessions scheduled
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-3 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/60 to-pink-50/40 hover:shadow-md transition-all">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {getInitials(session.founder)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 truncate">{session.founder}</p>
                        <p className="text-[11px] text-gray-400 truncate">{session.startup}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span className="text-[11px] text-purple-600 font-medium">{session.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Alerts */}
          <Card className="p-5 bg-white border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              {unreadCount > 0 && (
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none text-[10px]">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-gray-300 text-xs flex flex-col items-center gap-2">
                <Bell className="w-6 h-6 text-purple-100" />
                No alerts yet
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 4).map((notif) => {
                  const meta = NOTIF_META[notif.type] ?? NOTIF_META.general;
                  return (
                    <div key={notif.id}
                      className={`p-3 rounded-xl border transition-all ${!notif.read ? "bg-purple-50/70 border-purple-200" : "bg-white border-gray-100"}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-none mt-0.5">{meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 capitalize">{notif.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5">{notif.time}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Edit Profile */}
      <Overlay open={modal === "editProfile"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[540px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Edit Profile</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-5">
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
                  reader.onloadend = () => setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
                  reader.readAsDataURL(file);
                }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                { label: "Full Name", field: "name" as const, type: "text" },
                { label: "Email", field: "email" as const, type: "email" },
                { label: "Phone Number", field: "phone" as const, type: "tel" },
                { label: "Area of Expertise", field: "expertise" as const, type: "text" },
                { label: "LinkedIn Profile", field: "linkedin" as const, type: "url" },
                { label: "Location", field: "location" as const, type: "text" },
                { label: "Years of Experience", field: "yearsExp" as const, type: "text" },
                { label: "Industries", field: "industries" as const, type: "text" },
              ]).map(({ label, field, type }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                  <input type={type} value={profile[field] as string}
                    onChange={(e) => setProfile((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</label>
                <textarea value={profile.bio} rows={3}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-purple-50">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-600 transition-all">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
                {saving ? "Saving…" : saveSuccess ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </Overlay>

      {/* Settings */}
      <Overlay open={modal === "settings"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[420px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Settings</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
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

        {subModal === "notifPrefs" && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Notification Preferences</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <NotifToggleRow label="Session requests" desc="New founder session requests" defaultOn={true} />
              <NotifToggleRow label="Message notifications" desc="New messages from founders" defaultOn={true} />
              <NotifToggleRow label="Pitch submissions" desc="When a founder submits a pitch" defaultOn={true} />
              <NotifToggleRow label="Evaluation reminders" desc="Pending readiness evaluations" defaultOn={false} />
              <NotifToggleRow label="Platform updates" desc="New features and announcements" defaultOn={true} />
              <div className="mt-5 text-right">
                <button onClick={() => setSubModal(null)} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90">Done</button>
              </div>
            </div>
          </div>
        )}

        {subModal === "securityQuestions" && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Security Questions</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-gray-400 mb-4">Set up backup questions used to verify your identity if you ever need to recover your account.</p>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question 1</label>
                  <select value={secQ1} onChange={(e) => setSecQ1(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                    {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <input type="text" placeholder="Your answer" value={secA1}
                    onChange={(e) => setSecA1(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question 2</label>
                  <select value={secQ2} onChange={(e) => setSecQ2(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                    {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <input type="text" placeholder="Your answer" value={secA2}
                    onChange={(e) => setSecA2(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSubModal(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
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
        <div className="bg-white rounded-2xl shadow-2xl w-[460px]">
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
          <p className="text-sm text-gray-400 mb-6">You'll need to sign in again to access your mentor dashboard.</p>
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