import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft, FileText, TrendingUp, Video, BarChart3,
  Download, ExternalLink, Loader2, Calendar, DollarSign,
  Target, Briefcase, Sparkles, CheckCircle2, Clock
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { db } from "../../../../../../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";


const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"];
const forceDownload = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};

export default function ReviewPitch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [founderInfo, setFounderInfo] = useState<any>(null);
  const [pitches, setPitches]         = useState<any[]>([]);
  const [evaluation, setEvaluation]   = useState<any>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const founderDoc  = await getDoc(doc(db, "myFounders", id!));
        const founderData = founderDoc.exists() ? founderDoc.data() : null;
        setFounderInfo(founderData);

        const founderEmail = founderData?.founderEmail || founderData?.founderName;
        const founderId    = founderData?.founderId || founderData?.uid;

        let snap = await getDocs(query(collection(db, "pitches"), where("founderId", "==", founderId || "__none__")));
        if (snap.empty && founderEmail)
          snap = await getDocs(query(collection(db, "pitches"), where("founderEmail", "==", founderEmail)));
        if (snap.empty)
          snap = await getDocs(collection(db, "pitches"));

        setPitches(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        const evalDoc = await getDoc(doc(db, "evaluations", id!));
        if (evalDoc.exists()) setEvaluation(evalDoc.data());
        else if (founderData?.evaluation) setEvaluation(founderData.evaluation);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
      <span className="text-purple-400 font-medium">Loading pitch data…</span>
    </div>
  );

  const chartData    = evaluation?.scores
    ? Object.entries(evaluation.scores).map(([name, value]: any) => ({ name, value }))
    : [];
  const founderName    = founderInfo?.founderName || founderInfo?.founder || id;
  const founderStartup = founderInfo?.startup || founderInfo?.startupName || "";
  const initials       = (founderName || "").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-600 font-medium text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Founders
        </button>

        {/* ── Hero Header Card ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-8 shadow-xl shadow-purple-200">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 left-20 w-32 h-32 rounded-full bg-pink-400/20" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold text-xl shadow-lg backdrop-blur">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={13} className="text-purple-200" />
                  <span className="text-purple-200 text-xs font-semibold tracking-widest uppercase">Pitch Review</span>
                </div>
                <h1 className="text-3xl font-bold text-white">{founderName}</h1>
                <p className="text-purple-100 text-sm font-medium mt-0.5">{founderStartup}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center border border-white/20">
                <p className="text-xl font-bold text-white">{pitches.length}</p>
                <p className="text-purple-200 text-xs mt-0.5 uppercase tracking-wider">Pitches</p>
              </div>
              <button
                onClick={() => navigate(`/mentor/evaluation/${id}`)}
                className="flex items-center gap-2 px-5 py-3 bg-white text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-50 transition-all shadow-lg"
              >
                <TrendingUp size={16} /> Evaluate Pitch
              </button>
            </div>
          </div>
        </div>

        {/* ── Pitches ── */}
        {pitches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-amber-100 p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-amber-400" />
            </div>
            <p className="text-gray-700 font-semibold">No pitches submitted yet</p>
            <p className="text-gray-400 text-sm mt-1">This founder hasn't uploaded a pitch deck.</p>
          </div>
        ) : (
          pitches.map((pitch) => (
            <div key={pitch.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-purple-50 transition-all overflow-hidden">

              {/* Pitch header */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-6 py-5 flex flex-wrap justify-between items-start gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{pitch.title || pitch.pitchTitle || "Untitled Pitch"}</h2>
                  <p className="text-purple-500 font-medium text-sm mt-0.5">{pitch.industry}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                  pitch.status === "Accepted" || pitch.status === "approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : pitch.status === "rejected"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                }`}>
                  {pitch.status === "Accepted" || pitch.status === "approved" ? "✓ " : ""}
                  {pitch.status || "Under Review"}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Meta grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <Briefcase size={15} className="text-purple-500" />, label: "Stage", value: pitch.stage || pitch.startupStage || "N/A", bg: "from-purple-50 to-violet-50", border: "border-purple-100" },
                    { icon: <DollarSign size={15} className="text-emerald-500" />, label: "Funding Goal", value: pitch.fundingGoal || "N/A", bg: "from-emerald-50 to-green-50", border: "border-emerald-100" },
                    { icon: <Target size={15} className="text-pink-500" />, label: "Market Size", value: pitch.marketSize || "N/A", bg: "from-pink-50 to-rose-50", border: "border-pink-100" },
                    { icon: <Calendar size={15} className="text-amber-500" />, label: "Submitted", value: pitch.submittedAt?.toDate ? pitch.submittedAt.toDate().toLocaleDateString() : pitch.submittedAt ? new Date(pitch.submittedAt).toLocaleDateString() : "N/A", bg: "from-amber-50 to-orange-50", border: "border-amber-100" },
                  ].map((item, i) => (
                    <div key={i} className={`bg-gradient-to-br ${item.bg} border ${item.border} rounded-xl p-3`}>
                      <div className="flex items-center gap-1.5 mb-1.5">{item.icon}<span className="text-xs text-gray-500 font-medium">{item.label}</span></div>
                      <p className="font-bold text-gray-800 text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Content sections */}
                {[
                  { label: "Business Model", value: pitch.businessModel },
                  { label: "Problem Statement", value: pitch.problem },
                  { label: "Solution", value: pitch.solution },
                ].filter(s => s.value).map((section, i) => (
                  <div key={i} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">{section.label}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{section.value}</p>
                  </div>
                ))}

                {/* Files */}
              {(pitch.videoURL || pitch.deckURL || pitch.financialURL) && (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Download size={15} className="text-purple-500" />
      <p className="text-sm font-bold text-gray-800">Uploaded Documents & Media</p>
    </div>
    <div className="grid sm:grid-cols-3 gap-4">
    {pitch.videoURL && (
  <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 p-4 space-y-3">
    <div className="flex items-center gap-2 text-purple-700 font-bold text-sm"><Video size={16} />Video Pitch</div>
    <div className="w-full h-40 rounded-xl bg-purple-100 flex items-center justify-center">
      <Video size={36} className="text-purple-300" />
    </div>
    <button onClick={() => forceDownload(pitch.videoURL, "video-pitch.mp4")}
      className="flex items-center gap-1.5 text-xs text-purple-600 font-medium hover:underline cursor-pointer">
      <Download size={12} />Download Video
    </button>
  </div>
)}
{pitch.deckURL && (
  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-3">
    <div className="flex items-center gap-2 text-blue-700 font-bold text-sm"><FileText size={16} />Pitch Deck</div>
    <div className="w-full h-40 rounded-xl bg-blue-100 flex items-center justify-center">
      <FileText size={36} className="text-blue-300" />
    </div>
    <button onClick={() => forceDownload(pitch.deckURL, "pitch-deck.pdf")}
      className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline cursor-pointer">
      <Download size={12} />Download Deck
    </button>
  </div>
)}
{pitch.financialURL && (
  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 p-4 space-y-3">
    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm"><BarChart3 size={16} />Financial Model</div>
    <div className="w-full h-40 rounded-xl bg-emerald-100 flex items-center justify-center">
      <BarChart3 size={36} className="text-emerald-300" />
    </div>
    <button onClick={() => forceDownload(pitch.financialURL, "financial-model.csv")}
      className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium hover:underline cursor-pointer">
      <Download size={12} />Download Financial Model
    </button>
  </div>
)}
    </div>
  </div>
)}
                {!pitch.videoURL && !pitch.deckURL && !pitch.financialURL && (
                  <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-4">No supporting documents uploaded for this pitch.</p>
                )}
              </div>
            </div>
          ))
        )}

        {/* ── Evaluation Section ── */}
        {evaluation ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-purple-500" />
              <h2 className="text-lg font-bold text-gray-900">Evaluation Results</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-50">
                <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-4">Score Distribution</p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" outerRadius={95} innerRadius={45} paddingAngle={3} label>
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Score cards */}
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-6 text-white shadow-lg shadow-purple-200 text-center">
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-purple-100 mb-2">Total Score</p>
                  <p className="text-7xl font-black leading-none">{evaluation.percentage || evaluation.totalScore}<span className="text-3xl">%</span></p>
                  <span className="inline-block mt-3 px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold border border-white/30">
                    {evaluation.status}
                  </span>
                </div>

                {evaluation.scores && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 space-y-3">
                    {Object.entries(evaluation.scores).map(([key, val]: any) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                          <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                          <span className="font-bold text-purple-600">{val}<span className="text-gray-400 font-normal">/20</span></span>
                        </div>
                        <div className="w-full bg-purple-50 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-700" style={{ width: `${(val / 20) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {evaluation.comments && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">Mentor Comments</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{evaluation.comments}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-purple-100 p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock size={18} className="text-purple-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">No evaluation yet</p>
                <p className="text-gray-400 text-xs">Complete an evaluation to track this founder's readiness.</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/mentor/evaluation/${id}`)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:opacity-90 hover:shadow-lg hover:shadow-purple-200 transition-all"
            >
              Start Evaluation →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}