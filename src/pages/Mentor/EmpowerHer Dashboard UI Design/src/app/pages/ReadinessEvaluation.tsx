import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertCircle, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { db } from "../../../../../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const criteria = [
  { key: "businessModel",    label: "Business Model",    description: "Scalability and revenue clarity",  emoji: "🏗️",  color: "from-violet-500 to-purple-600",  light: "from-violet-50 to-purple-50",  border: "border-violet-100",  text: "text-violet-600" },
  { key: "marketValidation", label: "Market Validation", description: "Customer traction & demand proof",  emoji: "📊",  color: "from-purple-500 to-pink-500",    light: "from-purple-50 to-pink-50",    border: "border-purple-100",  text: "text-purple-600" },
  { key: "financialPlanning",label: "Financial Planning",description: "Unit economics & projections",      emoji: "💰",  color: "from-pink-500 to-rose-500",      light: "from-pink-50 to-rose-50",      border: "border-pink-100",    text: "text-pink-600"   },
  { key: "teamStrength",     label: "Team Strength",     description: "Execution capability & experience", emoji: "👥",  color: "from-indigo-500 to-violet-500",  light: "from-indigo-50 to-violet-50",  border: "border-indigo-100",  text: "text-indigo-600" },
  { key: "pitchQuality",     label: "Pitch Quality",     description: "Clarity & persuasiveness",          emoji: "🎯",  color: "from-fuchsia-500 to-pink-600",   light: "from-fuchsia-50 to-pink-50",   border: "border-fuchsia-100", text: "text-fuchsia-600"},
];

export default function ReadinessEvaluation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scores, setScores] = useState({ businessModel: 15, marketValidation: 14, financialPlanning: 16, teamStrength: 18, pitchQuality: 17 });
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  const totalScore  = Object.values(scores).reduce((s, v) => s + v, 0);
  const percentage  = totalScore;

  const getStatus = () => {
    if (percentage >= 80) return { label: "Funding Ready", color: "emerald", icon: "🚀" };
    if (percentage >= 60) return { label: "Improving",     color: "amber",   icon: "📈" };
    return                       { label: "Early Stage",   color: "rose",    icon: "🌱" };
  };
  const status = getStatus();

  const getScoreRing = (val: number) => {
    const pct = (val / 20) * 100;
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "evaluations", id), { founderId: id, scores, totalScore, percentage, status: status.label, comments, evaluatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, "myFounders", id), { evaluation: { scores, percentage, status: status.label, comments } }, { merge: true });
      navigate(`/mentor/progress/${id}`);
    } catch (err) { console.error(err); alert("Failed to save. Check console."); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-600 font-medium text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-8 shadow-xl shadow-purple-200">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 left-10 w-36 h-36 rounded-full bg-pink-400/20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-purple-200" />
              <span className="text-purple-200 text-xs font-semibold tracking-widest uppercase">Mentor Tools</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Startup Readiness Evaluation</h1>
            <p className="text-purple-100 mt-1 text-sm">Score each area 0–20 to assess investor readiness</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Sliders ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Criteria */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-6 py-4">
                <h2 className="font-bold text-gray-900 text-base">Evaluation Criteria</h2>
                <p className="text-xs text-gray-400 mt-0.5">Drag each slider to assign a score</p>
              </div>

              <div className="p-6 space-y-6">
                {criteria.map((c) => {
                  const val = scores[c.key as keyof typeof scores];
                  const pct = (val / 20) * 100;
                  return (
                    <div key={c.key} className={`rounded-2xl bg-gradient-to-br ${c.light} border ${c.border} p-5`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{c.emoji}</span>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">{c.label}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className={`text-3xl font-black ${getScoreRing(val)}`}>{val}</span>
                          <span className="text-gray-400 text-sm font-normal">/20</span>
                        </div>
                      </div>

                      {/* Progress track */}
                      <div className="w-full bg-white/70 rounded-full h-2 mb-3 shadow-inner">
                        <div
                          className={`bg-gradient-to-r ${c.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <input
                        type="range" min="0" max="20"
                        value={val}
                        onChange={e => setScores(p => ({ ...p, [c.key]: parseInt(e.target.value) }))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-6 py-4">
                <h2 className="font-bold text-gray-900 text-base">Mentor Feedback</h2>
                <p className="text-xs text-gray-400 mt-0.5">Your detailed notes will be shared with the founder</p>
              </div>
              <div className="p-6">
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className="w-full p-4 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50/30 text-gray-700 text-sm placeholder-gray-300 resize-none transition-all"
                  rows={5}
                  placeholder="Share your observations, strengths, and areas for improvement…"
                />
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 text-white font-bold text-base hover:opacity-95 hover:shadow-xl hover:shadow-purple-200 transition-all flex items-center justify-center gap-3 disabled:opacity-60 shadow-lg shadow-purple-200"
            >
              {saving
                ? <><Loader2 size={18} className="animate-spin" />Saving Evaluation…</>
                : <><CheckCircle2 size={18} />Save Evaluation & View Progress</>
              }
            </button>
          </div>

          {/* ── RIGHT: Live Score ── */}
          <div className="space-y-5">

            {/* Big score card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 p-6 text-white shadow-xl shadow-purple-200">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full bg-pink-400/20" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-purple-200 mb-4">Live Score</p>

                {/* Circular ring (CSS only) */}
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="white" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(percentage / 100) * 263.9} 263.9`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black leading-none">{totalScore}</span>
                      <span className="text-purple-200 text-xs font-medium">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <span className={`inline-block text-sm font-bold px-5 py-2 rounded-full bg-white/20 border border-white/30`}>
                    {status.icon} {status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Readiness status */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Readiness Breakdown</p>
              <div className={`rounded-xl p-4 text-center font-bold text-sm border ${
                status.color === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                status.color === "amber"   ? "bg-amber-50  text-amber-700  border-amber-200"   :
                                             "bg-rose-50   text-rose-700   border-rose-200"
              }`}>
                {status.icon} {status.label}
              </div>

              <div className="mt-4 space-y-2">
                {criteria.map(c => {
                  const val = scores[c.key as keyof typeof scores];
                  return (
                    <div key={c.key} className="flex items-center gap-2">
                      <span className="text-sm">{c.emoji}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`bg-gradient-to-r ${c.color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${(val / 20) * 100}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${c.text} w-6 text-right`}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tip */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle size={15} className="text-purple-500" />
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">
                  Scores above <span className="font-bold">80%</span> are typically recommended for funding consideration. Be thorough and honest in your evaluation.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}