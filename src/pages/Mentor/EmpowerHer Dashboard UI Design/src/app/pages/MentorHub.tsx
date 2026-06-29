import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../../firebase";
import {
  ArrowLeft, Target, StickyNote, CheckCircle2,
  Calendar, Clock, Youtube, FileText, Sparkles,
  Save, ChevronRight, BookOpen,
} from "lucide-react";

export default function MentorHub() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [founder,           setFounder]           = useState<any>(null);
  const [showScheduler,     setShowScheduler]     = useState(false);
  const [meetingDate,       setMeetingDate]       = useState("");
  const [meetingTime,       setMeetingTime]       = useState("");
  const [meetingScheduled,  setMeetingScheduled]  = useState(false);
  const [agenda,            setAgenda]            = useState("");
  const [notes,             setNotes]             = useState("");
  const [youtubeLink,       setYoutubeLink]       = useState("");
  const [pdfLink,           setPdfLink]           = useState("");
  const [saving,            setSaving]            = useState(false);
  const [saved,             setSaved]             = useState(false);

  useEffect(() => {
    const fetchFounder = async () => {
      try {
        const docSnap = await getDoc(doc(db, "myFounders", id!));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFounder(data);
          if (data.mentorHub) {
            setMeetingDate(data.mentorHub.meetingDate   || "");
            setMeetingTime(data.mentorHub.meetingTime   || "");
            setAgenda(data.mentorHub.agenda             || "");
            setNotes(data.mentorHub.notes               || "");
            setYoutubeLink(data.mentorHub.youtubeLink   || "");
            setPdfLink(data.mentorHub.pdfLink           || "");
            if (data.mentorHub.meetingDate) setMeetingScheduled(true);
          }
        }
      } catch (err) { console.error(err); }
    };
    if (id) fetchFounder();
  }, [id]);

  const handleSchedule = () => {
    if (!meetingDate || !meetingTime) { alert("Please select date and time"); return; }
    setMeetingScheduled(true);
    setShowScheduler(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "myFounders", id!), {
        // FIX: write mentorHubSaved flag so FounderProgress always detects this founder
        mentorHubSaved: true,
        mentorHub: {
          meetingDate,
          meetingTime,
          agenda,
          notes,
          youtubeLink,
          pdfLink,
          savedAt: new Date().toISOString(),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials =
    founder?.founderName
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "…";

  if (!founder) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
      <span className="text-purple-400 font-medium">Loading hub…</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-7">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-600 font-medium text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Founders
        </button>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-8 shadow-xl shadow-purple-200">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 left-10 w-40 h-40 rounded-full bg-pink-400/20" />
          <div className="absolute top-6 right-40 w-12 h-12 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-wrap items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold text-xl shadow-lg backdrop-blur shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={13} className="text-purple-200" />
                <span className="text-purple-200 text-xs font-semibold tracking-widest uppercase">Mentor Hub</span>
              </div>
              <h1 className="text-3xl font-bold text-white truncate">Mentor Strategy Dashboard</h1>
              <p className="text-purple-100 text-sm mt-0.5 truncate">
                Guiding <span className="font-bold text-white">{founder.founderName}</span> · {founder.startup}
              </p>
            </div>

            {meetingScheduled && (
              <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3 border border-white/20 text-center shrink-0">
                <p className="text-white text-xs font-semibold uppercase tracking-wider mb-0.5">Next Session</p>
                <p className="text-white font-bold text-sm">{meetingDate}</p>
                <p className="text-purple-200 text-xs">{meetingTime}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Progress Stepper ── */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { label: "Schedule Session", done: meetingScheduled },
              { label: "Set Goals",        done: agenda.length > 0 },
              { label: "Add Resources",    done: !!(youtubeLink || pdfLink) },
              { label: "Write Notes",      done: notes.length > 0 },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step.done
                    ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
                    : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}>
                  {step.done
                    ? <CheckCircle2 size={12} className="text-purple-500" />
                    : <span className="w-3 h-3 rounded-full border-2 border-gray-300 inline-block" />
                  }
                  {step.label}
                </div>
                {i < arr.length - 1 && <ChevronRight size={14} className="text-gray-200 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">

          {/* ── Session Scheduler ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Calendar size={15} className="text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Strategy Session</h2>
                <p className="text-xs text-gray-400">Schedule your next mentorship call</p>
              </div>
            </div>
            <div className="p-6">
              {!meetingScheduled && !showScheduler && (
                <button
                  onClick={() => setShowScheduler(true)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-purple-200 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={16} /> Plan Next Strategy Session
                </button>
              )}

              {showScheduler && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Date</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                        <input
                          type="date" value={meetingDate}
                          onChange={e => setMeetingDate(e.target.value)}
                          className="w-full pl-8 pr-3 py-3 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Time</label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                        <input
                          type="time" value={meetingTime}
                          onChange={e => setMeetingTime(e.target.value)}
                          className="w-full pl-8 pr-3 py-3 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/30"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSchedule}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={15} /> Confirm Session
                  </button>
                </div>
              )}

              {meetingScheduled && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                      <CheckCircle2 size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">Session Confirmed</p>
                      <p className="text-emerald-700 text-xs font-medium mt-0.5">{meetingDate} at {meetingTime}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full shrink-0">Upcoming</span>
                  </div>
                  <button
                    onClick={() => { setMeetingScheduled(false); setShowScheduler(true); }}
                    className="w-full py-2.5 rounded-xl border border-purple-100 text-purple-500 text-xs font-semibold hover:bg-purple-50 transition-all"
                  >
                    Reschedule
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Session Goals ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                <Target size={15} className="text-pink-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Session Goals</h2>
                <p className="text-xs text-gray-400">Define targets for this session</p>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={agenda} onChange={e => setAgenda(e.target.value)} rows={6}
                className="w-full border border-purple-100 rounded-xl p-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/20 resize-none leading-relaxed"
                placeholder="• Define 3 growth targets for this quarter&#10;• Review product-market fit metrics&#10;• Identify key hiring needs…"
              />
            </div>
          </div>

          {/* ── Strategic Resources ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                <BookOpen size={15} className="text-violet-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Strategic Resources</h2>
                <p className="text-xs text-gray-400">Share links and materials with your founder</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">YouTube Resource</label>
                <div className="relative">
                  <Youtube size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
                  <input
                    type="text" placeholder="https://youtube.com/watch?v=..."
                    value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/20 placeholder-gray-300"
                  />
                </div>
                {youtubeLink && (
                  <a href={youtubeLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-purple-500 hover:underline font-medium">
                    <ChevronRight size={11} /> Preview link
                  </a>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">PDF / Document</label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="text" placeholder="https://drive.google.com/..."
                    value={pdfLink} onChange={e => setPdfLink(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/20 placeholder-gray-300"
                  />
                </div>
                {pdfLink && (
                  <a href={pdfLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-purple-500 hover:underline font-medium">
                    <ChevronRight size={11} /> Preview link
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Private Notes ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                <StickyNote size={15} className="text-fuchsia-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Private Mentor Notes</h2>
                <p className="text-xs text-gray-400">Confidential — only visible to you</p>
              </div>
              <span className="ml-auto text-xs px-2.5 py-1 bg-fuchsia-50 text-fuchsia-600 rounded-full border border-fuchsia-100 font-semibold">Private</span>
            </div>
            <div className="p-6">
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)} rows={6}
                className="w-full border border-purple-100 rounded-xl p-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-fuchsia-50/10 resize-none leading-relaxed"
                placeholder="Confidential strategy observations, red flags, strengths to develop…"
              />
            </div>
          </div>
        </div>

        {/* ── Save Button ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg ${
            saved
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-200 text-white"
              : "bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 shadow-purple-200 text-white hover:opacity-95 hover:shadow-xl hover:shadow-purple-200"
          } disabled:opacity-60`}
        >
          {saving
            ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
            : saved
            ? <><CheckCircle2 size={18} />Strategy Saved!</>
            : <><Save size={18} />Save Mentor Strategy</>
          }
        </button>

      </div>
    </div>
  );
}