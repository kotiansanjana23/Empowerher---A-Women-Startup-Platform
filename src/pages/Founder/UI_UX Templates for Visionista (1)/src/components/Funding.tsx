

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  DollarSign, Building2, Users, MapPin, Search,
  Filter, TrendingUp, Award, Clock, CheckCircle, ArrowRight,
  X, FileText, Video, BarChart3, Loader2, Upload, Link2,
  Sparkles, Zap, Star, Phone, Mail, Linkedin, Globe,
} from "lucide-react";
import { db, auth } from "../../../../../firebase";
import {
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";

/* ─── Cloudinary upload ─── */
const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "empowerher");
  const res = await fetch("https://api.cloudinary.com/v1_1/dcgm3doyn/auto/upload", { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
};

/* ─── Upload pill ─── */
function UploadPill({ pct, file }: { pct: number; file: File | null }) {
  if (!file) return null;
  if (pct === -1) return <p className="text-xs text-purple-500 mt-1 truncate">{file.name}</p>;
  if (pct === 100) return <p className="text-xs text-emerald-500 mt-1">✓ Uploaded</p>;
  return (
    <div className="mt-1">
      <p className="text-xs text-purple-500 truncate">{file.name}</p>
      <div className="w-full bg-purple-100 rounded-full h-1 mt-0.5">
        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7c3aed,#db2777)" }} />
      </div>
    </div>
  );
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; dot: string }> = {
    "Pending":      { bg: "rgba(124,58,237,0.08)",  text: "#7c3aed", dot: "#7c3aed" },
    "Under Review": { bg: "rgba(219,39,119,0.08)",  text: "#db2777", dot: "#db2777" },
    "In Progress":  { bg: "rgba(147,51,234,0.08)",  text: "#9333ea", dot: "#9333ea" },
    "Interested":   { bg: "rgba(192,38,211,0.08)",  text: "#c026d3", dot: "#c026d3" },
    "Connected":    { bg: "rgba(124,58,237,0.12)",  text: "#7c3aed", dot: "#7c3aed" },
    "Rejected":     { bg: "rgba(239,68,68,0.08)",   text: "#ef4444", dot: "#ef4444" },
  };
  const c = configs[status] || { bg: "rgba(107,114,128,0.08)", text: "#6b7280", dot: "#6b7280" };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black" style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {status}
    </span>
  );
}

/* ─── Progress per status ─── */
function statusProgress(status: string) {
  return ({ "Pending": 10, "Under Review": 35, "In Progress": 60, "Interested": 75, "Connected": 100, "Rejected": 100 }[status] ?? 20);
}

/* ─── Tab config ─── */
const TABS = [
  { id: "opportunities", label: "Opportunities", icon: Zap },
  { id: "applications",  label: "Applications",  icon: FileText },
  { id: "tips",          label: "Tips",           icon: TrendingUp },
  { id: "success",       label: "Success Stories", icon: Award },
];

/* ─── Accent palette ─── */
const ACCENTS = [
  { from: "#7c3aed", to: "#a855f7", light: "rgba(124,58,237,0.08)" },
  { from: "#db2777", to: "#f472b6", light: "rgba(219,39,119,0.08)" },
  { from: "#9333ea", to: "#c084fc", light: "rgba(147,51,234,0.08)" },
  { from: "#be185d", to: "#ec4899", light: "rgba(190,24,93,0.08)" },
];

/* ─── Input class ─── */
const mInput = "w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all";

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export function Funding() {
  const [searchTerm, setSearchTerm]   = useState("");
  const [activeTab, setActiveTab]     = useState("opportunities");
  const [submitting, setSubmitting]   = useState(false);

  const [fundingOpportunities, setFundingOpportunities] = useState<any[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [myRequests, setMyRequests]   = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [appliedIds, setAppliedIds]   = useState<string[]>([]);

  const [successStoryModal, setSuccessStoryModal] = useState<{ open: boolean; story: any }>({ open: false, story: null });
  const [tipModal, setTipModal]                   = useState<{ open: boolean; tip: any }>({ open: false, tip: null });
  const [viewDetailsModal, setViewDetailsModal]   = useState<{ open: boolean; opportunity: any }>({ open: false, opportunity: null });
  const [applicationFormModal, setApplicationFormModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity]   = useState<any>(null);

  const [form, setForm] = useState({
    fullName: "", email: "", startupName: "", startupStage: "",
    fundingAmountRequested: "", problemStatement: "", solution: "", whyYouQualify: "",
  });
  const [pitchDeck,      setPitchDeck]      = useState<File | null>(null);
  const [financialModel, setFinancialModel] = useState<File | null>(null);
  const [videoPitch,     setVideoPitch]     = useState<File | null>(null);
  const [uploadPct, setUploadPct]           = useState({ deck: -1, financial: -1, video: -1 });

  /* ── Firebase listeners ── */
  useEffect(() => {
    const q = query(collection(db, "investors"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setFundingOpportunities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingOpportunities(false);
    }, err => { console.error(err); setLoadingOpportunities(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoadingReqs(false); return; }
    const q = query(collection(db, "fundingRequests"), where("founderId", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyRequests(reqs);
      setAppliedIds(reqs.map((r: any) => r.opportunityId).filter(Boolean));
      setLoadingReqs(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "connections"), where("founderId", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { alert("Please sign in first."); return; }
    if (!selectedOpportunity) return;
    setSubmitting(true);
    try {
      let deckURL = "", financialURL = "", videoURL = "";
      if (pitchDeck)      deckURL      = await uploadToCloudinary(pitchDeck);
      if (financialModel) financialURL = await uploadToCloudinary(financialModel);
      if (videoPitch)     videoURL     = await uploadToCloudinary(videoPitch);

      await addDoc(collection(db, "fundingRequests"), {
        founderId: user.uid, founderName: form.fullName,
        founderEmail: form.email || user.email, founderPhoto: user.photoURL || "",
        startupName: form.startupName, startupStage: form.startupStage,
        fundingAmountRequested: form.fundingAmountRequested,
        problemStatement: form.problemStatement, solution: form.solution,
        whyYouQualify: form.whyYouQualify,
        opportunityId: selectedOpportunity.id,
        opportunityTitle: selectedOpportunity.company || selectedOpportunity.fullName,
        organization: selectedOpportunity.company, amount: selectedOpportunity.funding,
        investorId: selectedOpportunity.id, investorName: selectedOpportunity.fullName,
        investorEmail: selectedOpportunity.email, investorPhoto: selectedOpportunity.photoURL || "",
        deckURL, financialURL, videoURL,
        submittedDate: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(), status: "Pending",
      });

      setForm({ fullName: "", email: "", startupName: "", startupStage: "", fundingAmountRequested: "", problemStatement: "", solution: "", whyYouQualify: "" });
      setPitchDeck(null); setFinancialModel(null); setVideoPitch(null);
      setUploadPct({ deck: -1, financial: -1, video: -1 });
      setApplicationFormModal(false);
      setActiveTab("applications");
    } catch (err: any) {
      alert("Failed to submit: " + (err?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOpportunities = fundingOpportunities.filter(op =>
    [op.fullName, op.company, op.location, op.bio, op.investmentInterests, op.availabilityStatus]
      .some(f => (f || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openApply = (opp: any) => { setSelectedOpportunity(opp); setApplicationFormModal(true); };

  /* ─── Static data ─── */
  const fundingTips = [
    { title: "Perfect Your Pitch Deck", description: "Craft a story that makes investors lean forward in their seats.", icon: TrendingUp, bg: "from-violet-600 to-purple-700", detailedAdvice: "A great pitch deck tells a compelling story in 10-15 slides. Start with the problem, present your unique solution, show market opportunity.", steps: ["Define the problem clearly", "Present your differentiated solution", "Show market size and TAM", "Demonstrate traction with data", "Outline go-to-market strategy", "Show 3-year financial projections"], examples: "Lead with a compelling customer problem, use data to show market opportunity, include a product demo that shows real usage." },
    { title: "Know Your Numbers", description: "Investors expect you to know CAC, LTV, burn rate, and runway cold.", icon: DollarSign, bg: "from-pink-600 to-rose-600", detailedAdvice: "Investors want to see you understand your business fundamentals. Know your CAC, LTV, burn rate, and runway.", steps: ["Build 3-year P&L projections", "Calculate CAC and LTV", "Know your monthly burn rate", "Track MRR/ARR growth", "Have multiple pricing scenarios"], examples: "If CAC is $500 and LTV is $5,000, that's a healthy 10:1 ratio investors love to see." },
    { title: "Build Relationships Early", description: "The best funding conversations start months before you need the money.", icon: Users, bg: "from-fuchsia-600 to-pink-600", detailedAdvice: "Funding is about relationships. Start networking before you need funding.", steps: ["Identify relevant investors in your sector", "Get warm introductions via mutual connections", "Attend startup events and demo days", "Send quarterly investor updates proactively", "Build genuine long-term relationships"], examples: "Send monthly progress updates to 50+ investors showing key metrics and challenges — before you ever ask for money." },
    { title: "Master the Process", description: "Every investor has a different timeline. Know before you pitch.", icon: Clock, bg: "from-purple-600 to-fuchsia-600", detailedAdvice: "Different funding sources have different processes. Understand requirements and timelines for each.", steps: ["Research investor focus areas deeply", "Read their published investment theses", "Follow application requirements exactly", "Know their typical decision timelines", "Prepare due diligence documents in advance"], examples: "Government grants take 3-4 months. VCs move in 2-3 months. Angels can decide in days. Know who you're talking to." },
  ];

  const successStories = [
    {
      founder: "Priya Sharma",
      company: "AgroNova Technologies",
      amount: "₹2.1 Cr",
      description: "Raised Seed funding for AI-powered crop monitoring platform helping 10,000+ farmers",
      fullDescription: "Priya grew up in a farming family in Pune and witnessed firsthand how unpredictable weather and pest attacks destroyed harvests. She left her software job at TCS to build AgroNova — a platform that uses satellite imagery and IoT sensors to give farmers real-time crop health alerts on their feature phones. After piloting with 500 farmers in Maharashtra, she caught the attention of Bharat Founders Fund and raised ₹2.1 Cr in Seed funding. Today AgroNova serves over 10,000 farmers across 6 states.",
      keyMetric: "10,000+ farmers served",
      location: "Pune, Maharashtra",
      timeline: [
        { date: "Mar 2021", event: "Left corporate job, started AgroNova from her father's farm" },
        { date: "Nov 2021", event: "Pilot with 500 farmers in Nashik district — 34% yield improvement" },
        { date: "Apr 2022", event: "Selected for NASSCOM DeepTech Club cohort" },
        { date: "Jan 2023", event: "Raised ₹2.1 Cr Seed from Bharat Founders Fund" },
        { date: "Aug 2023", event: "Expanded to 6 states, onboarded State Bank of India as partner" },
      ]
    },
    {
      founder: "Ananya Krishnan",
      company: "MedSaathi",
      amount: "₹4.5 Cr",
      description: "Secured Pre-Series A for vernacular telehealth platform connecting rural women to doctors",
      fullDescription: "Ananya was a doctor in a government hospital in rural Tamil Nadu when she realised that women in villages would skip follow-up appointments simply because they couldn't afford the bus fare or leave their homes without permission. She built MedSaathi — a WhatsApp-first telehealth platform in 8 Indian languages that lets women consult doctors via voice notes and get prescriptions digitally. After partnering with 3 state governments, she raised ₹4.5 Cr Pre-Series A led by Omidyar Network India. MedSaathi has now served over 1.8 lakh women across Bihar, Tamil Nadu and Rajasthan.",
      keyMetric: "1.8 lakh women consulted",
      location: "Chennai, Tamil Nadu",
      timeline: [
        { date: "Jun 2020", event: "Identified the gap during COVID lockdowns in rural Tamil Nadu" },
        { date: "Feb 2021", event: "Launched WhatsApp-first MVP in Tamil and Hindi" },
        { date: "Sep 2021", event: "Government of Bihar signs MoU for rural women's health program" },
        { date: "Mar 2022", event: "Won Google for Startups Accelerator — Women Founders cohort" },
        { date: "Nov 2022", event: "Raised ₹4.5 Cr Pre-Series A led by Omidyar Network India" },
        { date: "Jun 2023", event: "Crossed 1.8 lakh consultations, expanded to 8 languages" },
      ]
    },
    {
      founder: "Ritika Malhotra",
      company: "SkillSetu",
      amount: "₹7.8 Cr",
      description: "Raised Series A for a vernacular skilling platform placing blue-collar women in digital jobs",
      fullDescription: "Ritika was running an NGO in Delhi when she noticed that thousands of women from low-income backgrounds had smartphones but no pathways to digital employment. She founded SkillSetu to offer 6-week online courses in data entry, customer support and social media management — taught entirely in Hindi, Bhojpuri and Marathi via short videos on YouTube. Her placement rate of 78% within 90 days of course completion convinced Kalaari Capital to lead a ₹7.8 Cr Series A. SkillSetu has now trained over 22,000 women and placed 17,000 in remote jobs with companies like Meesho, Delhivery and Zomato.",
      keyMetric: "17,000 women placed in jobs",
      location: "New Delhi",
      timeline: [
        { date: "Jan 2020", event: "Founded SkillSetu, launched first batch of 40 women in Delhi" },
        { date: "Aug 2020", event: "Shifted fully online during COVID — enrolments 10x in 3 months" },
        { date: "Mar 2021", event: "Partnered with Meesho and Delhivery for guaranteed placements" },
        { date: "Oct 2021", event: "Crossed 5,000 placements; featured in Forbes India 30 Under 30" },
        { date: "Apr 2022", event: "Raised ₹7.8 Cr Series A led by Kalaari Capital" },
        { date: "Dec 2023", event: "17,000 women placed; expanded courses to accounting and coding" },
      ]
    },
    {
      founder: "Deepika Nair",
      company: "WasteWorth",
      amount: "₹3.3 Cr",
      description: "Raised Seed funding for a B2B waste-to-resource marketplace connecting factories to recyclers",
      fullDescription: "Deepika spent 8 years as an environmental engineer before realising that India's industrial waste problem wasn't a technology problem — it was a marketplace problem. Factories had no easy way to sell their waste and recyclers had no reliable supply. She built WasteWorth, a B2B platform where factories list their industrial by-products and verified recyclers bid to buy them. The platform handles logistics, documentation and compliance paperwork automatically. After processing ₹12 Cr worth of waste transactions in the first year, she raised ₹3.3 Cr Seed from Elevation Capital's climate fund. WasteWorth now operates in 9 industrial corridors across Gujarat, Maharashtra and Tamil Nadu.",
      keyMetric: "₹12 Cr waste transactions processed",
      location: "Ahmedabad, Gujarat",
      timeline: [
        { date: "Feb 2021", event: "Quit engineering job, began 6-month research across 80 factories" },
        { date: "Sep 2021", event: "Launched WasteWorth beta with 12 factories in Surat GIDC" },
        { date: "Mar 2022", event: "Processed first ₹1 Cr in waste transactions" },
        { date: "Aug 2022", event: "Won SIDBI Women Entrepreneurship Program grant of ₹25 lakh" },
        { date: "Feb 2023", event: "Raised ₹3.3 Cr Seed from Elevation Capital climate fund" },
        { date: "Oct 2023", event: "Expanded to 9 industrial corridors, 340 factories onboarded" },
      ]
    },
    {
      founder: "Sunita Agarwal",
      company: "SafeStride",
      amount: "₹5.6 Cr",
      description: "Raised Pre-Series A for an AI safety platform for women using crowdsourced street data",
      fullDescription: "Sunita was a product manager at a Bangalore startup when she was followed home one night and realised that no app truly understood the nuance of street safety for women in Indian cities. She built SafeStride — an app where women rate streets, report incidents and get AI-powered safe route suggestions based on time of day, lighting and crowdsourced safety scores. Over 3 lakh women in 14 cities now use SafeStride daily. Municipal corporations in Bengaluru and Hyderabad use her anonymised data to plan street lighting and CCTV installation. She raised ₹5.6 Cr Pre-Series A from Accel India and the UN Women Innovation Fund.",
      keyMetric: "3 lakh daily active users",
      location: "Bengaluru, Karnataka",
      timeline: [
        { date: "Nov 2020", event: "Personal safety incident sparks idea; begins user research with 200 women" },
        { date: "May 2021", event: "Launches SafeStride in Bengaluru with 500 beta users" },
        { date: "Jan 2022", event: "BBMP (Bruhat Bengaluru) partners to use safety data for city planning" },
        { date: "Jun 2022", event: "Crosses 1 lakh users; expands to Mumbai, Hyderabad, Delhi" },
        { date: "Dec 2022", event: "Raises ₹5.6 Cr Pre-Series A from Accel India and UN Women Innovation Fund" },
        { date: "Sep 2023", event: "3 lakh daily users across 14 cities; Hyderabad GHMC signs MoU" },
      ]
    },
    {
      founder: "Kavya Reddy",
      company: "MilkBasket Organics",
      amount: "₹9.2 Cr",
      description: "Raised Series A connecting 3,000 organic women farmers directly to urban households",
      fullDescription: "Kavya grew up watching her mother, a small dairy farmer in Telangana, get paid a fraction of what her milk was worth because middlemen took most of the margin. After an MBA from IIM Kozhikode, she returned home to build MilkBasket Organics — a direct-to-consumer platform that sources organic dairy and produce exclusively from women-led farming collectives and delivers to urban households in Hyderabad and Pune within 12 hours of harvest. Farmers on her platform earn 2.4x the market rate. After crossing ₹2 Cr monthly GMV she raised ₹9.2 Cr Series A from WaterBridge Ventures and Nandan Nilekani's family office. She now works with 3,000 women farmers across 4 states.",
      keyMetric: "2.4x income for 3,000 farmers",
      location: "Hyderabad, Telangana",
      timeline: [
        { date: "Apr 2019", event: "Returns to Telangana after IIM; organises first collective of 40 dairy women" },
        { date: "Jan 2020", event: "Launches MilkBasket Organics app in Hyderabad with 200 subscribers" },
        { date: "Mar 2021", event: "Crosses 5,000 subscribers; expands produce range to 60+ SKUs" },
        { date: "Nov 2021", event: "Featured in Economic Times as one of India's most promising agritech founders" },
        { date: "May 2022", event: "Crosses ₹2 Cr monthly GMV; expands to Pune" },
        { date: "Jan 2023", event: "Raises ₹9.2 Cr Series A from WaterBridge Ventures and Nilekani family office" },
        { date: "Aug 2023", event: "3,000 women farmers onboarded across Telangana, AP, Maharashtra and Karnataka" },
      ]
    },
  ];

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: "#f8f7ff", fontFamily: "'Outfit','DM Sans',sans-serif" }}>

      <div className="max-w-7xl mx-auto px-4 pb-16">

        {/* ══ PAGE HEADING — no box, flush to content ══ */}
        <div className="pt-8 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
<span className="text-white text-xs font-black">₹</span>
              </div>
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: "#7c3aed" }}>Funding Hub</span>
            </div>

            {/* Two-line headline */}
            <h1 className="text-4xl sm:text-5xl font-black leading-none text-gray-900 mb-1">
              Find your
            </h1>
            <h1 className="text-4xl sm:text-5xl font-black leading-none mb-3">
              <span style={{
                background: "linear-gradient(90deg,#7c3aed,#db2777)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                next investor.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-gray-400 text-sm font-medium max-w-sm">
              Apply directly to top investors and turn your startup idea into a funded reality.
            </p>
          </div>

          {/* Stat chips — flush right, no card */}
          <div className="flex items-center gap-2 flex-shrink-0 pb-1">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <span className="text-lg font-black" style={{ color: "#7c3aed" }}>{fundingOpportunities.length}</span>
              <span className="text-xs font-bold text-gray-400">Investors</span>
            </div>
            {myRequests.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(219,39,119,0.07)", border: "1px solid rgba(219,39,119,0.15)" }}>
                <span className="text-lg font-black" style={{ color: "#db2777" }}>{myRequests.length}</span>
                <span className="text-xs font-bold text-gray-400">Applied</span>
              </div>
            )}
            {connections.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(147,51,234,0.07)", border: "1px solid rgba(147,51,234,0.15)" }}>
                <Link2 className="w-3.5 h-3.5" style={{ color: "#9333ea" }} />
                <span className="text-lg font-black" style={{ color: "#9333ea" }}>{connections.length}</span>
                <span className="text-xs font-bold text-gray-400">Connected</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ TAB BAR — stats woven in ══ */}
        <div className="mb-8" style={{ borderBottom: "1px solid rgba(124,58,237,0.08)" }}>
          <div className="flex gap-0">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;

              // Per-tab badge content
              const badge =
                tab.id === "opportunities" && fundingOpportunities.length > 0
                  ? { value: fundingOpportunities.length, label: "open" }
                  : tab.id === "applications" && myRequests.length > 0
                  ? { value: myRequests.length, label: "submitted" }
                  : tab.id === "success"
                  ? { value: connections.length > 0 ? connections.length : null, label: "connected" }
                  : null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-start gap-0.5 px-5 py-4 text-left transition-all duration-200 group"
                  style={{ minWidth: 0 }}
                >
                  {/* Active underline */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <tab.icon
                      className="w-4 h-4 transition-colors"
                      style={{ color: isActive ? "#7c3aed" : "#d1d5db" }}
                    />
                    <span
                      className="text-sm font-black transition-colors hidden sm:inline"
                      style={{ color: isActive ? "#1f2937" : "#9ca3af" }}
                    >
                      {tab.label}
                    </span>

                    {/* Inline count badge */}
                    {badge?.value != null && (
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full transition-all"
                        style={isActive
                          ? { background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff" }
                          : { background: "rgba(124,58,237,0.08)", color: "#7c3aed" }
                        }
                      >
                        {badge.value}
                      </span>
                    )}
                  </div>

                  {/* Sub-label under tab — only on active */}
                  {isActive && badge?.label && (
                    <span className="text-xs pl-6 font-medium" style={{ color: "#db2777" }}>
                      {badge.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════
            TAB: OPPORTUNITIES
        ════════════════════════════════ */}
        {activeTab === "opportunities" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#c4b5fd" }} />
                <input
                  type="text"
                  placeholder="Search investors, companies, locations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-purple-100 rounded-2xl text-gray-700 placeholder-gray-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-5 py-3.5 bg-white border border-purple-100 rounded-2xl text-gray-400 hover:text-purple-600 hover:border-purple-200 shadow-sm transition-all text-sm font-bold">
                <Filter className="h-4 w-4" /><span className="hidden sm:inline">Filter</span>
              </button>
            </div>

            {loadingOpportunities ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
                  <Loader2 className="animate-spin w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-400">Loading opportunities...</p>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="text-center py-32">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(219,39,119,0.1))" }}>
                  <Search className="h-9 w-9" style={{ color: "#c4b5fd" }} />
                </div>
                <p className="font-black text-gray-300 text-xl">{searchTerm ? `No results for "${searchTerm}"` : "No opportunities yet"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredOpportunities.map((op, idx) => {
                  const myReq = myRequests.find(r => r.opportunityId === op.id);
                  const isConnected = myReq?.status === "Connected";
                  const acc = ACCENTS[idx % 4];

                  return (
                    <div
                      key={op.id}
                      className="group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                      style={{ border: "1px solid rgba(124,58,237,0.1)", boxShadow: "0 2px 16px rgba(124,58,237,0.06)" }}
                      onClick={() => setViewDetailsModal({ open: true, opportunity: op })}
                    >
                      {/* Gradient stripe */}
                      <div className="h-1" style={{ background: `linear-gradient(90deg,${acc.from},${acc.to})` }} />

                      <div className="p-5">
                        {/* ─ Header ─ */}
                        <div className="flex items-start gap-4 mb-4">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden" style={{ border: `2px solid ${acc.from}30` }}>
                              {op.photoURL
                                ? <img src={op.photoURL} alt={op.fullName} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-white font-black text-xl" style={{ background: `linear-gradient(135deg,${acc.from},${acc.to})` }}>{op.fullName?.[0] || "I"}</div>
                              }
                            </div>
                            {isConnected && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center" style={{ background: "#7c3aed" }}>
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-gray-900 text-lg leading-tight truncate">{op.fullName}</h3>
                            {op.company && (
                              <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{op.company}</span>
                              </p>
                            )}
                          </div>

                          {op.availabilityStatus && (
                            <span className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full" style={{ background: acc.light, color: acc.from }}>
                              {op.availabilityStatus}
                            </span>
                          )}
                        </div>

                        {/* ─ Bio snippet ─ */}
                        {op.bio && (
                          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{op.bio}</p>
                        )}

                        {/* ─ Tags ─ */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {op.funding && (
                            <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-3 py-1">
  <span className="text-xs font-bold">₹</span>
  {(op.funding || "").replace(/\$/g, "")}
</span>
                          )}
                          {op.location && (
                            <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100 rounded-full px-3 py-1">
                              <MapPin className="w-3 h-3" />{op.location}
                            </span>
                          )}
                          {op.investmentInterests && (
                            <span className="flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 max-w-[180px] truncate" style={{ background: acc.light, color: acc.from, border: `1px solid ${acc.from}20` }}>
                              <Sparkles className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{op.investmentInterests}</span>
                            </span>
                          )}
                        </div>

                        {/* ─ Connected banner ─ */}
                        {isConnected && myReq && (
                          <div className="mb-4 flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)" }}>
                            <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />
                            <div className="min-w-0">
                              <p className="text-xs font-black" style={{ color: "#7c3aed" }}>You're Connected!</p>
                              {myReq.investorEmail && <p className="text-xs truncate" style={{ color: "#9333ea" }}>{myReq.investorEmail}</p>}
                            </div>
                          </div>
                        )}

                        {/* ─ Divider ─ */}
                        <div className="h-px mb-4" style={{ background: "rgba(124,58,237,0.08)" }} />

                        {/* ─ Actions ─ */}
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setViewDetailsModal({ open: true, opportunity: op })}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-purple-50"
                            style={{ border: "1px solid rgba(124,58,237,0.2)", color: "#7c3aed" }}
                          >
                            View Details
                          </button>
                          {appliedIds.includes(op.id) ? (
                            <button disabled className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                              <CheckCircle className="w-4 h-4" />
                              {isConnected ? "Connected ✓" : "Applied"}
                            </button>
                          ) : (
                            <button
                              onClick={() => openApply(op)}
                              className="flex-1 py-2.5 rounded-xl text-white text-sm font-black transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                              style={{ background: `linear-gradient(135deg,${acc.from},${acc.to})`, boxShadow: `0 4px 14px ${acc.from}30` }}
                            >
                              Apply Now <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            TAB: MY APPLICATIONS
        ════════════════════════════════ */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {loadingReqs ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
                  <Loader2 className="animate-spin w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-400">Loading applications...</p>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-32">
                <div className="w-24 h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(219,39,119,0.1))" }}>
                  <FileText className="h-10 w-10" style={{ color: "#c4b5fd" }} />
                </div>
                <p className="text-2xl font-black text-gray-300 mb-2">No applications yet</p>
                <p className="text-sm text-gray-300 mb-7">Apply to funding opportunities to track them here</p>
                <button
                  onClick={() => setActiveTab("opportunities")}
                  className="px-8 py-3.5 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 8px 24px rgba(124,58,237,0.25)" }}
                >
                  Browse Opportunities
                </button>
              </div>
            ) : (
              myRequests.map((req: any, idx: number) => {
                const prog = statusProgress(req.status);
                const acc = ACCENTS[idx % 4];
                return (
                  <div key={req.id} className="bg-white rounded-3xl overflow-hidden transition-all hover:shadow-md" style={{ border: "1px solid rgba(124,58,237,0.1)", boxShadow: "0 2px 12px rgba(124,58,237,0.05)" }}>
                    <div className="h-1" style={{ background: `linear-gradient(90deg,${acc.from},${acc.to})` }} />
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-5 gap-3">
                        <div>
                          <h3 className="font-black text-xl text-gray-900">{req.opportunityTitle}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {req.organization}{req.submittedDate && ` · ${req.submittedDate}`}{req.amount && ` · ${req.amount}`}
                          </p>
                        </div>
                        <StatusBadge status={req.status || "Pending"} />
                      </div>

                      {/* Connected card */}
                      {req.status === "Connected" && (
                        <div className="mb-5 flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
                          {req.investorPhoto
                            ? <img src={req.investorPhoto} alt={req.investorName} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" style={{ border: "2px solid rgba(124,58,237,0.2)" }} />
                            : <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>{req.investorName?.[0] || "I"}</div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black flex items-center gap-1.5" style={{ color: "#7c3aed" }}>
                              <Link2 className="w-3.5 h-3.5" />Connected with Investor
                            </p>
                            <p className="text-sm font-bold text-gray-700">{req.investorName}</p>
                            {req.investorEmail && (
                              <a href={`mailto:${req.investorEmail}`} className="text-xs hover:underline" style={{ color: "#9333ea" }}>{req.investorEmail}</a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-gray-400">Progress</span>
                          <span style={{ color: acc.from }}>{prog}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${prog}%`, background: `linear-gradient(90deg,${acc.from},${acc.to})` }} />
                        </div>
                      </div>

                      {/* Step pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["Pending","Under Review","In Progress","Connected"].map((s, i) => {
                          const steps = ["Pending","Under Review","In Progress","Connected"];
                          const currentIdx = steps.indexOf(req.status === "Interested" ? "In Progress" : req.status);
                          const done = steps.indexOf(s) <= currentIdx;
                          return (
                            <div key={s} className="flex items-center gap-1.5">
                              {i > 0 && <div className="h-px w-4" style={{ background: done ? acc.from + "60" : "#e5e7eb" }} />}
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                                style={done
                                  ? { background: acc.light, color: acc.from, border: `1px solid ${acc.from}25` }
                                  : { background: "#f9fafb", color: "#d1d5db", border: "1px solid #e5e7eb" }
                                }>{s}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Uploaded files */}
                      {(req.deckURL || req.financialURL || req.videoURL) && (
                        <div className="mt-5 flex flex-wrap gap-4 pt-4" style={{ borderTop: "1px solid rgba(124,58,237,0.08)" }}>
                          {req.deckURL && <a href={req.deckURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: "#7c3aed" }}><FileText size={13} />Pitch Deck</a>}
                          {req.financialURL && <a href={req.financialURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: "#db2777" }}><BarChart3 size={13} />Financials</a>}
                          {req.videoURL && <a href={req.videoURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: "#9333ea" }}><Video size={13} />Video Pitch</a>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ════════════════════════════════
            TAB: FUNDING TIPS
        ════════════════════════════════ */}
        {activeTab === "tips" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {fundingTips.map((tip, i) => (
                <div key={i} className="group bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ border: "1px solid rgba(124,58,237,0.1)", boxShadow: "0 2px 12px rgba(124,58,237,0.05)" }}>
                  <div className={`bg-gradient-to-br ${tip.bg} p-6 flex items-center gap-4`}>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <tip.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-black text-white text-lg leading-tight">{tip.title}</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{tip.description}</p>
                    <button onClick={() => setTipModal({ open: true, tip })} className="flex items-center gap-1.5 text-sm font-black transition-all group-hover:gap-2.5" style={{ color: "#7c3aed" }}>
                      Learn more <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.1)", boxShadow: "0 2px 12px rgba(124,58,237,0.05)" }}>
              <div className="p-6 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Preparation Checklist</h3>
                  <p className="text-white/60 text-sm">Essential steps before you apply</p>
                </div>
              </div>
              <div className="p-5 space-y-2">
                {[
                  "Complete your business plan and financial projections",
                  "Prepare a compelling pitch deck (10-15 slides)",
                  "Gather legal documents and incorporation papers",
                  "Document your team's background and expertise",
                  "Compile customer testimonials and case studies",
                  "Research potential investors and their focus areas",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-purple-50/50 transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-600 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            TAB: SUCCESS STORIES
        ════════════════════════════════ */}
        {activeTab === "success" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {successStories.map((story, i) => {
              const acc = ACCENTS[i % 4];
              return (
                <div key={i} className="bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ border: "1px solid rgba(124,58,237,0.1)", boxShadow: "0 2px 12px rgba(124,58,237,0.05)" }}>
                  <div className="relative p-8 flex flex-col items-center text-center overflow-hidden" style={{ background: `linear-gradient(135deg,${acc.from},${acc.to})` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 translate-x-8 -translate-y-8" style={{ background: "radial-gradient(circle,#fff,transparent)" }} />
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-black text-white text-xl">{story.founder}</h3>
                    <p className="text-white/70 text-sm font-bold mt-0.5">{story.company}</p>
                    <div className="mt-3 bg-white/15 rounded-2xl px-5 py-2.5 border border-white/20">
                      <span className="text-3xl font-black text-white">{story.amount}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{story.description}</p>
                    <button
                      onClick={() => setSuccessStoryModal({ open: true, story })}
                      className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-80"
                      style={{ border: `1.5px solid ${acc.from}30`, color: acc.from, background: acc.light }}
                    >
                      Read Full Story →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL: VIEW DETAILS
          — only renders fields present in Firebase
      ══════════════════════════════════════ */}
      {viewDetailsModal.open && viewDetailsModal.opportunity && (() => {
        const op = viewDetailsModal.opportunity;
        const myReq = myRequests.find(r => r.opportunityId === op.id);
        const isConnected = myReq?.status === "Connected";

        // Build only fields that have data
        const infoFields = [
          op.funding          && { label: "Funding Range",   value: `₹${op.funding}`,          icon: DollarSign, color: "#059669", bg: "rgba(5,150,105,0.06)" },
          op.location         && { label: "Location",        value: op.location,          icon: MapPin,     color: "#7c3aed", bg: "rgba(124,58,237,0.06)" },
          op.availabilityStatus && { label: "Availability",  value: op.availabilityStatus, icon: Zap,       color: "#db2777", bg: "rgba(219,39,119,0.06)" },
          (op.phoneNumber || op.phone) && { label: "Phone",  value: op.phoneNumber || op.phone, icon: Phone, color: "#9333ea", bg: "rgba(147,51,234,0.06)" },
          op.email            && { label: "Email",           value: op.email,             icon: Mail,       color: "#c026d3", bg: "rgba(192,38,211,0.06)" },
          op.investmentInterests && { label: "Interests",    value: op.investmentInterests, icon: Sparkles, color: "#be185d", bg: "rgba(190,24,93,0.06)" },
        ].filter(Boolean) as { label: string; value: string; icon: any; color: string; bg: string }[];

        return (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl" style={{ boxShadow: "0 24px 80px rgba(124,58,237,0.2)" }}>
              {/* Gradient header */}
              <div className="relative rounded-t-3xl overflow-hidden p-6" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea,#db2777)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 translate-x-10 -translate-y-10" style={{ background: "radial-gradient(circle,#fff,transparent)" }} />
                <div className="flex items-start justify-between relative">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/30">
                      {op.photoURL
                        ? <img src={op.photoURL} alt={op.fullName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl bg-white/20">{op.fullName?.[0] || "I"}</div>
                      }
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{op.fullName}</h2>
                      {op.company && <p className="text-white/60 text-sm flex items-center gap-1.5 mt-0.5"><Building2 className="w-3.5 h-3.5" />{op.company}</p>}
                      {isConnected && (
                        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30">
                          <Link2 className="w-3 h-3" />Connected
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setViewDetailsModal({ open: false, opportunity: null })} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Info grid — only fields with data */}
                {infoFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {infoFields.map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="p-4 rounded-2xl" style={{ background: bg, border: `1px solid ${color}15` }}>
                        <p className="text-xs font-black uppercase tracking-wider mb-1.5" style={{ color: color + "80" }}>{label}</p>
                        <p className="font-bold text-sm flex items-center gap-1.5" style={{ color }}>
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{value}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {op.bio && (
                  <div>
                    <h3 className="font-black text-gray-800 text-base mb-2">About</h3>
                    <p className="text-gray-500 text-sm leading-relaxed p-4 rounded-2xl" style={{ background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}>{op.bio}</p>
                  </div>
                )}

                {/* LinkedIn */}
                {op.linkedinProfile && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)" }}>
                    <Linkedin className="w-4 h-4 flex-shrink-0" style={{ color: "#3b82f6" }} />
                    <a href={op.linkedinProfile.startsWith("http") ? op.linkedinProfile : `https://${op.linkedinProfile}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-sm font-bold truncate hover:underline" style={{ color: "#3b82f6" }}>
                      {op.linkedinProfile}
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    disabled={appliedIds.includes(op.id)}
                    onClick={() => { setViewDetailsModal({ open: false, opportunity: null }); openApply(op); }}
                    className="flex-1 py-3.5 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 8px 24px rgba(124,58,237,0.25)" }}
                  >
                    {appliedIds.includes(op.id) ? "Already Applied ✓" : "Apply Now →"}
                  </button>
                  <button onClick={() => setViewDetailsModal({ open: false, opportunity: null })}
                    className="px-6 py-3.5 rounded-2xl font-bold text-sm transition-all hover:bg-gray-50"
                    style={{ border: "1.5px solid rgba(124,58,237,0.2)", color: "#7c3aed" }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════
          MODAL: SUCCESS STORY
      ══════════════════════════════════════ */}
      {successStoryModal.open && successStoryModal.story && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
            <div className="relative rounded-t-3xl overflow-hidden p-6" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{successStoryModal.story.founder}</h2>
                    <p className="text-white/60 text-sm">{successStoryModal.story.company}</p>
                  </div>
                </div>
                <button onClick={() => setSuccessStoryModal({ open: false, story: null })} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="inline-block text-white font-black text-4xl px-5 py-3 rounded-2xl" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 8px 24px rgba(124,58,237,0.25)" }}>
                {successStoryModal.story.amount}
              </div>
              <p className="text-gray-500 leading-relaxed text-sm">{successStoryModal.story.fullDescription}</p>
              <div>
                <h3 className="font-black text-gray-800 mb-4">Journey Timeline</h3>
                <div className="space-y-3">
                  {successStoryModal.story.timeline.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="w-24 text-xs font-black flex-shrink-0 pt-1" style={{ color: "#7c3aed" }}>{item.date}</span>
                      <div className="flex-1 pb-3 pl-4" style={{ borderLeft: "2px solid rgba(124,58,237,0.2)" }}>
                        <p className="text-gray-600 text-sm font-medium">{item.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: TIP
      ══════════════════════════════════════ */}
      {tipModal.open && tipModal.tip && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
            <div className={`bg-gradient-to-br ${tipModal.tip.bg} rounded-t-3xl p-6 flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <tipModal.tip.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-black text-white">{tipModal.tip.title}</h2>
              </div>
              <button onClick={() => setTipModal({ open: false, tip: null })} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-gray-500 leading-relaxed text-sm">{tipModal.tip.detailedAdvice}</p>
              <div>
                <h3 className="font-black text-gray-800 mb-3">Steps to Follow</h3>
                <div className="space-y-2">
                  {tipModal.tip.steps.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)" }}>
                      <span className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>{i + 1}</span>
                      <span className="text-gray-600 text-sm font-medium">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
                <p className="text-xs font-black text-amber-500 mb-1.5 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />Example</p>
                <p className="text-gray-600 text-sm leading-relaxed">{tipModal.tip.examples}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: APPLICATION FORM
      ══════════════════════════════════════ */}
      {applicationFormModal && selectedOpportunity && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
            {/* Sticky header */}
            <div className="sticky top-0 bg-white rounded-t-3xl z-10" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
              <div className="h-1 rounded-t-3xl" style={{ background: "linear-gradient(90deg,#7c3aed,#9333ea,#db2777,#f43f5e)" }} />
              <div className="flex items-start justify-between px-7 py-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Apply to {selectedOpportunity.fullName}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {selectedOpportunity.company}{selectedOpportunity.funding && ` · ${selectedOpportunity.funding}`}
                  </p>
                </div>
                <button onClick={() => setApplicationFormModal(false)} className="p-2 rounded-xl hover:bg-purple-50 transition-all" style={{ color: "#7c3aed" }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input className={mInput} placeholder="Full Name *" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                  <input className={mInput} placeholder="Email *" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className={mInput} placeholder="Startup Name *" required value={form.startupName} onChange={e => setForm({ ...form, startupName: e.target.value })} />
                  <input className={mInput} placeholder="Stage (e.g. Seed) *" required value={form.startupStage} onChange={e => setForm({ ...form, startupStage: e.target.value })} />
                </div>
                <input className={mInput} placeholder="Funding Amount Requested *" required value={form.fundingAmountRequested} onChange={e => setForm({ ...form, fundingAmountRequested: e.target.value })} />
                <textarea className={`${mInput} resize-none`} placeholder="Problem Statement *" required rows={3} value={form.problemStatement} onChange={e => setForm({ ...form, problemStatement: e.target.value })} />
                <textarea className={`${mInput} resize-none`} placeholder="Your Solution *" required rows={3} value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} />
                <textarea className={`${mInput} resize-none`} placeholder="Why You Qualify *" required rows={3} value={form.whyYouQualify} onChange={e => setForm({ ...form, whyYouQualify: e.target.value })} />

                {/* Upload section */}
                <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(124,58,237,0.03)", border: "1.5px dashed rgba(124,58,237,0.2)" }}>
                  <p className="text-sm font-black flex items-center gap-2" style={{ color: "#7c3aed" }}>
                    <Upload size={14} />Supporting Documents
                  </p>
                  {[
                    { icon: FileText, label: "Pitch Deck", accept: ".pdf,.ppt,.pptx", hint: "PDF, PPT, PPTX", color: "#7c3aed", file: pitchDeck, pct: uploadPct.deck, set: setPitchDeck, key: "deck" },
                    { icon: BarChart3, label: "Financial Model", accept: ".xlsx,.xls,.csv", hint: "Excel, CSV", color: "#059669", file: financialModel, pct: uploadPct.financial, set: setFinancialModel, key: "financial" },
                    { icon: Video, label: "Video Pitch", accept: "video/*", hint: "MP4, MOV, AVI", color: "#db2777", file: videoPitch, pct: uploadPct.video, set: setVideoPitch, key: "video" },
                  ].map(({ icon: Icon, label, accept, hint, color, file, pct, set, key }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white transition-all hover:shadow-sm" style={{ border: "1px solid rgba(124,58,237,0.1)" }}>
                      <Icon size={20} style={{ color, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-700">{label}</p>
                        <p className="text-xs text-gray-400">{hint}</p>
                        <UploadPill pct={pct} file={file} />
                      </div>
                      <input type="file" accept={accept} className="hidden" onChange={e => { set(e.target.files?.[0] || null); setUploadPct(p => ({ ...p, [key]: -1 })); }} />
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-4 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
                    {submitting ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : <>Submit Application <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <button type="button" onClick={() => setApplicationFormModal(false)}
                    className="px-6 py-4 rounded-2xl font-bold text-sm transition-all hover:bg-purple-50"
                    style={{ border: "1.5px solid rgba(124,58,237,0.2)", color: "#7c3aed" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}