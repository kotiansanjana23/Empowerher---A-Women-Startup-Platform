import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../../../../firebase";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";

import {
  User,
  Building2,
  Target,
  Sparkles,
  Save,
  Loader2,
  Camera,
  Globe,
  Link,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  BarChart2,
  Star,
  Zap,
  Briefcase,
  Heart,
  Award,
  Instagram,
  Twitter,
  Youtube,
  FileText,
  ChevronRight,
  Plus,
  X,
  Rocket,
  Eye,
  PieChart,
  Layers,
} from "lucide-react";

// ── constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Technology","E-commerce","Fintech","Healthcare","Education",
  "AI","SaaS","Fashion","Food","Agriculture",
];

const STAGES = [
  "Idea Stage","MVP","Early Revenue","Growth Stage","Scaling",
];

const GOALS = [
  "Fundraising","Product Development","Marketing","Hiring",
  "Branding","Legal","Scaling","Networking","Pitching",
];

// ── helpers ──────────────────────────────────────────────────────────────────

const computeCompletion = (fields: (string | string[])[]) => {
  const filled = fields.filter((f) =>
    Array.isArray(f) ? f.length > 0 : f.trim() !== ""
  ).length;
  return Math.round((filled / fields.length) * 100);
};

// ── sub-components ───────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
      >
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function GlassInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 z-10"
          />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-10 rounded-xl border border-purple-100 bg-white/80 backdrop-blur-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition ${
            Icon ? "pl-9 pr-3" : "px-3"
          }`}
          style={{ boxShadow: "0 1px 4px rgba(147,51,234,0.07)" }}
        />
      </div>
    </div>
  );
}

function GlassTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-purple-100 bg-white/80 backdrop-blur-sm text-sm text-gray-800 placeholder-gray-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition resize-none"
        style={{ boxShadow: "0 1px 4px rgba(147,51,234,0.07)" }}
      />
    </div>
  );
}

function GlassSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl border border-purple-100 bg-white/80 backdrop-blur-sm text-sm text-gray-800 px-3 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
        style={{ boxShadow: "0 1px 4px rgba(147,51,234,0.07)" }}
      >
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 bg-white/70 backdrop-blur-sm border border-purple-100 flex items-center gap-3 group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "0 2px 8px rgba(147,51,234,0.08)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color }}
      >
        <Icon size={17} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="font-bold text-gray-900 text-sm truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function FounderProfile() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  const uid = auth.currentUser?.uid;

  // personal
  const [photoURL, setPhotoURL] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");

  // startup core
  const [startupName, setStartupName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");
  const [investmentRequired, setInvestmentRequired] = useState("");

  // metrics
  const [teamSize, setTeamSize] = useState("");
  const [fundingRaised, setFundingRaised] = useState("");
  const [revenueStage, setRevenueStage] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [growthRate, setGrowthRate] = useState("");
  const [activeUsers, setActiveUsers] = useState("");
  const [customerCount, setCustomerCount] = useState("");
  const [valuation, setValuation] = useState("");

  // social
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  // goals / skills / arrays
  const [goals, setGoals] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [challengeInput, setChallengeInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [teamMemberInput, setTeamMemberInput] = useState("");

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "founders", uid));
        if (snap.exists()) {
          const d = snap.data();
          setPhotoURL(d.photoURL || "");
          setFullName(d.fullName || "");
          setEmail(d.email || auth.currentUser?.email || "");
          setPhone(d.phone || "");
          setLocation(d.location || "");
          setRole(d.role || "");
          setBio(d.bio || "");

          setStartupName(d.startupName || "");
          setIndustry(d.industry || "");
          setStage(d.stage || "");
          setWebsite(d.website || "");
          setLinkedin(d.linkedin || "");
          setDescription(d.description || "");
          setProblem(d.problem || "");
          setVision(d.vision || "");
          setMission(d.mission || "");
          setBusinessModel(d.businessModel || "");
          setPitchDeckUrl(d.pitchDeckUrl || "");
          setInvestmentRequired(d.investmentRequired || "");

          setTeamSize(d.teamSize || "");
          setFundingRaised(d.fundingRaised || "");
          setRevenueStage(d.revenueStage || "");
          setTargetMarket(d.targetMarket || "");
          setMonthlyRevenue(d.monthlyRevenue || "");
          setGrowthRate(d.growthRate || "");
          setActiveUsers(d.activeUsers || "");
          setCustomerCount(d.customerCount || "");
          setValuation(d.valuation || "");

          setInstagram(d.instagram || "");
          setTwitter(d.twitter || "");
          setYoutube(d.youtube || "");

          setGoals(d.goals || []);
          setSkills(d.skills || []);
          setAchievements(d.achievements || []);
          setChallenges(d.challenges || []);
          setTeamMembers(d.teamMembers || []);
        } else {
          setEmail(auth.currentUser?.email || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [uid]);

  // ── completion ────────────────────────────────────────────────────────────
  const completion = computeCompletion([
    fullName, email, phone, location, role, bio,
    startupName, industry, stage, description, problem,
    vision, mission, businessModel,
    teamSize, fundingRaised, monthlyRevenue, growthRate,
    activeUsers, valuation,
    goals, skills,
  ]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const toggleGoal = (goal: string) =>
    setGoals((p) => p.includes(goal) ? p.filter((g) => g !== goal) : [...p, goal]);

  const addItem = (
    input: string,
    list: string[],
    setter: (v: string[]) => void,
    clearInput: () => void
  ) => {
    const v = input.trim();
    if (!v || list.includes(v)) return;
    setter([...list, v]);
    clearInput();
  };

  const removeItem = (item: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.filter((x) => x !== item));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setPhotoURL(base64);
        await setDoc(doc(db, "founders", uid), { photoURL: base64 }, { merge: true });
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "founders", uid),
        {
          uid, photoURL, fullName, email, phone, location, role, bio,
          startupName, industry, stage, website, linkedin, description,
          problem, vision, mission, businessModel, pitchDeckUrl, investmentRequired,
          teamSize, fundingRaised, revenueStage, targetMarket,
          monthlyRevenue, growthRate, activeUsers, customerCount, valuation,
          instagram, twitter, youtube,
          goals, skills, achievements, challenges, teamMembers,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSavedMsg("Profile saved successfully!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#faf5ff 0%,#fdf2f8 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}>
            <Loader2 className="animate-spin text-white" size={22} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading your profile…</p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#faf5ff 0%,#fdf2f8 50%,#fff 100%)" }}>
      {/* ── top nav bar ── */}
      <div className="sticky top-0 z-40 border-b border-purple-100 backdrop-blur-md"
        style={{ background: "rgba(255,255,255,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl border border-purple-100 flex items-center justify-center hover:bg-purple-50 transition text-gray-500"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-none">Founder Profile</h1>
              <p className="text-xs text-gray-500">EmpowerHer Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {savedMsg && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-pulse">
                ✓ {savedMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#9333ea,#db2777)", boxShadow: "0 4px 14px rgba(147,51,234,0.35)" }}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">

          {/* ── LEFT: identity card ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* identity hero card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 8px 32px rgba(147,51,234,0.15)" }}
            >
              {/* gradient banner */}
              <div className="h-24 relative" style={{ background: "linear-gradient(135deg,#9333ea 0%,#db2777 100%)" }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
              </div>

              <div className="bg-white px-5 pb-6">
                {/* avatar */}
                <div className="flex justify-between items-end -mt-12 mb-4">
                  <div className="relative">
                    <img
                      src={photoURL || `https://ui-avatars.com/api/?background=9333ea&color=fff&name=${encodeURIComponent(fullName || "Founder")}&size=96`}
                      alt="Founder"
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white"
                      style={{ boxShadow: "0 4px 16px rgba(147,51,234,0.25)" }}
                    />
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}>
                      {photoUploading ? <Loader2 size={12} className="animate-spin text-white" /> : <Camera size={12} className="text-white" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    {industry && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: "linear-gradient(135deg,#f3e8ff,#fce7f3)", color: "#9333ea" }}>
                        {industry}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900">{fullName || "Founder Name"}</h2>
                <p className="text-sm font-medium mt-0.5" style={{ color: "#9333ea" }}>
                  {role || "Founder"}{startupName ? ` @ ${startupName}` : ""}
                </p>

                {bio && (
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-3">{bio}</p>
                )}

                {/* quick contact */}
                <div className="mt-4 space-y-2">
                  {email && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail size={12} className="text-purple-400 flex-shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone size={12} className="text-purple-400 flex-shrink-0" />
                      <span>{phone}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin size={12} className="text-purple-400 flex-shrink-0" />
                      <span>{location}</span>
                    </div>
                  )}
                  {stage && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Rocket size={12} className="text-pink-400 flex-shrink-0" />
                      <span>{stage}</span>
                    </div>
                  )}
                </div>

                {/* social links */}
                {(website || linkedin || instagram || twitter) && (
                  <div className="flex gap-2 mt-4">
                    {website && (
                      <a href={website} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 hover:bg-purple-100 transition"
                        title="Website">
                        <Globe size={14} style={{ color: "#9333ea" }} />
                      </a>
                    )}
                    {linkedin && (
                      <a href={linkedin} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 hover:bg-purple-100 transition"
                        title="LinkedIn">
                        <Link size={14} style={{ color: "#9333ea" }} />
                      </a>
                    )}
                    {instagram && (
                      <a href={instagram} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-50 hover:bg-pink-100 transition"
                        title="Instagram">
                        <Instagram size={14} style={{ color: "#db2777" }} />
                      </a>
                    )}
                    {twitter && (
                      <a href={twitter} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 hover:bg-purple-100 transition"
                        title="Twitter">
                        <Twitter size={14} style={{ color: "#9333ea" }} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* profile completion */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-purple-100 p-4"
              style={{ boxShadow: "0 2px 12px rgba(147,51,234,0.08)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Profile Completion</span>
                <span className="text-xs font-bold" style={{ color: "#9333ea" }}>{completion}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-purple-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completion}%`, background: "linear-gradient(90deg,#9333ea,#db2777)" }}
                />
              </div>
              {completion < 100 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {100 - completion}% left — complete your profile to attract investors.
                </p>
              )}
            </div>

            {/* achievement stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={DollarSign} label="Funding Raised" value={fundingRaised}
                color="linear-gradient(135deg,#9333ea,#7c3aed)" />
              <StatCard icon={Users} label="Active Users" value={activeUsers}
                color="linear-gradient(135deg,#db2777,#be185d)" />
              <StatCard icon={TrendingUp} label="Growth Rate" value={growthRate}
                color="linear-gradient(135deg,#7c3aed,#9333ea)" />
              <StatCard icon={BarChart2} label="Valuation" value={valuation}
                color="linear-gradient(135deg,#be185d,#db2777)" />
            </div>

            {/* goals quick view */}
            {goals.length > 0 && (
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-purple-100 p-4"
                style={{ boxShadow: "0 2px 12px rgba(147,51,234,0.08)" }}>
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Target size={12} style={{ color: "#9333ea" }} /> Mentorship Goals
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {goals.map((g) => (
                    <span key={g} className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{ background: "linear-gradient(135deg,#f3e8ff,#fce7f3)", color: "#9333ea" }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: tabbed form ──────────────────────────────────────────── */}
          <div>
            <Tabs defaultValue="profile" className="w-full">

              {/* tab bar */}
              <TabsList className="flex gap-1 h-auto p-1.5 rounded-2xl bg-white/80 shadow-sm border border-purple-100 mb-6 overflow-x-auto"
                style={{ boxShadow: "0 2px 12px rgba(147,51,234,0.08)" }}>
                {[
                  { value: "profile", icon: User, label: "Identity" },
                  { value: "startup", icon: Building2, label: "Startup" },
                  { value: "metrics", icon: BarChart2, label: "Metrics" },
                  { value: "goals", icon: Target, label: "Goals" },
                  { value: "skills", icon: Sparkles, label: "Skills" },
                  { value: "team", icon: Users, label: "Team" },
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger key={value} value={value}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 transition-all duration-200 whitespace-nowrap data-[state=active]:text-white data-[state=active]:shadow-md"
                    style={{ "--tw-gradient": "linear-gradient(135deg,#9333ea,#db2777)" } as React.CSSProperties}
                    data-active-bg="linear-gradient(135deg,#9333ea,#db2777)"
                  >
                    <Icon size={14} />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── TAB: Identity ─────────────────────────────────────────── */}
              <TabsContent value="profile">
                <div className="space-y-5">
                  <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                    style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                    <SectionHeading icon={User} title="Personal Information" subtitle="Your founder identity and contact details" />
                    <div className="grid md:grid-cols-2 gap-5">
                      <GlassInput label="Full Name" value={fullName} onChange={setFullName} placeholder="Jane Doe" icon={User} />
                      <GlassInput label="Founder Role" value={role} onChange={setRole} placeholder="CEO / Founder / Co-Founder" icon={Award} />
                      <GlassInput label="Email" value={email} onChange={setEmail} placeholder="jane@startup.com" icon={Mail} />
                      <GlassInput label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" icon={Phone} />
                      <div className="md:col-span-2">
                        <GlassInput label="Location" value={location} onChange={setLocation} placeholder="Mumbai, India" icon={MapPin} />
                      </div>
                      <div className="md:col-span-2">
                        <GlassTextarea label="Founder Bio" value={bio} onChange={setBio}
                          placeholder="Tell your story — your background, what drives you, and why you started this journey…" rows={4} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                    style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                    <SectionHeading icon={Globe} title="Social & Online Presence" subtitle="Where people can find and follow you" />
                    <div className="grid md:grid-cols-2 gap-5">
                      <GlassInput label="LinkedIn Profile" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/…" icon={Link} />
                      <GlassInput label="Website" value={website} onChange={setWebsite} placeholder="https://yourstartup.com" icon={Globe} />
                      <GlassInput label="Instagram" value={instagram} onChange={setInstagram} placeholder="@yourusername" icon={Instagram} />
                      <GlassInput label="Twitter / X" value={twitter} onChange={setTwitter} placeholder="@yourusername" icon={Twitter} />
                      <GlassInput label="YouTube" value={youtube} onChange={setYoutube} placeholder="YouTube channel URL" icon={Youtube} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: Startup ──────────────────────────────────────────── */}
              <TabsContent value="startup">
                <div className="space-y-5">
                  <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                    style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                    <SectionHeading icon={Rocket} title="Startup Overview" subtitle="Core details about your venture" />
                    <div className="grid md:grid-cols-2 gap-5">
                      <GlassInput label="Startup Name" value={startupName} onChange={setStartupName} placeholder="EmpowerHer Inc." icon={Building2} />
                      <GlassSelect label="Industry" value={industry} onChange={setIndustry} options={INDUSTRIES} />
                      <GlassSelect label="Startup Stage" value={stage} onChange={setStage} options={STAGES} />
                      <GlassInput label="Target Market" value={targetMarket} onChange={setTargetMarket} placeholder="Women entrepreneurs 25-45" icon={Target} />
                      <div className="md:col-span-2">
                        <GlassTextarea label="Startup Description" value={description} onChange={setDescription}
                          placeholder="Describe your startup — what you build, who it's for, and how it works…" rows={4} />
                      </div>
                      <div className="md:col-span-2">
                        <GlassTextarea label="Problem You're Solving" value={problem} onChange={setProblem}
                          placeholder="What urgent problem does your startup solve, and for whom?" rows={3} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                    style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                    <SectionHeading icon={Eye} title="Vision & Mission" subtitle="The 'why' behind your startup" />
                    <div className="grid gap-5">
                      <GlassTextarea label="Vision" value={vision} onChange={setVision}
                        placeholder="The future you're building toward…" rows={3} />
                      <GlassTextarea label="Mission" value={mission} onChange={setMission}
                        placeholder="How you'll get there — your daily purpose…" rows={3} />
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                    style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                    <SectionHeading icon={PieChart} title="Business Model & Investment" subtitle="How you make money and what you need" />
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <GlassTextarea label="Business Model" value={businessModel} onChange={setBusinessModel}
                          placeholder="SaaS subscription, marketplace commission, direct sales…" rows={3} />
                      </div>
                      <GlassInput label="Investment Required" value={investmentRequired} onChange={setInvestmentRequired}
                        placeholder="$500,000 Seed Round" icon={DollarSign} />
                      <GlassInput label="Pitch Deck URL" value={pitchDeckUrl} onChange={setPitchDeckUrl}
                        placeholder="https://docsend.com/…" icon={FileText} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: Metrics ──────────────────────────────────────────── */}
              <TabsContent value="metrics">
                <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                  style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                  <SectionHeading icon={BarChart2} title="Traction & Metrics" subtitle="Your key performance indicators" />

                  {/* highlight stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {[
                      { icon: DollarSign, label: "Funding", value: fundingRaised, grad: "linear-gradient(135deg,#9333ea,#7c3aed)" },
                      { icon: TrendingUp, label: "Growth", value: growthRate, grad: "linear-gradient(135deg,#db2777,#be185d)" },
                      { icon: Users, label: "Users", value: activeUsers, grad: "linear-gradient(135deg,#7c3aed,#9333ea)" },
                      { icon: BarChart2, label: "Valuation", value: valuation, grad: "linear-gradient(135deg,#be185d,#db2777)" },
                    ].map(({ icon: Icon, label, value, grad }) => (
                      <div key={label} className="rounded-2xl p-4 text-white text-center" style={{ background: grad, boxShadow: "0 4px 14px rgba(147,51,234,0.2)" }}>
                        <Icon size={20} className="mx-auto mb-1 opacity-90" />
                        <p className="text-lg font-bold">{value || "—"}</p>
                        <p className="text-xs opacity-80 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <GlassInput label="Team Size" value={teamSize} onChange={setTeamSize} placeholder="5 members" icon={Users} />
                    <GlassInput label="Funding Raised" value={fundingRaised} onChange={setFundingRaised} placeholder="$25,000" icon={DollarSign} />
                    <GlassInput label="Revenue Stage" value={revenueStage} onChange={setRevenueStage} placeholder="Pre-revenue / Revenue generating" icon={Layers} />
                    <GlassInput label="Monthly Revenue" value={monthlyRevenue} onChange={setMonthlyRevenue} placeholder="$12,000" icon={TrendingUp} />
                    <GlassInput label="Growth Rate (%)" value={growthRate} onChange={setGrowthRate} placeholder="25%" icon={TrendingUp} />
                    <GlassInput label="Active Users" value={activeUsers} onChange={setActiveUsers} placeholder="1,500" icon={Users} />
                    <GlassInput label="Customer Count" value={customerCount} onChange={setCustomerCount} placeholder="320" icon={Briefcase} />
                    <GlassInput label="Startup Valuation" value={valuation} onChange={setValuation} placeholder="$500,000" icon={BarChart2} />
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: Goals ────────────────────────────────────────────── */}
              <TabsContent value="goals">
                <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                  style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                  <SectionHeading icon={Target} title="Mentorship Goals" subtitle="What do you need the most help with right now?" />
                  <div className="flex flex-wrap gap-3 mb-8">
                    {GOALS.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className="px-5 py-2.5 rounded-2xl border text-sm font-semibold transition-all duration-200 hover:scale-105"
                        style={
                          goals.includes(goal)
                            ? { background: "linear-gradient(135deg,#9333ea,#db2777)", color: "white", border: "none", boxShadow: "0 4px 12px rgba(147,51,234,0.3)" }
                            : { background: "white", color: "#6b7280", borderColor: "#e9d5ff" }
                        }
                      >
                        {goal}
                      </button>
                    ))}
                  </div>

                  <SectionHeading icon={Zap} title="Current Challenges" subtitle="Share what obstacles you're facing" />
                  <div className="flex gap-2 mb-4">
                    <input
                      value={challengeInput}
                      onChange={(e) => setChallengeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(challengeInput, challenges, setChallenges, () => setChallengeInput("")); } }}
                      placeholder="e.g. Finding product-market fit…"
                      className="flex-1 h-10 rounded-xl border border-purple-100 bg-white/80 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <button
                      onClick={() => addItem(challengeInput, challenges, setChallenges, () => setChallengeInput(""))}
                      className="px-4 h-10 rounded-xl text-white text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {challenges.map((c) => (
                      <div key={c} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-pink-50 border border-pink-100">
                        <span className="text-sm text-gray-700">{c}</span>
                        <button onClick={() => removeItem(c, challenges, setChallenges)} className="text-pink-400 hover:text-pink-600 transition">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: Skills ───────────────────────────────────────────── */}
              <TabsContent value="skills">
                <div className="space-y-5">
                  <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                    style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                    <SectionHeading icon={Sparkles} title="Skills & Expertise" subtitle="Technologies, domains, and strengths you bring" />
                    <div className="flex gap-2 mb-5">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(skillInput, skills, setSkills, () => setSkillInput("")); } }}
                        placeholder="e.g. React, Growth Marketing, Fundraising…"
                        className="flex-1 h-10 rounded-xl border border-purple-100 bg-white/80 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <button
                        onClick={() => addItem(skillInput, skills, setSkills, () => setSkillInput(""))}
                        className="px-4 h-10 rounded-xl text-white text-sm font-semibold flex items-center gap-1"
                        style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                      >
                        <Plus size={15} /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span key={skill}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold"
                          style={{ background: "linear-gradient(135deg,#f3e8ff,#fce7f3)", color: "#9333ea" }}>
                          {skill}
                          <button onClick={() => removeItem(skill, skills, setSkills)} className="hover:text-pink-600 transition">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                    style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                    <SectionHeading icon={Award} title="Achievements & Milestones" subtitle="Awards, press, and proud moments" />
                    <div className="flex gap-2 mb-4">
                      <input
                        value={achievementInput}
                        onChange={(e) => setAchievementInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(achievementInput, achievements, setAchievements, () => setAchievementInput("")); } }}
                        placeholder="e.g. Featured in Forbes 30 Under 30…"
                        className="flex-1 h-10 rounded-xl border border-purple-100 bg-white/80 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <button
                        onClick={() => addItem(achievementInput, achievements, setAchievements, () => setAchievementInput(""))}
                        className="px-4 h-10 rounded-xl text-white text-sm font-semibold"
                        style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {achievements.map((a) => (
                        <div key={a} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-100">
                          <div className="flex items-center gap-2">
                            <Star size={13} style={{ color: "#9333ea" }} />
                            <span className="text-sm text-gray-700">{a}</span>
                          </div>
                          <button onClick={() => removeItem(a, achievements, setAchievements)} className="text-gray-400 hover:text-red-400 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: Team ─────────────────────────────────────────────── */}
              <TabsContent value="team">
                <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-100 p-7"
                  style={{ boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
                  <SectionHeading icon={Users} title="Team Members" subtitle="Who's building this with you?" />
                  <div className="flex gap-2 mb-5">
                    <input
                      value={teamMemberInput}
                      onChange={(e) => setTeamMemberInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(teamMemberInput, teamMembers, setTeamMembers, () => setTeamMemberInput("")); } }}
                      placeholder="e.g. Priya Sharma — CTO"
                      className="flex-1 h-10 rounded-xl border border-purple-100 bg-white/80 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <button
                      onClick={() => addItem(teamMemberInput, teamMembers, setTeamMembers, () => setTeamMemberInput(""))}
                      className="px-4 h-10 rounded-xl text-white text-sm font-semibold flex items-center gap-1"
                      style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {teamMembers.map((member) => (
                      <div key={member}
                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}>
                            {member.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{member}</span>
                        </div>
                        <button onClick={() => removeItem(member, teamMembers, setTeamMembers)}
                          className="text-gray-400 hover:text-red-400 transition">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {teamMembers.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Add your co-founders and team members above.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>

      {/* ── floating save button (mobile) ── */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold shadow-2xl transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#9333ea,#db2777)", boxShadow: "0 8px 24px rgba(147,51,234,0.4)" }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* gradient active tab via global style override */}
      <style>{`
        [data-state="active"][data-radix-collection-item] {
          background: linear-gradient(135deg,#9333ea,#db2777) !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}