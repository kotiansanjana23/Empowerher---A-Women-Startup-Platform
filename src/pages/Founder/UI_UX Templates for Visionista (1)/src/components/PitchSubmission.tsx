import { useState, useEffect, useRef } from "react";import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Upload, FileText, Play, MessageSquare, Clock,
  CheckCircle, AlertCircle, Share, Edit, Video,
  BarChart3, Users, Target, Lightbulb, BookOpen, Loader2,
  TrendingUp, Zap, ArrowRight, Star, Eye, X, ChevronRight,
  Sparkles, Calendar, Youtube,
} from "lucide-react";
import { db, auth } from "../../../../../firebase";
import { collection, doc, setDoc, updateDoc, runTransaction, getDocs, query, where } from "firebase/firestore";
import logo from "../../../../../logo.png";

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
  // Use raw resource type for PDF and CSV files
  const isPdfOrCsv = file.type === "application/pdf" || 
                     file.name.endsWith(".pdf") || 
                     file.name.endsWith(".csv") ||
                     file.name.endsWith(".xlsx") ||
                     file.name.endsWith(".xls");

  formData.append("upload_preset", "empowerher_files");
  
  const resourceType = isPdfOrCsv ? "raw" : "auto";
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/dcgm3doyn/${resourceType}/upload`, { 
    method: "POST", 
    body: formData 
  });
  const data = await res.json();
  return data.secure_url;
};

/* ─── GlassCard ─── */
const GlassCard = ({ children, className = "", gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) => (
  <div className={`relative rounded-2xl border border-white/20 bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(168,85,247,0.08)] ${gradient ? "bg-gradient-to-br from-purple-50/80 to-pink-50/60" : ""} ${className}`}>
    {children}
  </div>
);

/* ─── Status pill badges ─── */
const PillBadge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "review" | "draft" | "accepted" }) => {
  const styles = {
    default:  "bg-purple-100 text-purple-700 border-purple-200",
    review:   "bg-amber-50 text-amber-700 border-amber-200",
    draft:    "bg-slate-100 text-slate-600 border-slate-200",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
};

const statusVariant = (status: string): "default" | "review" | "draft" | "accepted" => {
  if (status === "Accepted") return "accepted";
  if (status === "Under Review") return "review";
  if (status === "Draft") return "draft";
  return "default";
};

/* ─── Mesh background ─── */
const MeshBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-purple-300/25 via-pink-200/20 to-purple-200/15 blur-[100px]" />
    <div className="absolute top-1/3 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-200/20 via-pink-100/15 to-purple-100/10 blur-[120px]" />
    <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-pink-200/15 via-purple-100/10 to-purple-50/5 blur-[90px]" />
    <div className="absolute inset-0 opacity-[0.015]"
      style={{ backgroundImage: "linear-gradient(#9333ea 1px, transparent 1px), linear-gradient(to right, #9333ea 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
  </div>
);

/* ─── Stat orb card ─── */
const StatOrb = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className="relative flex flex-col items-center justify-center rounded-2xl p-5 border border-white/30 bg-white/50 backdrop-blur-md shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-purple-100 hover:-translate-y-0.5">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${color}`} />
    <Icon className="relative h-5 w-5 mb-2 text-purple-500" />
    <span className="relative text-2xl font-bold text-gray-900">{value}</span>
    <span className="relative text-xs text-gray-500 mt-0.5">{label}</span>
  </div>
);

export function PitchSubmission() {
  const [activeTab, setActiveTab] = useState("submit");
  const [pitchForm, setPitchForm] = useState({
    title: "", industry: "", stage: "", fundingGoal: "",
    description: "", problem: "", solution: "", marketSize: "",
    businessModel: "", team: "", competition: "", financials: "",
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [financialFile, setFinancialFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [mentorHub, setMentorHub] = useState<any>(null);
const [loadingMentorHub, setLoadingMentorHub] = useState(true);

  // ── Edit modal state ──
  const [editingPitch, setEditingPitch] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", industry: "", stage: "", fundingGoal: "",
    problem: "", solution: "", marketSize: "", businessModel: "",
  });
  // ── Edit modal file states ──
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editDeckFile, setEditDeckFile] = useState<File | null>(null);
  const [editFinancialFile, setEditFinancialFile] = useState<File | null>(null);

  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

const fetchMentorHub = async () => {
  setLoadingMentorHub(true);
  try {
    const q = query(
      collection(db, "myFounders"),
      where("founderId", "==", auth.currentUser?.uid || "")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      setMentorHub(data.mentorHub || null);
    }
  } catch (err) {
    console.error("Failed to fetch mentor hub:", err);
  } finally {
    setLoadingMentorHub(false);
  }
};

const fetchSubmissions = async () => {
      setLoadingSubmissions(true);
    try {
      const q = query(
        collection(db, "pitches"),
        where("founderId", "==", auth.currentUser?.uid || "")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({
        id: d.id, ...d.data(),
        submittedDate: d.data().submittedAt?.toDate?.()
          ? d.data().submittedAt.toDate().toISOString().split("T")[0]
          : d.data().submittedAt?.split?.("T")[0] || "—",
      }));
      data.sort((a, b) => Number(a.id) - Number(b.id));
      setSubmissions(data);
    } catch (err) { console.error("Failed to fetch pitches:", err); }
    finally { setLoadingSubmissions(false); }
  };

useEffect(() => { fetchSubmissions(); fetchMentorHub(); }, []);
  // ── Mentor feedback with auth-ready retry ──


  const basicFields   = ["title", "industry", "stage", "fundingGoal"];
  const contentFields = ["problem", "solution", "marketSize", "businessModel"];
  const pct = (fields: string[]) => {
    const filled = fields.filter((f) => pitchForm[f as keyof typeof pitchForm]?.trim()).length;
    return Math.round((filled / fields.length) * 100);
  };
  const basicPct   = pct(basicFields);
  const contentPct = pct(contentFields);
  const filesPct   = Math.round(([videoFile, deckFile, financialFile].filter(Boolean).length / 3) * 100);

  const emptyForm = {
    title: "", industry: "", stage: "", fundingGoal: "",
    description: "", problem: "", solution: "", marketSize: "",
    businessModel: "", team: "", competition: "", financials: "",
  };

  const getNextId = async (): Promise<number> => {
    const counterRef = doc(db, "pitchCounter", "counter");
    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      const current = counterDoc.exists() ? counterDoc.data().count : 0;
      const next = current + 1;
      transaction.set(counterRef, { count: next });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (!pitchForm.title.trim()) { setErrorMsg("Please enter a pitch title before submitting."); isSubmittingRef.current = false; return; }
    if (!pitchForm.problem.trim() || !pitchForm.solution.trim()) { setErrorMsg("Please fill in at least the Problem Statement and Solution fields."); isSubmittingRef.current = false; return; }
    setErrorMsg(""); setSubmitting(true);
    try {
      let videoURL = "", deckURL = "", financialURL = "";
      if (videoFile) videoURL = await uploadToCloudinary(videoFile);
      if (deckFile)  deckURL  = await uploadToCloudinary(deckFile);
      if (financialFile) financialURL = await uploadToCloudinary(financialFile);
      const nextId = await getNextId();
      await setDoc(doc(db, "pitches", String(nextId)), {
        founderId: auth.currentUser?.uid || "", founderEmail: auth.currentUser?.email || "",
        pitchTitle: pitchForm.title, title: pitchForm.title, industry: pitchForm.industry,
        startupStage: pitchForm.stage, stage: pitchForm.stage, fundingGoal: pitchForm.fundingGoal,
        problemStatement: pitchForm.problem, problem: pitchForm.problem, solution: pitchForm.solution,
        marketSize: pitchForm.marketSize, businessModel: pitchForm.businessModel,
        status: "Under Review", submittedAt: new Date().toISOString(), isDraft: false,
        videoURL, deckURL, financialURL,
      });
      setSuccessMsg(`🎉 Pitch #${nextId} submitted! Our mentors will review it soon.`);
      setPitchForm(emptyForm); setVideoFile(null); setDeckFile(null); setFinancialFile(null);
      await fetchSubmissions();
    } catch (err) { console.error("Submit error:", err); setErrorMsg("Something went wrong. Please try again."); }
    finally { setSubmitting(false); isSubmittingRef.current = false; }
  };

  const handleSaveDraft = async () => {
    if (!pitchForm.title.trim()) { setErrorMsg("Please enter a pitch title to save a draft."); return; }
    setErrorMsg(""); setSubmitting(true);
    try {
      const nextId = await getNextId();
      await setDoc(doc(db, "pitches", String(nextId)), {
        founderId: auth.currentUser?.uid || "", founderEmail: auth.currentUser?.email || "",
        pitchTitle: pitchForm.title, title: pitchForm.title, industry: pitchForm.industry,
        startupStage: pitchForm.stage, stage: pitchForm.stage, fundingGoal: pitchForm.fundingGoal,
        problemStatement: pitchForm.problem, problem: pitchForm.problem, solution: pitchForm.solution,
        marketSize: pitchForm.marketSize, businessModel: pitchForm.businessModel,
        status: "Draft", submittedAt: new Date().toISOString(), isDraft: true,
        videoFileName: "", deckFileName: "", financialFileName: "",
      });
      setSuccessMsg(`✅ Draft #${nextId} saved!`);
      await fetchSubmissions();
    } catch (err) { console.error("Draft error:", err); setErrorMsg("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  // ── Open edit modal ──
  const openEdit = (s: any) => {
    setEditingPitch(s);
    setEditSuccess("");
    setEditError("");
    setEditVideoFile(null);
    setEditDeckFile(null);
    setEditFinancialFile(null);
    setEditForm({
      title:         s.title || s.pitchTitle || "",
      industry:      s.industry || "",
      stage:         s.stage || s.startupStage || "",
      fundingGoal:   s.fundingGoal || "",
      problem:       s.problem || s.problemStatement || "",
      solution:      s.solution || "",
      marketSize:    s.marketSize || "",
      businessModel: s.businessModel || "",
    });
  };

  // ── Save edits and resubmit ──
  const handleEditSave = async (resubmit: boolean) => {
    if (!editForm.title.trim()) { setEditError("Pitch title is required."); return; }
    if (resubmit && (!editForm.problem.trim() || !editForm.solution.trim())) {
      setEditError("Please fill in Problem Statement and Solution before resubmitting.");
      return;
    }
    setEditError(""); setEditSubmitting(true);
    try {
      // Upload new files only if the user selected new ones; keep existing URLs otherwise
      let videoURL    = editingPitch.videoURL    || "";
      let deckURL     = editingPitch.deckURL     || "";
      let financialURL = editingPitch.financialURL || "";
      if (editVideoFile)    videoURL     = await uploadToCloudinary(editVideoFile);
      if (editDeckFile)     deckURL      = await uploadToCloudinary(editDeckFile);
      if (editFinancialFile) financialURL = await uploadToCloudinary(editFinancialFile);

      const pitchRef = doc(db, "pitches", String(editingPitch.id));
      await updateDoc(pitchRef, {
        title:            editForm.title,
        pitchTitle:       editForm.title,
        industry:         editForm.industry,
        stage:            editForm.stage,
        startupStage:     editForm.stage,
        fundingGoal:      editForm.fundingGoal,
        problem:          editForm.problem,
        problemStatement: editForm.problem,
        solution:         editForm.solution,
        marketSize:       editForm.marketSize,
        businessModel:    editForm.businessModel,
        videoURL,
        deckURL,
        financialURL,
        ...(resubmit ? { status: "Under Review", isDraft: false, submittedAt: new Date().toISOString() } : {}),
      });
      setEditSuccess(resubmit ? "✅ Pitch resubmitted for review!" : "✅ Changes saved!");
      setEditVideoFile(null); setEditDeckFile(null); setEditFinancialFile(null);
      await fetchSubmissions();
      setTimeout(() => { setEditingPitch(null); setEditSuccess(""); }, 1500);
    } catch (err) { console.error("Edit error:", err); setEditError("Something went wrong. Please try again."); }
    finally { setEditSubmitting(false); }
  };

  const pitchTips = [
    { icon: Target,    color: "text-purple-600", bg: "bg-purple-50",  title: "Define the Problem Clearly",   description: "Start with a compelling problem that resonates with your audience. Use data and real examples to make it tangible." },
    { icon: Lightbulb, color: "text-pink-500",   bg: "bg-pink-50",    title: "Present Your Unique Solution", description: "Explain how your solution is different and better than existing alternatives. Show your unfair advantage." },
    { icon: TrendingUp,color: "text-emerald-600",bg: "bg-emerald-50", title: "Show Market Validation",       description: "Include customer feedback, pilot results, or early traction metrics to build credibility with investors." },
    { icon: Users,     color: "text-purple-600", bg: "bg-purple-50",  title: "Highlight Your Team",          description: "Investors back people first. Showcase relevant experience, domain expertise, and why you'll win." },
  ];

  const inputCls = "bg-white/70 border-purple-100 focus:border-purple-400 focus:ring-purple-200 placeholder:text-gray-300 rounded-xl transition-all text-gray-900";
  const selectContentCls = "bg-white border border-purple-100 shadow-lg rounded-xl z-50";
  const selectItemCls = "text-gray-800 hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-700 cursor-pointer rounded-lg";
  const modalInputCls = "w-full px-3 py-2 rounded-xl border border-purple-100 bg-white/80 text-gray-900 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white" style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}>
      <MeshBackground />

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden border-b border-purple-100/60 bg-white/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-500/5 to-purple-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Pitch Center
              </h1>
              <p className="text-gray-500 mt-1.5 text-sm">Submit, refine, and get expert feedback on your startup pitch</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatOrb label="Submissions"  value={submissions.length}                                         icon={FileText}    color="from-purple-50/80 to-pink-50/50" />
              <StatOrb label="Under Review" value={submissions.filter(s => s.status === "Under Review").length} icon={Eye}         color="from-amber-50/80 to-orange-50/50" />
              <StatOrb label="Accepted"     value={submissions.filter(s => s.status === "Accepted").length}    icon={CheckCircle} color="from-emerald-50/80 to-green-50/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Tab Bar ── */}
        <div className="mb-8">
          <div className="flex gap-1 p-1 rounded-2xl bg-white/60 backdrop-blur-md border border-purple-100 shadow-sm w-fit">
            {[
              { id: "submit",      label: "Submit Pitch",    icon: Upload },
              { id: "submissions", label: "My Submissions",  icon: FileText },
{ id: "feedback",    label: "Mentor Feedback",  icon: MessageSquare },
{ id: "tips",        label: "Pitch Tips",       icon: BookOpen },            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${activeTab === id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-200"
                    : "text-gray-500 hover:text-purple-600 hover:bg-purple-50/60"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════ SUBMIT TAB ══════════════════════ */}
        {activeTab === "submit" && (
          <div className="space-y-5">
            {successMsg && (
              <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-2xl p-4 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-3 bg-red-50/80 border border-red-200 text-red-800 rounded-2xl p-4 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">

                {/* Basic Info */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Basic Information</h3>
                      <p className="text-xs text-gray-400">Tell us about your startup</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pitch Title <span className="text-red-400">*</span></Label>
                      <Input className={inputCls} placeholder="e.g., EcoTech Solutions" value={pitchForm.title} onChange={(e) => setPitchForm(prev => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Industry</Label>
                      <Select value={pitchForm.industry} onValueChange={(v) => setPitchForm(prev => ({ ...prev, industry: v }))}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent className={selectContentCls}>
                          {["Technology","Healthcare","Fintech","E-commerce","Education","Sustainability"].map(i => (
                            <SelectItem key={i} value={i.toLowerCase()} className={selectItemCls}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Startup Stage</Label>
                      <Select value={pitchForm.stage} onValueChange={(v) => setPitchForm(prev => ({ ...prev, stage: v }))}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="Select stage" /></SelectTrigger>
                        <SelectContent className={selectContentCls}>
                          {[["idea","Idea Stage"],["prototype","Prototype"],["mvp","MVP"],["early-traction","Early Traction"],["growth","Growth Stage"]].map(([v,l]) => (
                            <SelectItem key={v} value={v} className={selectItemCls}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Funding Goal</Label>
                      <Input className={inputCls} placeholder="e.g., $500,000" value={pitchForm.fundingGoal} onChange={(e) => setPitchForm(prev => ({ ...prev, fundingGoal: e.target.value }))} />
                    </div>
                  </div>
                </GlassCard>

                {/* Pitch Content */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Pitch Content</h3>
                      <p className="text-xs text-gray-400">The story of your venture</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Problem Statement <span className="text-red-400">*</span></Label>
                      <Textarea className={`${inputCls} min-h-[100px] resize-none`} placeholder="What painful problem are you solving? Be specific and data-driven." value={pitchForm.problem} onChange={(e) => setPitchForm(prev => ({ ...prev, problem: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Solution <span className="text-red-400">*</span></Label>
                      <Textarea className={`${inputCls} min-h-[100px] resize-none`} placeholder="How does your product uniquely solve this problem?" value={pitchForm.solution} onChange={(e) => setPitchForm(prev => ({ ...prev, solution: e.target.value }))} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Market Size</Label>
                        <Textarea className={`${inputCls} min-h-[90px] resize-none`} placeholder="TAM, SAM, SOM — how big is the opportunity?" value={pitchForm.marketSize} onChange={(e) => setPitchForm(prev => ({ ...prev, marketSize: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Business Model</Label>
                        <Textarea className={`${inputCls} min-h-[90px] resize-none`} placeholder="How do you make money? Unit economics?" value={pitchForm.businessModel} onChange={(e) => setPitchForm(prev => ({ ...prev, businessModel: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Supporting Materials */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Supporting Materials</h3>
                      <p className="text-xs text-gray-400">Strengthen your pitch with evidence</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { icon: Video,    label: "Video Pitch",    hint: "MP4, MOV, AVI",  accept: "video/*",         file: videoFile,    setter: setVideoFile,    hoverBorder: "group-hover:border-purple-400 group-hover:bg-purple-50/40" },
                      { icon: FileText, label: "Pitch Deck",     hint: "PDF, PPT, PPTX", accept: ".pdf,.ppt,.pptx", file: deckFile,     setter: setDeckFile,     hoverBorder: "group-hover:border-pink-400 group-hover:bg-pink-50/40" },
                      { icon: BarChart3,label: "Financial Model",hint: "Excel, CSV",      accept: ".csv,.xlsx,.xls", file: financialFile,setter: setFinancialFile, hoverBorder: "group-hover:border-purple-400 group-hover:bg-purple-50/40" },
                    ].map(({ icon: Icon, label, hint, accept, file, setter, hoverBorder }) => (
                      <label key={label} className={`group relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-purple-100 rounded-2xl p-6 cursor-pointer transition-all duration-200 bg-white/40 ${hoverBorder}`}>
                        <input type="file" accept={accept} className="hidden" onChange={(e) => setter(e.target.files?.[0] || null)} />
                        <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Icon className="h-6 w-6 text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                        <span className="text-xs text-gray-400">{hint}</span>
                        {file ? (
                          <span className="flex items-center gap-1 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full max-w-full truncate">
                            <CheckCircle className="h-3 w-3 shrink-0" /><span className="truncate">{file.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to upload</span>
                        )}
                      </label>
                    ))}
                  </div>
                </GlassCard>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button onClick={handleSaveDraft} disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-purple-200 text-purple-700 font-semibold text-sm hover:bg-purple-50 transition-all duration-200 disabled:opacity-50">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Draft
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Submit for Review
                    {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* ── Sidebar ── */}
              <div className="space-y-5">
                <GlassCard className="p-5" gradient>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-purple-500" />
                    <h4 className="font-bold text-gray-800 text-sm">Completion Progress</h4>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Basic Info",    pct: basicPct,   color: "bg-gradient-to-r from-purple-600 to-pink-500" },
                      { label: "Pitch Content", pct: contentPct, color: "bg-gradient-to-r from-pink-500 to-purple-400" },
                      { label: "Materials",     pct: filesPct,   color: "bg-gradient-to-r from-purple-400 to-pink-400" },
                    ].map(({ label, pct, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-gray-600">{label}</span>
                          <span className="font-bold text-purple-600">{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-purple-50 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-100">
                    <p className="text-xs text-gray-500 text-center">
                      Overall: <span className="font-bold text-purple-600">{Math.round((basicPct + contentPct + filesPct) / 3)}%</span> complete
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <h4 className="font-bold text-gray-800 text-sm">Submission Guidelines</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Be clear and concise in your explanations",
                      "Include specific metrics and data where possible",
                      "Video pitches should be 3–5 minutes",
                      "Pitch decks: 10–15 slides maximum",
                    ].map((tip) => (
                      <div key={tip} className="flex items-start gap-2.5">
                        <div className="h-5 w-5 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-purple-500" />
                        </div>
                        <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <div className="rounded-2xl p-5 text-white relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600">
                  <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
                  <div className="absolute bottom-0 left-0 h-16 w-16 rounded-full bg-white/5 translate-y-4 -translate-x-4" />
                  <Zap className="h-6 w-6 text-pink-200 mb-3 relative" />
                  <p className="text-sm font-bold relative mb-1">Pro Tip</p>
                  <p className="text-xs text-purple-100 relative leading-relaxed">
                    Pitches with a video receive 3× more mentor engagement. Keep it under 5 minutes!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════ SUBMISSIONS TAB ══════════════════════ */}
        {activeTab === "submissions" && (
          <div className="space-y-4">
            {loadingSubmissions ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-3" />
                <p className="text-sm">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-20">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-purple-400" />
                </div>
                <p className="font-bold text-gray-700">No submissions yet</p>
                <p className="text-sm text-gray-400 mt-1">Submit your first pitch to see it here.</p>
                <button onClick={() => setActiveTab("submit")}
                  className="mt-5 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-pink-700 transition-all">
                  <Upload className="h-4 w-4" /> Submit a Pitch
                </button>
              </GlassCard>
            ) : (
              <div className="grid gap-4">
                {submissions.map((s) => (
                  <GlassCard key={s.id} className="p-6 hover:shadow-[0_12px_40px_rgba(168,85,247,0.12)] transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-50 px-2 py-0.5 rounded-lg">#{s.id}</span>
                          <h3 className="text-lg font-bold text-gray-900 truncate">{s.title || s.pitchTitle || "Untitled Pitch"}</h3>
                          <PillBadge variant={statusVariant(s.status)}>{s.status}</PillBadge>
                          {s.industry && <PillBadge>{s.industry}</PillBadge>}
                        </div>
                        {s.problem && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{s.problem}</p>}
                        <div className="flex items-center flex-wrap gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{s.submittedDate}</span>
                          {s.stage && <span className="capitalize">Stage: <span className="text-gray-600 font-medium">{s.stage}</span></span>}
                          {s.fundingGoal && <span>Goal: <span className="text-gray-600 font-medium">{s.fundingGoal}</span></span>}
                          {s.isDraft && <span className="text-amber-500 font-semibold">Draft</span>}
                        </div>
                        {/* Show existing file links */}
                        {(s.videoURL || s.deckURL || s.financialURL) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {s.videoURL && (
                              <a href={s.videoURL} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-all">
                                <Video className="h-3 w-3" />Video
                              </a>
                            )}
                            {s.deckURL && (
                              <a href={s.deckURL} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-50 transition-all">
                                <FileText className="h-3 w-3" />Deck
                              </a>
                            )}
                            {s.financialURL && (
                              <a href={s.financialURL} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-50 transition-all">
                                <BarChart3 className="h-3 w-3" />Financials
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {/* ── Edit Button ── */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(s)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-purple-700 border border-purple-200 bg-white/60 hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm">
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════ FEEDBACK TAB ══════════════════════ */}
        {/* ══════════════════════ FEEDBACK TAB ══════════════════════ */}
        {activeTab === "feedback" && (
          <div className="space-y-5">
            {loadingMentorHub ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-3" />
                <p className="text-sm">Loading mentor feedback…</p>
              </div>
            ) : !mentorHub ? (
              <GlassCard className="flex flex-col items-center justify-center py-20">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-purple-300" />
                </div>
                <p className="font-bold text-gray-700">No mentor strategy yet</p>
                <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
                  Your mentor hasn't added a strategy session for you yet. Check back soon!
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-5">

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-7 shadow-lg shadow-purple-200">
                  <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 left-8 w-32 h-32 rounded-full bg-pink-400/20" />
                  <div className="relative z-10 flex flex-wrap items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-0.5">From Your Mentor</p>
                      <h2 className="text-2xl font-bold text-white">Mentor Strategy Hub</h2>
                      <p className="text-purple-100 text-sm mt-0.5">Your personalised guidance and session plan</p>
                    </div>
                    {mentorHub.meetingDate && (
                      <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20 text-center shrink-0">
                        <p className="text-white text-xs font-bold uppercase tracking-wider mb-0.5">Next Session</p>
                        <p className="text-white font-bold text-sm">{mentorHub.meetingDate}</p>
                        {mentorHub.meetingTime && <p className="text-purple-200 text-xs">{mentorHub.meetingTime}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">

                  <GlassCard className="overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-5 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                        <Target className="h-4 w-4 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Session Goals</h3>
                        <p className="text-xs text-gray-400">What your mentor wants you to achieve</p>
                      </div>
                    </div>
                    <div className="p-5">
                      {mentorHub.agenda ? (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{mentorHub.agenda}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No goals set yet for this session.</p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard className="overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-5 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Scheduled Session</h3>
                        <p className="text-xs text-gray-400">When you'll meet your mentor</p>
                      </div>
                    </div>
                    <div className="p-5">
                      {mentorHub.meetingDate ? (
                        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">Session Confirmed</p>
                            <p className="text-emerald-700 text-xs font-medium mt-0.5">
                              {mentorHub.meetingDate}{mentorHub.meetingTime ? ` at ${mentorHub.meetingTime}` : ""}
                            </p>
                          </div>
                          <span className="ml-auto px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full shrink-0">Upcoming</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-gray-400 py-2">
                          <Clock className="h-4 w-4 shrink-0" />
                          <p className="text-sm italic">No session scheduled yet.</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  {(mentorHub.youtubeLink || mentorHub.pdfLink) && (
                    <GlassCard className="overflow-hidden md:col-span-2">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-5 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">Strategic Resources</h3>
                          <p className="text-xs text-gray-400">Learning materials shared by your mentor</p>
                        </div>
                      </div>
                      <div className="p-5 flex flex-wrap gap-3">
                        {mentorHub.youtubeLink && (
                          <a href={mentorHub.youtubeLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 transition-all shadow-sm hover:-translate-y-0.5">
                            <Youtube className="h-4 w-4" /> Watch Video Resource
                            <ArrowRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {mentorHub.pdfLink && (
                          <a href={mentorHub.pdfLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-700 border-2 border-purple-200 hover:bg-purple-50 transition-all hover:-translate-y-0.5">
                            <FileText className="h-4 w-4" /> Open PDF / Document
                            <ArrowRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </GlassCard>
                  )}

                </div>

                <GlassCard className="px-5 py-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Strategy progress</p>
                  <div className="flex items-center gap-2 overflow-x-auto flex-wrap">
                    {[
                      { label: "Session scheduled", done: !!mentorHub.meetingDate },
                      { label: "Goals defined",     done: !!mentorHub.agenda },
                      { label: "Resources shared",  done: !!(mentorHub.youtubeLink || mentorHub.pdfLink) },
                    ].map((step, i, arr) => (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          step.done
                            ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
                            : "bg-gray-50 text-gray-400 border border-gray-100"
                        }`}>
                          {step.done
                            ? <CheckCircle className="h-3 w-3 text-purple-500" />
                            : <span className="w-3 h-3 rounded-full border-2 border-gray-300 inline-block" />
                          }
                          {step.label}
                        </div>
                        {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-gray-200 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </GlassCard>

              </div>
            )}
          </div>
        )}
    

        {/* ══════════════════════ TIPS TAB ══════════════════════ */}
        {activeTab === "tips" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              {pitchTips.map((tip, i) => (
                <GlassCard key={i} className="p-6 hover:shadow-[0_12px_40px_rgba(168,85,247,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-2xl ${tip.bg} flex items-center justify-center shrink-0`}>
                      <tip.icon className={`h-5 w-5 ${tip.color}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1.5">{tip.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{tip.description}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════ EDIT MODAL ══════════════════════ */}
      {editingPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-100">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Edit Pitch <span className="text-purple-400 font-mono">#{editingPitch.id}</span></h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your details, then save or resubmit for review</p>
              </div>
              <button onClick={() => setEditingPitch(null)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">

              {/* Success / Error banners */}
              {editSuccess && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <p className="text-sm font-medium">{editSuccess}</p>
                </div>
              )}
              {editError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm font-medium">{editError}</p>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Information</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Pitch Title <span className="text-red-400">*</span></label>
                    <input className={modalInputCls} value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., EcoTech Solutions" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Industry</label>
                    <input className={modalInputCls} value={editForm.industry} onChange={e => setEditForm(p => ({ ...p, industry: e.target.value }))} placeholder="e.g., Technology" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Stage</label>
                    <input className={modalInputCls} value={editForm.stage} onChange={e => setEditForm(p => ({ ...p, stage: e.target.value }))} placeholder="e.g., MVP" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Funding Goal</label>
                    <input className={modalInputCls} value={editForm.fundingGoal} onChange={e => setEditForm(p => ({ ...p, fundingGoal: e.target.value }))} placeholder="e.g., $500,000" />
                  </div>
                </div>
              </div>

              {/* Pitch Content */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pitch Content</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Problem Statement <span className="text-red-400">*</span></label>
                    <textarea rows={3} className={`${modalInputCls} resize-none`} value={editForm.problem} onChange={e => setEditForm(p => ({ ...p, problem: e.target.value }))} placeholder="What painful problem are you solving?" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Solution <span className="text-red-400">*</span></label>
                    <textarea rows={3} className={`${modalInputCls} resize-none`} value={editForm.solution} onChange={e => setEditForm(p => ({ ...p, solution: e.target.value }))} placeholder="How does your product uniquely solve this?" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Market Size</label>
                      <textarea rows={2} className={`${modalInputCls} resize-none`} value={editForm.marketSize} onChange={e => setEditForm(p => ({ ...p, marketSize: e.target.value }))} placeholder="TAM, SAM, SOM" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Business Model</label>
                      <textarea rows={2} className={`${modalInputCls} resize-none`} value={editForm.businessModel} onChange={e => setEditForm(p => ({ ...p, businessModel: e.target.value }))} placeholder="How do you make money?" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Supporting Materials (Edit) ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Update Supporting Materials</p>
                <p className="text-xs text-gray-400 mb-3">Leave blank to keep existing files. Upload a new file to replace.</p>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    {
                      icon: Video, label: "Video Pitch", hint: "MP4, MOV, AVI",
                      accept: "video/*", file: editVideoFile, setter: setEditDeckFile,
                      existingUrl: editingPitch.videoURL,
                      setterFn: setEditVideoFile,
                      hoverBorder: "group-hover:border-purple-400 group-hover:bg-purple-50/40",
                    },
                    {
                      icon: FileText, label: "Pitch Deck", hint: "PDF, PPT, PPTX",
                      accept: ".pdf,.ppt,.pptx", file: editDeckFile, setter: setEditDeckFile,
                      existingUrl: editingPitch.deckURL,
                      setterFn: setEditDeckFile,
                      hoverBorder: "group-hover:border-pink-400 group-hover:bg-pink-50/40",
                    },
                    {
                      icon: BarChart3, label: "Financial Model", hint: "Excel, CSV",
                      accept: ".csv,.xlsx,.xls", file: editFinancialFile, setter: setEditFinancialFile,
                      existingUrl: editingPitch.financialURL,
                      setterFn: setEditFinancialFile,
                      hoverBorder: "group-hover:border-purple-400 group-hover:bg-purple-50/40",
                    },
                  ].map(({ icon: Icon, label, hint, accept, file, existingUrl, setterFn, hoverBorder }) => (
                    <label key={label}
                      className={`group relative flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-purple-100 rounded-2xl p-4 cursor-pointer transition-all duration-200 bg-white/40 ${hoverBorder}`}>
                      <input type="file" accept={accept} className="hidden"
                        onChange={(e) => setterFn(e.target.files?.[0] || null)} />
                      <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Icon className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 text-center">{label}</span>
                      <span className="text-[10px] text-gray-400">{hint}</span>
                      {/* New file selected */}
                      {file ? (
                        <span className="flex items-center gap-1 text-[10px] text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full max-w-full">
                          <CheckCircle className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate max-w-[80px]">{file.name}</span>
                        </span>
                      ) : existingUrl ? (
                        /* Existing file on record */
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-2.5 w-2.5 shrink-0" />Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to upload</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-purple-100 bg-purple-50/30 rounded-b-2xl">
              <button onClick={() => setEditingPitch(null)} disabled={editSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-white transition-all disabled:opacity-50">
                Cancel
              </button>
              <div className="flex gap-3">
                <button onClick={() => handleEditSave(false)} disabled={editSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-purple-200 text-purple-700 font-semibold text-sm hover:bg-white transition-all duration-200 disabled:opacity-50">
                  {editSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
                <button onClick={() => handleEditSave(true)} disabled={editSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 shadow-md shadow-purple-200">
                  {editSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  Save & Resubmit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}