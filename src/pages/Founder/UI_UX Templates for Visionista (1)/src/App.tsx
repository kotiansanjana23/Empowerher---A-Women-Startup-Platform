import { useState, useEffect, useRef } from "react";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { ChatPage } from "./components/ChatPage";
import { MentorMatching } from "./components/MentorMatching";
import { PitchSubmission } from "./components/PitchSubmission";
import { Training } from "./components/Training";
import { Funding } from "./components/Funding";
import { Button } from "./components/ui/button";
import { FounderProfile } from "./components/FounderProfile";
import { FounderInvestorDealRoom } from "./components/FounderInvestorDealRoom";
import {
  ChevronDown, LogOut, X, Lock, BellOff, Shield,
  ChevronRight, Eye, EyeOff, Headset, Bug, Info,
} from "lucide-react";
import { auth, db } from "../../../../firebase";
import { onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../../../../logo.png";



/* ─── Types ─── */
type ModalId = "settings" | "contact" | "report" | "logout" | null;
type SubModalId = "changePassword" | "notifPrefs" | "securityQuestions" | null;

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favorite book?",
];

/* ─── Overlay wrapper ─── */
function Overlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/* ─── Notification toggle row ─── */
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
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: enabled ? "#9333ea" : "#e5e7eb" }}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

/* ─── About Us page ─── */
/* ─── About Us page ─── */
function AboutUs({ onBack }: { onBack: () => void }) {
  const features = [
    { icon: "🤝", title: "Mentor Matching", desc: "Get paired with founders and operators who've walked the path before you." },
    { icon: "📊", title: "Pitch Center", desc: "Build, refine, and submit pitch decks that actually get read." },
    { icon: "💰", title: "Funding", desc: "Discover grants, schemes, and investor-ready funding opportunities." },
    { icon: "🤝🏽", title: "Investor Deal Room", desc: "Move from intro to term sheet in one focused, trackable space." },
    { icon: "🎓", title: "Startup Training", desc: "Structured modules covering everything from cap tables to GTM." },
    { icon: "✨", title: "AI Assistant", desc: "An always-on co-pilot for questions, drafts, and decisions." },
  ];

  const stats = [
    { value: "500+", label: "Women Founders" },
    { value: "120+", label: "Expert Mentors" },
    { value: "₹2Cr+", label: "Funding Facilitated" },
    { value: "35+", label: "Cities Reached" },
  ];

  const whyUs = [
    { title: "Built for Women, By Design", desc: "Every feature is designed around the real constraints and ambitions of women founders — not retrofitted." },
    { title: "Curated, Not Crowdsourced", desc: "Mentors and investors are vetted. Quality over quantity, every time." },
    { title: "End-to-End Journey", desc: "From your first idea to your first term sheet, one platform carries you the whole way." },
    { title: "Community That Shows Up", desc: "Founders helping founders — peer support that doesn't disappear after the demo day." },
  ];

  const creators = [
    { name: "Sanjana Kotian", role: "Co-Creator & Developer", initials: "SK" },
    { name: "Swapnil Kadam", role: "Co-Creator & Developer", initials: "SK" },
    { name: "Hemangi Purkar", role: "Co-Creator & Developer", initials: "HP" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(160deg, #faf5ff 0%, #fdf2f8 45%, #f5f3ff 100%)" }}>

      {/* ── Floating ambient blobs ── */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse" style={{ background: "radial-gradient(circle, #9333ea, transparent)" }} />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, #db2777, transparent)" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #c026d3, transparent)" }} />

      <div className="relative max-w-6xl mx-auto px-6 py-20">

        {/* ══ Hero ══ */}
        <div className="text-center mb-24">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 "
          >
<img
    src={logo}
    alt="EmpowerHer"
    className="w-100 h-100 object-contain"
  />
            </div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ color: "#a855f7" }}>
            Empowering Women in Business
          </p>
          <h1
            className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight"
            style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Where Women Founders<br className="hidden sm:block" /> Build What's Next
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            EmpowerHer is the ecosystem behind ambitious women — mentorship, funding, training,
            and a community built to turn first ideas into first revenue.
          </p>
        </div>

        {/* ══ Our Story ══ */}
        <div
          className="relative rounded-[28px] p-10 mb-24 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(147,51,234,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(147,51,234,0.1)" }}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
          />
          <div className="relative grid md:grid-cols-[auto,1fr] gap-8 items-start">
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "#db2777" }}>Our Story</span>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                EmpowerHer began with a simple observation: women founders weren't short on ideas —
                they were short on access. Access to mentors who understood their context, capital
                that didn't come with second-guessing, and a community that took their ambition seriously.
              </p>
              <p>
                So we built the platform we wished existed: a single home for mentorship, pitch
                readiness, training, and funding — designed specifically around how women build
                businesses, not adapted from someone else's blueprint.
              </p>
            </div>
          </div>
        </div>

        {/* ══ Feature Showcase ══ */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#3b0764" }}>Everything You Need, One Platform</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Six tools built to move you from idea to investment-ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2 cursor-default"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(147,51,234,0.12)", backdropFilter: "blur(16px)", boxShadow: "0 8px 30px rgba(147,51,234,0.06)" }}
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.08), rgba(219,39,119,0.08))" }}
                />
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #f3e8ff, #fce7f3)" }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#3b0764" }}>{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ Impact Stats ══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-24">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative rounded-2xl p-6 text-center overflow-hidden transition-transform duration-300 hover:scale-[1.04]"
              style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", boxShadow: "0 10px 30px rgba(147,51,234,0.25)" }}
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-white/80 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ══ Vision & Mission ══ */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {[
            { tag: "Our Vision", title: "A world where funding follows merit, not gender.", desc: "We envision an entrepreneurial landscape where every woman with a viable idea has equal access to the capital, guidance, and network needed to build it." },
            { tag: "Our Mission", title: "Equip. Connect. Fund.", desc: "We equip founders with skills, connect them to mentors and investors who care, and help unlock the funding that turns plans into companies." },
          ].map((v) => (
            <div
              key={v.tag}
              className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(147,51,234,0.15)", backdropFilter: "blur(18px)" }}
            >
              <span
                className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", color: "#fff" }}
              >
                {v.tag}
              </span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#3b0764" }}>{v.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* ══ Why Choose EmpowerHer ══ */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#3b0764" }}>Why Choose EmpowerHer</h2>
            <p className="text-gray-500 max-w-lg mx-auto">We're not the only platform for founders. Here's why women choose us.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {whyUs.map((w) => (
              <div
                key={w.title}
                className="flex gap-4 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
                style={{ background: "#fff", border: "1.5px solid #f3e8ff" }}
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
                >
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "#3b0764" }}>{w.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ Meet The Creators ══ */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "#a855f7" }}>The People Behind It</p>
            <h2 className="text-3xl font-extrabold" style={{ color: "#3b0764" }}>Meet The Creators</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {creators.map((c) => (
              <div
                key={c.name}
                className="group relative rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(147,51,234,0.15)", backdropFilter: "blur(18px)", boxShadow: "0 10px 36px rgba(147,51,234,0.08)" }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-24 rounded-t-3xl opacity-60"
                  style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
                />
                <div
                  className="relative w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
                >
                  {c.initials}
                </div>
                <h3 className="relative text-base font-bold" style={{ color: "#3b0764" }}>{c.name}</h3>
                <p className="relative text-xs text-gray-400 mt-1">{c.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CTA ══ */}
        <div
          className="relative rounded-[32px] p-12 text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", boxShadow: "0 25px 70px rgba(147,51,234,0.35)" }}
        >
          <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-white opacity-10" />
          <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-3">Ready to Build Your Future?</h2>
          <p className="relative text-white/85 max-w-xl mx-auto mb-8">
            Join hundreds of women founders already growing with mentorship, funding, and a community on their side.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: "#fff", color: "#9333ea" }}
            >
              Start Your Journey
            </button>
            
          </div>
        </div>

        <div className="text-center mt-14">
          <button
            onClick={onBack}
            className="px-8 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
/* ════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════ */
export default function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [chatMentor, setChatMentor] = useState<any>(null);
  const navigate = useNavigate();

  // Profile state for navbar
  const [displayName, setDisplayName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [initials, setInitials] = useState("F");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [modal, setModal] = useState<ModalId>(null);
  const [subModal, setSubModal] = useState<SubModalId>(null);

  // Change Password fields
  const [oldPassword,     setOldPassword]     = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld,         setShowOld]         = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [changingPwd,     setChangingPwd]     = useState(false);

  // Security questions
  const [secQ1, setSecQ1] = useState(SECURITY_QUESTIONS[0]);
  const [secA1, setSecA1] = useState("");
  const [secQ2, setSecQ2] = useState(SECURITY_QUESTIONS[1]);
  const [secA2, setSecA2] = useState("");
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Contact / Report fields
  const [contactSubject,   setContactSubject]   = useState("General Inquiry");
  const [contactMessage,   setContactMessage]   = useState("");
  const [issueCategory,    setIssueCategory]    = useState("Bug / Error");
  const [issueDescription, setIssueDescription] = useState("");

  // Load profile from Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const founderSnap = await getDoc(doc(db, "founders", user.uid));
        if (founderSnap.exists()) {
          const data = founderSnap.data();
          const name = data.fullName || user.displayName || user.email?.split("@")[0] || "Founder";
          setDisplayName(name);
          setStartupName(data.startupName || "");
          setPhotoURL(data.photoURL || user.photoURL || "");
          setInitials(name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2));
          if (data.securityQ1) setSecQ1(data.securityQ1);
          if (data.securityQ2) setSecQ2(data.securityQ2);
          return;
        }
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          const name = data.displayName || data.firstName || data.name || user.email?.split("@")[0] || "Founder";
          setDisplayName(name);
          setPhotoURL(data.photoURL || user.photoURL || "");
          setInitials(name[0]?.toUpperCase() || "F");
        } else {
          const name = user.displayName || user.email?.split("@")[0] || "Founder";
          setDisplayName(name);
          setPhotoURL(user.photoURL || "");
          setInitials(name[0]?.toUpperCase() || "F");
        }
      } catch (e) {
        console.error("profile fetch failed:", e);
      }
    });
    return unsub;
  }, []);

  // Load admin contact details
  useEffect(() => {
    getDoc(doc(db, "admins", "mainAdmin"))
      .then((snap) => { if (snap.exists()) setAdminData(snap.data()); })
      .catch(() => {});
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Open a modal (closes the dropdown)
  function openModal(id: ModalId) {
    setShowProfileMenu(false);
    setModal(id);
    setSubModal(null);
  }

  // Change password handler
  async function handleChangePassword() {
    const user = auth.currentUser;
    if (!user?.email) return;
    if (newPassword !== confirmPassword) { alert("Passwords do not match"); return; }
    if (newPassword.length < 6) { alert("Password must be at least 6 characters"); return; }
    setChangingPwd(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      alert("Password updated successfully!");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setSubModal(null);
    } catch (e: any) {
      alert(e.message || "Failed to update password. Check your current password.");
    } finally {
      setChangingPwd(false);
    }
  }

  // Save security questions
  async function handleSaveSecurityQuestions() {
    const user = auth.currentUser;
    if (!user) return;
    if (!secA1.trim() || !secA2.trim()) { alert("Please answer both questions."); return; }
    setSavingSecurity(true);
    try {
      await setDoc(doc(db, "founders", user.uid), {
        securityQ1: secQ1, securityA1: secA1,
        securityQ2: secQ2, securityA2: secA2,
        updatedAt: new Date(),
      }, { merge: true });
      setSecA1(""); setSecA2("");
      setSubModal(null);
    } catch { alert("Failed to save."); }
    finally { setSavingSecurity(false); }
  }

  // Send contact message
  async function handleSendContact() {
    const user = auth.currentUser;
    if (!contactMessage.trim()) { alert("Please enter a message."); return; }
    try {
      await addDoc(collection(db, "contactMessages"), {
        founderId: user?.uid || null,
        founderEmail: user?.email || null,
        subject: contactSubject,
        message: contactMessage,
        createdAt: new Date(),
      });
      alert("Message sent!");
      setContactMessage("");
      setModal(null);
    } catch { alert("Failed to send."); }
  }

  // Submit issue report
  async function handleSubmitIssue() {
    const user = auth.currentUser;
    if (!issueDescription.trim()) { alert("Please describe the issue."); return; }
    try {
      await addDoc(collection(db, "reportedIssues"), {
        founderId: user?.uid || null,
        founderEmail: user?.email || null,
        issueCategory,
        issueDescription,
        status: "pending",
        createdAt: new Date(),
      });
      alert("Issue submitted!");
      setIssueDescription("");
      setModal(null);
    } catch { alert("Failed to submit."); }
  }

  const handleNavigate = (view: string) => {
    if (view === "signin") { navigate("/signin"); return; }
    if (view === "signup") { navigate("/signup"); return; }
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "landing":
        return <LandingPage onSignIn={() => navigate("/signin")} onGetStarted={() => navigate("/signup")} onNavigate={handleNavigate} />;
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "chat":
        return chatMentor ? (
          <ChatPage mentorName={chatMentor.name} mentorAvatar={chatMentor.avatar} mentorRole={chatMentor.role} onBack={() => setCurrentView("dashboard")} mentorId={""} />
        ) : null;
      case "pitch":
        return <PitchSubmission />;
      case "mentors":
        return <MentorMatching />;
      case "investor-deals":
        return <FounderInvestorDealRoom />;
      case "training":
        return <Training />;
      case "funding":
        return <Funding />;
      case "profile":
        return <FounderProfile />;
      case "about":
        return <AboutUs onBack={() => setCurrentView("dashboard")} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (currentView === "chat") return <div className="min-h-screen">{renderCurrentView()}</div>;
  if (currentView === "landing") return (
    <div className="relative">
      <LandingPage onSignIn={() => navigate("/signin")} onGetStarted={() => navigate("/signup")} onNavigate={handleNavigate} />
    </div>
  );

  // ── Modal gradient helper ──
  const gradientText: React.CSSProperties = {
    background: "linear-gradient(135deg, #9333ea, #db2777)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };
  const gradientBtn: React.CSSProperties = {
    background: "linear-gradient(135deg, #9333ea, #db2777)",
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════════════════════════
          MODALS — rendered at root so they
          always sit above everything
          ══════════════════════════════════ */}

      {/* ── Settings modal ── */}
      <Overlay open={modal === "settings"} onClose={() => { setModal(null); setSubModal(null); }}>
        <div className="bg-white rounded-2xl shadow-2xl w-[420px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-50" style={{ background: "linear-gradient(to right, #faf5ff, #fdf2f8)" }}>
            <h2 className="text-lg font-bold" style={gradientText}>Settings</h2>
            <button onClick={() => { setModal(null); setSubModal(null); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 space-y-2">
            {[
              { icon: <Lock className="w-5 h-5" style={{ color: "#9333ea" }} />, label: "Change Password",        desc: "Update your account password",             sub: "changePassword"      as SubModalId },
              { icon: <BellOff className="w-5 h-5" style={{ color: "#9333ea" }} />, label: "Notification Preferences", desc: "Manage what alerts you receive",       sub: "notifPrefs"          as SubModalId },
              { icon: <Shield className="w-5 h-5" style={{ color: "#9333ea" }} />, label: "Security Questions",  desc: "Set backup questions for account recovery", sub: "securityQuestions"   as SubModalId },
            ].map(({ icon, label, desc, sub }) => (
              <button key={label} onClick={() => setSubModal(sub)}
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={gradientText}>Change Password</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Current Password",    value: oldPassword,     setter: setOldPassword,     show: showOld,     setShow: setShowOld     },
                  { label: "New Password",         value: newPassword,     setter: setNewPassword,     show: showNew,     setShow: setShowNew     },
                  { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
                ].map(({ label, value, setter, show, setShow }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                    <div className="relative">
                      <input type={show ? "text" : "password"} value={value} onChange={(e) => setter(e.target.value)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500" onClick={() => setShow(!show)}>
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSubModal(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
                <button onClick={handleChangePassword} disabled={changingPwd}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                  style={gradientBtn}>
                  {changingPwd ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Preferences sub-modal */}
        {subModal === "notifPrefs" && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={gradientText}>Notification Preferences</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <NotifToggleRow label="Mentor updates"        desc="Session requests and acceptances"  defaultOn={true}  />
              <NotifToggleRow label="Investor messages"     desc="New messages from investors"        defaultOn={true}  />
              <NotifToggleRow label="Funding opportunities" desc="New grants and funding matches"     defaultOn={true}  />
              <NotifToggleRow label="Training reminders"    desc="Pending modules and deadlines"      defaultOn={false} />
              <NotifToggleRow label="Platform updates"      desc="New features and announcements"     defaultOn={true}  />
              <div className="mt-5 text-right">
                <button onClick={() => setSubModal(null)} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={gradientBtn}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Security Questions sub-modal */}
        {subModal === "securityQuestions" && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={gradientText}>Security Questions</h3>
                <button onClick={() => setSubModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-gray-400 mb-4">Set backup questions used to verify your identity for account recovery.</p>
              <div className="space-y-4">
                {[
                  { num: 1, q: secQ1, setQ: setSecQ1, a: secA1, setA: setSecA1 },
                  { num: 2, q: secQ2, setQ: setSecQ2, a: secA2, setA: setSecA2 },
                ].map(({ num, q, setQ, a, setA }) => (
                  <div key={num} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question {num}</label>
                    <select value={q} onChange={(e) => setQ(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                      {SECURITY_QUESTIONS.map((sq) => <option key={sq} value={sq}>{sq}</option>)}
                    </select>
                    <input type="text" placeholder="Your answer" value={a} onChange={(e) => setA(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSubModal(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
                <button onClick={handleSaveSecurityQuestions} disabled={savingSecurity}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60" style={gradientBtn}>
                  {savingSecurity ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Overlay>

      {/* ── Contact Support modal ── */}
      <Overlay open={modal === "contact"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[460px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-50" style={{ background: "linear-gradient(to right, #faf5ff, #fdf2f8)" }}>
            <h2 className="text-lg font-bold" style={gradientText}>Contact Support</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            {adminData && (
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
                <Headset className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#9333ea" }} />
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p><span className="font-semibold">Name:</span> {adminData.fullName}</p>
                  <p><span className="font-semibold">Email:</span> {adminData.email}</p>
                  {adminData.phone && <p><span className="font-semibold">Phone:</span> {adminData.phone}</p>}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</label>
              <select value={contactSubject} onChange={(e) => setContactSubject(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                {["General Inquiry", "Technical Issue", "Billing", "Feature Request", "Partnership"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
              <textarea rows={4} placeholder="Describe how we can help you…" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-purple-50">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
              <button onClick={handleSendContact} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={gradientBtn}>Send Message</button>
            </div>
          </div>
        </div>
      </Overlay>

      {/* ── Report Issue modal ── */}
      <Overlay open={modal === "report"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[420px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-50" style={{ background: "linear-gradient(to right, #faf5ff, #fdf2f8)" }}>
            <h2 className="text-lg font-bold" style={gradientText}>Report an Issue</h2>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issue Category</label>
              <select value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50">
                {["Bug / Error", "UI / Display Issue", "Performance", "Data Incorrect", "Account Access", "Other"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Describe the Issue</label>
              <textarea rows={4} placeholder="What happened? Steps to reproduce…" value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-gray-50 resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-purple-50">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">Cancel</button>
              <button onClick={handleSubmitIssue} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={gradientBtn}>Submit Report</button>
            </div>
          </div>
        </div>
      </Overlay>

      {/* ── Logout confirmation modal ── */}
      <Overlay open={modal === "logout"} onClose={() => setModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "#fee2e2" }}>
            <LogOut className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Log out of EmpowerHer?</h3>
          <p className="text-sm text-gray-400 mb-6">You'll need to sign in again to access your dashboard.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => { setModal(null); await signOut(auth); navigate("/signin"); }}
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

      {/* ── Navigation Bar ── */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Left: Logo + nav links */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView("landing")}>
                <div className="w-8 h-8  flex items-center justify-center">
     <img
        src={logo}
        alt="EmpowerHer"
        className="w-30 h-30 object-contain"
      />                </div>
                <span className="font-bold text-xl text-gray-900">EmpowerHer</span>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                {[
                  { label: "Dashboard",      view: "dashboard"      },
                  { label: "Pitch Center",   view: "pitch"          },
                  { label: "Find Mentors",   view: "mentors"        },
                  { label: "Investor Deals", view: "investor-deals" },
                  { label: "Training",       view: "training"       },
                  { label: "Funding",        view: "funding"        },
                ].map(({ label, view }) => (
                  <Button key={view} variant={currentView === view ? "default" : "ghost"} onClick={() => setCurrentView(view)} className="text-sm">
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Right: Profile pill */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu((p) => !p)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl transition-all"
                style={{ background: "#fff", border: "1.5px solid #f3e8ff", boxShadow: "0 4px 16px rgba(147,51,234,0.07)" }}
              >
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="h-8 w-8 rounded-full object-cover border-2" style={{ borderColor: "#e9d5ff" }} />
                ) : (
                  <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}>
                    {initials || "F"}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-bold leading-tight" style={{ color: "#1e1b4b" }}>{displayName || "Founder"}</p>
                  <p className="text-xs leading-tight" style={{ color: "#a78bfa" }}>{startupName || "Founder"}</p>
                </div>
                <ChevronDown size={14} className={`transition-transform ${showProfileMenu ? "rotate-180" : ""}`} style={{ color: "#a78bfa" }} />
              </button>

              {/* Dropdown */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #f3e8ff",
                    boxShadow: "0 12px 40px rgba(147,51,234,0.18)",
                    animation: "dropIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                >
                  {/* Edit Profile */}
                  <button
                    onClick={() => { setShowProfileMenu(false); setCurrentView("profile"); }}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-medium transition-colors"
                    style={{ color: "#4c1d95" }}
                  >
                    ✏️ Edit Profile
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => openModal("settings")}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-medium border-t transition-colors"
                    style={{ color: "#4c1d95", borderColor: "#f3e8ff" }}
                  >
                    ⚙️ Settings
                  </button>

                  {/* Contact Support */}
                  <button
                    onClick={() => openModal("contact")}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-medium border-t transition-colors"
                    style={{ color: "#4c1d95", borderColor: "#f3e8ff" }}
                  >
                    🎧 Contact Support
                  </button>

                  {/* Report Issue */}
                  <button
                    onClick={() => openModal("report")}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-medium border-t transition-colors"
                    style={{ color: "#4c1d95", borderColor: "#f3e8ff" }}
                  >
                    🐛 Report Issue
                  </button>

                  {/* About Us */}
                  {/* <button
                    onClick={() => { setShowProfileMenu(false); setCurrentView("about"); }}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-medium border-t transition-colors"
                    style={{ color: "#4c1d95", borderColor: "#f3e8ff" }}
                  >
                    ℹ️ About Us
                  </button> */}

                  {/* Logout */}
                  <button
                    onClick={() => openModal("logout")}
                    className="w-full flex items-center gap-2 text-left px-4 py-3 hover:bg-red-50 text-sm font-medium border-t rounded-b-2xl transition-colors"
                    style={{ color: "#dc2626", borderColor: "#f3e8ff" }}
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {renderCurrentView()}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: scale(0.9) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}