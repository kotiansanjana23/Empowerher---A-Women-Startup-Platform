import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Loader2, TrendingUp, Bot,
  Send, RefreshCw, Rocket, CheckCircle2, ChevronDown,
  Target, Zap, AlertTriangle,
} from "lucide-react";
import { db } from "../../../../../../firebase";
import {
  doc, getDoc, setDoc, serverTimestamp, getDocs, collection,
} from "firebase/firestore";

export default function FounderProgress() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [founderData,        setFounderData]        = useState<any>(null);
  const [evaluation,         setEvaluation]          = useState<any>(null);
  const [allFounders,        setAllFounders]         = useState<any[]>([]);
  const [selectedId,         setSelectedId]          = useState<string>(id || "");
  const [loading,            setLoading]             = useState(true);
  const [animatedScore,      setAnimatedScore]       = useState(0);
  const [recommendedSuccess, setRecommendedSuccess]  = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setRecommendedSuccess(false);
      try {
        const allSnap = await getDocs(collection(db, "myFounders"));
        const seenIds   = new Set<string>();
        const seenNames = new Set<string>();
        const founderList: any[] = [];

        allSnap.docs.forEach(d => {
          const data  = d.data();
          const name  = (data.founderName || data.founder || data.name || d.id).trim();
          const hasSaved = !!data.mentorHubSaved;
          const hasEval  = !!data.evaluation || !!data.percentage || !!data.totalScore;

          if ((hasSaved || hasEval) && !seenIds.has(d.id) && !seenNames.has(name.toLowerCase())) {
            seenIds.add(d.id);
            seenNames.add(name.toLowerCase());
            founderList.push({ id: d.id, founderName: name, startup: data.startup || data.startupName || "" });
          }
        });

        setAllFounders(founderList);

        let targetId = selectedId || id || "";
        if (!targetId && founderList.length > 0) { targetId = founderList[0].id; setSelectedId(targetId); }
        if (!targetId) { setLoading(false); return; }

        const founderDoc = await getDoc(doc(db, "myFounders", targetId));
        if (founderDoc.exists()) setFounderData({ id: founderDoc.id, ...founderDoc.data() });
        else setFounderData({ id: targetId, founderName: targetId, startup: "" });

        const evalDoc = await getDoc(doc(db, "evaluations", targetId));
        if (evalDoc.exists()) setEvaluation(evalDoc.data());
        else if (founderDoc.exists() && founderDoc.data()?.evaluation) setEvaluation(founderDoc.data()?.evaluation);
        else setEvaluation(null);

      } catch (err) {
        console.error("Failed to load founder progress:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const readiness = Number(evaluation?.percentage ?? evaluation?.totalScore) || 0;

  useEffect(() => {
    if (readiness === 0) return;
    setAnimatedScore(0);
    const step = Math.ceil(readiness / 50);
    const interval = setInterval(() => {
      setAnimatedScore(prev => {
        if (prev + step >= readiness) { clearInterval(interval); return readiness; }
        return prev + step;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [readiness]);

  const handleSelectChange = (newId: string) => {
    setSelectedId(newId);
    navigate(`/mentor/progress/${newId}`, { replace: true });
  };

  const scores   = evaluation?.scores   || {};
  const comments = evaluation?.comments || "";
  const status   = evaluation?.status   || "";

  const milestones: Record<string, number> = {
    Product:  Math.min(readiness + 5,  100),
    Traction: Math.max(readiness - 5,  0),
    Revenue:  Math.max(readiness - 15, 0),
    Branding: Math.min(readiness + 10, 100),
    Pitch:    Math.min(readiness + 8,  100),
  };

  const avgMomentum = Math.round(Object.values(milestones).reduce((a, b) => a + b, 0) / Object.values(milestones).length);
  const strongest   = Object.entries(milestones).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const weakest     = Object.entries(milestones).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "—";

  let performanceLabel = "No evaluation yet";
  let aiMessage        = "Complete the readiness evaluation to see AI-powered insights here.";
  let signalType: "none" | "strong" | "mid" | "low" = "none";

  if (readiness >= 80) {
    performanceLabel = "Strong investment signal";
    signalType = "strong";
    aiMessage = "This founder is highly funding-ready with strong execution across milestones. Product-market fit is clearly established. Recommend strengthening revenue diversity before the formal investor pitch to maximise valuation.";
  } else if (readiness >= 65) {
    performanceLabel = "Improving & scaling";
    signalType = "mid";
    aiMessage = "Founder shows consistent growth. Focus on strengthening revenue and traction before pitching investors.";
  } else if (readiness > 0) {
    performanceLabel = "Needs strategic improvement";
    signalType = "low";
    aiMessage = "Founder requires milestone improvement before a funding recommendation. Prioritise traction and revenue channels.";
  }

  const milestoneColors: Record<string, string> = {
    Product:  "#534AB7",
    Branding: "#7F77DD",
    Pitch:    "#AFA9EC",
    Traction: "#3C3489",
    Revenue:  "#993556",
  };

  const handleRecommend = async () => {
    if (!selectedId) return;
    try {
      await setDoc(doc(db, "myFounders", selectedId), { status: "recommended", recommendedAt: serverTimestamp() }, { merge: true });
      setRecommendedSuccess(true);
      setTimeout(() => setRecommendedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to recommend. Please try again.");
    }
  };

  const circumference = 2 * Math.PI * 58;
  const ringOffset    = circumference * (1 - animatedScore / 100);

  const signalConfig = {
    none:   { bg: "bg-gray-100",          text: "text-gray-500",    border: "border-gray-200",    dot: "bg-gray-400" },
    strong: { bg: "bg-[#EAF3DE]",         text: "text-[#27500A]",   border: "border-[#97C459]",   dot: "bg-[#639922]" },
    mid:    { bg: "bg-[#FAEEDA]",         text: "text-[#633806]",   border: "border-[#FAC775]",   dot: "bg-[#BA7517]" },
    low:    { bg: "bg-[#FCEBEB]",         text: "text-[#791F1F]",   border: "border-[#F09595]",   dot: "bg-[#A32D2D]" },
  }[signalType];

const ringColor = signalType === "strong" ? "#534AB7" : signalType === "mid" ? "#BA7517" : signalType === "low" ? "#A32D2D" : "#534AB7";
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-purple-100 border-t-purple-500 animate-spin" />
        </div>
        <span className="text-sm text-gray-400 font-medium">Loading founder progress...</span>
      </div>
    );
  }

  const founderInitials = (founderData?.founderName || founderData?.founder || selectedId || "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F4FE] p-5">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* ── Top bar ── */}
        <div className="flex justify-between items-center py-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-700 transition-colors font-medium"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="relative">
            <select
              value={selectedId}
              onChange={e => handleSelectChange(e.target.value)}
              className="appearance-none text-sm pl-4 pr-8 py-2 border border-purple-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm font-medium cursor-pointer"
            >
              {allFounders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.founderName}{f.startup ? ` — ${f.startup}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Success banner ── */}
        {recommendedSuccess && (
          <div className="flex items-center gap-3 bg-[#EAF3DE] border border-[#97C459] text-[#27500A] text-sm px-5 py-3 rounded-2xl shadow-sm">
            <CheckCircle2 size={16} className="shrink-0 text-[#639922]" />
            <span><strong>{founderData?.founderName || selectedId}</strong> has been recommended for funding!</span>
            <button onClick={() => navigate("/mentor/funding-match")} className="ml-auto text-xs underline underline-offset-2 hover:no-underline whitespace-nowrap font-semibold">
              Go to Funding Match →
            </button>
          </div>
        )}

        {/* ── Hero card ── */}
        <div className="relative bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          {/* Purple accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#534AB7] via-[#7F77DD] to-[#AFA9EC]" />

          <div className="px-8 pt-8 pb-7">
            <div className="flex justify-between items-start flex-wrap gap-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-[#EEEDFE] border border-[#AFA9EC]/30 flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-[#534AB7]">{founderInitials}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    {founderData?.founderName || founderData?.founder || selectedId}
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
                    {founderData?.startup || "—"}
                    {status && <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />}
                    {status && <span>{status}</span>}
                  </p>
                  {readiness > 0 && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg mt-3 border ${signalConfig.bg} ${signalConfig.text} ${signalConfig.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${signalConfig.dot}`} />
                      {performanceLabel}
                    </span>
                  )}
                  {!evaluation && (
                    <div className="mt-4 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                        <AlertTriangle size={12} /> No evaluation saved yet
                      </span>
                      <button onClick={() => navigate(`/mentor/evaluation/${selectedId}`)} className="text-xs px-3 py-2 bg-[#534AB7] text-white rounded-xl hover:bg-[#3C3489] transition font-medium">
                        Evaluate now →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Last evaluated</p>
                <p className="text-sm font-semibold text-gray-700">
                  {evaluation?.evaluatedAt
                    ? new Date(evaluation.evaluatedAt?.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </p>
                {readiness > 0 && (
                  <div className="mt-3 flex items-center justify-end gap-1.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 w-5 rounded-full ${i <= Math.ceil(readiness / 20) ? "bg-[#534AB7]" : "bg-[#EEEDFE]"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 ml-1">{readiness}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Score ring + Milestones ── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Ring card */}
          <div className="bg-white rounded-3xl border border-purple-100 p-7 flex flex-col items-center shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-6 font-medium">Funding readiness</p>

            <div className="relative w-40 h-40 mb-6">
              {/* Faint decorative ring */}
              <svg viewBox="0 0 160 160" className="absolute inset-0 w-40 h-40" aria-hidden="true">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#EEEDFE" strokeWidth="2" strokeDasharray="6 4" />
              </svg>
              <svg viewBox="0 0 160 160" className="w-40 h-40 -rotate-90" aria-hidden="true">
                <circle cx="80" cy="80" r="58" fill="none" stroke="#F3F2FD" strokeWidth="14" />
                <circle
                  cx="80" cy="80" r="58" fill="none"
                  stroke={ringColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-[#3C3489]">{animatedScore}<span className="text-2xl">%</span></span>
                <span className="text-[11px] text-gray-400 mt-0.5 font-medium tracking-wide">funding ready</span>
              </div>
            </div>

            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              <div className="rounded-2xl p-3.5 text-center bg-[#EEEDFE]">
                <div className="flex items-center justify-center mb-1.5">
                  <Zap size={11} className="text-[#534AB7]" />
                </div>
                <p className="text-[10px] text-[#534AB7] mb-1 font-semibold uppercase tracking-wide">Momentum</p>
                <p className="text-xl font-bold text-[#3C3489]">{readiness > 0 ? `${avgMomentum}%` : "—"}</p>
              </div>
              <div className="rounded-2xl p-3.5 text-center bg-[#EAF3DE]">
                <div className="flex items-center justify-center mb-1.5">
                  <TrendingUp size={11} className="text-[#3B6D11]" />
                </div>
                <p className="text-[10px] text-[#3B6D11] mb-1 font-semibold uppercase tracking-wide">Strongest</p>
                <p className="text-sm font-bold text-[#27500A]">{readiness > 0 ? strongest : "—"}</p>
              </div>
              <div className="rounded-2xl p-3.5 text-center bg-[#FCEBEB]">
                <div className="flex items-center justify-center mb-1.5">
                  <Target size={11} className="text-[#A32D2D]" />
                </div>
                <p className="text-[10px] text-[#A32D2D] mb-1 font-semibold uppercase tracking-wide">Focus</p>
                <p className="text-sm font-bold text-[#791F1F]">{readiness > 0 ? weakest : "—"}</p>
              </div>
            </div>
          </div>

          {/* Milestone bars */}
          <div className="bg-white rounded-3xl border border-purple-100 p-7 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-5 font-medium">Milestone breakdown</p>
            <div className="space-y-4">
              {Object.entries(milestones).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-semibold">{key}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: milestoneColors[key], backgroundColor: milestoneColors[key] + "15" }}>
                      {val}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#F3F2FD] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 relative"
                      style={{ width: `${val}%`, backgroundColor: milestoneColors[key] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Evaluation score breakdown ── */}
        {Object.keys(scores).length > 0 && (
          <div className="bg-white rounded-3xl border border-purple-100 p-7 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-5 font-medium">Score breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(scores).map(([key, val]: any) => (
                <div key={key} className="relative rounded-2xl p-4 text-center bg-[#F8F8FE] border border-[#EEEDFE] overflow-hidden group hover:border-[#AFA9EC] transition-colors">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#534AB7]" style={{ opacity: val / 20 }} />
                  <p className="text-[11px] text-[#7F77DD] mb-2 capitalize font-semibold leading-tight">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-3xl font-bold text-[#3C3489]">{val}</p>
                  <p className="text-[11px] text-[#AFA9EC] mt-0.5 font-medium">/ 20</p>
                </div>
              ))}
            </div>
            {comments && (
              <div className="mt-5 bg-[#F8F8FE] rounded-2xl border border-[#EEEDFE] p-4">
                <p className="text-xs text-[#7F77DD] mb-1.5 font-semibold uppercase tracking-wide">Mentor comments</p>
                <p className="text-sm text-gray-600 leading-relaxed">{comments}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Mentor strategy ── */}
        {founderData?.mentorHub && (
          <div className="bg-white rounded-3xl border border-purple-100 p-7 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-medium flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#7F77DD]" /> Mentor strategy
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
              {founderData.mentorHub.meetingDate && (
                <div className="bg-[#F3F2FD] rounded-2xl px-4 py-3.5 border border-[#EEEDFE]">
                  <p className="text-[10px] text-[#7F77DD] uppercase tracking-wider mb-1 font-semibold">Next session</p>
                  <p className="font-semibold text-[#3C3489]">{founderData.mentorHub.meetingDate} · {founderData.mentorHub.meetingTime}</p>
                </div>
              )}
              {founderData.mentorHub.agenda && (
                <div className="bg-[#F3F2FD] rounded-2xl px-4 py-3.5 border border-[#EEEDFE] sm:col-span-2">
                  <p className="text-[10px] text-[#7F77DD] uppercase tracking-wider mb-1 font-semibold">Session goals</p>
                  <p className="leading-relaxed whitespace-pre-line text-gray-600">{founderData.mentorHub.agenda}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Growth Intelligence ── */}
        <div className="bg-white rounded-3xl border border-purple-100 p-7 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-medium flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#7F77DD]" /> Growth intelligence
          </p>

          <div className="flex items-center gap-2.5 mb-4">
            <span className={`w-2 h-2 rounded-full ${signalConfig.dot}`} />
            <p className={`text-sm font-bold ${signalConfig.text}`}>{performanceLabel}</p>
          </div>

          {readiness > 0 && (
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Founder shows strong execution across key milestones with above-average traction metrics.
            </p>
          )}

          <div className="rounded-2xl p-5 bg-[#EEEDFE] border border-[#AFA9EC]/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-[#534AB7] flex items-center justify-center shrink-0">
                <Bot size={13} className="text-white" />
              </div>
              <p className="text-xs font-bold text-[#3C3489] uppercase tracking-wide">AI mentor insight</p>
            </div>
            <p className="text-sm text-[#534AB7] leading-relaxed">{aiMessage}</p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-center gap-3 pb-8">
          <button
            onClick={() => navigate(`/mentor/evaluation/${selectedId}`)}
            className="flex items-center gap-2 px-6 py-3 text-sm border-2 border-[#534AB7] text-[#534AB7] rounded-2xl font-semibold hover:bg-[#EEEDFE] transition-colors"
          >
            <RefreshCw size={14} /> Re-evaluate
          </button>
          <button
            onClick={handleRecommend}
            disabled={readiness === 0}
            className="flex items-center gap-2 px-7 py-3 text-sm bg-[#534AB7] text-white rounded-2xl font-semibold hover:bg-[#3C3489] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
          >
            <Send size={14} /> Recommend for funding
          </button>
        </div>

      </div>
    </div>
  );
}