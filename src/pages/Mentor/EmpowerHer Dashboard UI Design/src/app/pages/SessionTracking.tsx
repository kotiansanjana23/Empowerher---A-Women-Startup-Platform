import { useState, useEffect } from "react";
import { db, auth } from "../../../../../../firebase";
import {
  collection, addDoc, onSnapshot, query,
  where, doc, updateDoc, serverTimestamp, getDocs, deleteDoc, setDoc
} from "firebase/firestore";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  Video, Plus, CheckCircle2, X, Copy, Trash2,
  ExternalLink, Loader2, Zap, Users, Sparkles, Radio, ListChecks, Gauge,
} from "lucide-react";

/* ── Types ── */
interface Session {
  id: string;
  mentorId: string;
  mentorEmail: string;
  founderEmail: string;
  founderName: string;
  topic: string;
  roomName: string;
  meetingLink: string;
  totalSessions: number;
  completedSessions: number;
  status: "planned" | "live" | "completed";
  createdAt: any;
}

/* ── Helpers ── */
function generateRoom(): { roomName: string; meetingLink: string } {
  const roomName = `empowerher-${Date.now()}`;
  return { roomName, meetingLink: `https://meet.jit.si/${roomName}` };
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

const getInitials = (name: string) =>
  (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function SessionHub() {
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [founders, setFounders]       = useState<any[]>([]);
  const [showModal, setShowModal]     = useState(false);
  const [creating, setCreating]       = useState(false);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<Session | null>(null);

  const [form, setForm] = useState({
    founderEmail: "",
    founderName: "",
    topic: "",
    totalSessions: 5,
  });

  /* ── Load accepted founders from myFounders ── */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "myFounders"),
      (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          founderName: d.data().founderName || d.data().founder || d.id,
          founderEmail: d.data().founderEmail || d.data().email || "",
          startup: d.data().startup || d.data().startupName || "",
          ...d.data(),
        }));
        setFounders(data);
      }
    );
    return () => unsub();
  }, []);

  /* ── Real-time sessions listener ── */
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const q = query(
      collection(db, "mentorSessions"),
      where("mentorId", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Session[];

      // Sort: live first, then planned, then completed
      data.sort((a, b) => {
        const order = { live: 0, planned: 1, completed: 2 };
        return order[a.status] - order[b.status];
      });

      setSessions(data);
    });

    return () => unsub();
  }, []);

  /* ── Create session ── */
  const handleCreate = async () => {
    if (!form.founderEmail || !form.totalSessions) return;
    setCreating(true);
    try {
      const { roomName, meetingLink } = generateRoom();

      const docRef = await addDoc(collection(db, "mentorSessions"), {
        mentorId:           auth.currentUser?.uid,
        mentorEmail:        auth.currentUser?.email,
        founderEmail:       form.founderEmail,
        founderName:        form.founderName,
        topic:              form.topic,
        roomName,
        meetingLink,
        totalSessions:      Number(form.totalSessions),
        completedSessions:  0,
        status:             "planned",
        createdAt:          serverTimestamp(),
      });

      const newSession: Session = {
        id: docRef.id,
        mentorId: auth.currentUser?.uid || "",
        mentorEmail: auth.currentUser?.email || "",
        founderEmail: form.founderEmail,
        founderName: form.founderName,
        topic: form.topic,
        roomName,
        meetingLink,
        totalSessions: Number(form.totalSessions),
        completedSessions: 0,
        status: "planned",
        createdAt: null,
      };

      // ===============================
      // Mirror the scheduled session into the founder's chat
      // ===============================

      const chatId = [
        auth.currentUser?.uid,
        form.founderEmail
      ]
        .sort()
        .join("_");

      await setDoc(
        doc(db, "mentorChats", chatId),
        {
          founderEmail: form.founderEmail,
          founderName: form.founderName,

          mentorId: auth.currentUser?.uid,
          mentorEmail: auth.currentUser?.email,

          lastMessage: "📅 Mentoring session scheduled",
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(
        collection(db, "chats", chatId, "messages"),
        {
          type: "meeting",

          text: "📅 Mentoring session scheduled",

          meetingLink,

          topic: form.topic,

          senderId: auth.currentUser?.uid,

          senderEmail: auth.currentUser?.email,

          createdAt: serverTimestamp(),
        }
      );

      // ===============================

      setJustCreated(newSession);

      setShowModal(false);

      setForm({
        founderEmail: "",
        founderName: "",
        topic: "",
        totalSessions: 5
      });
    } catch (err) {
      console.error("Failed to create session:", err);
      alert("Failed to create session. Check console.");
    } finally {
      setCreating(false);
    }
  };

  /* ── Start session (go live) ── */
  const handleStartSession = async (session: Session) => {
    await updateDoc(doc(db, "mentorSessions", session.id), { status: "live" });
    window.open(session.meetingLink, "_blank");
  };

  /* ── Mark one session done ── */
  const handleMarkDone = async (session: Session) => {
    if (session.completedSessions >= session.totalSessions) return;
    const next = session.completedSessions + 1;
    await updateDoc(doc(db, "mentorSessions", session.id), {
      completedSessions: next,
      status: next >= session.totalSessions ? "completed" : "planned",
    });
  };

  /* ── Permanently delete a session ── */
  const handleDelete = async (session: Session) => {
    const confirmed = window.confirm(
      `Permanently delete session with ${session.founderName}? This cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingId(session.id);
    try {
      await deleteDoc(doc(db, "mentorSessions", session.id));
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Failed to delete. Check console.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Stats ── */
  const totalPlanned   = sessions.reduce((a, s) => a + s.totalSessions, 0);
  const totalCompleted = sessions.reduce((a, s) => a + s.completedSessions, 0);
  const liveCount      = sessions.filter(s => s.status === "live").length;
  const overallPct     = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Sparkles size={13} /> Mentoring · Live
            </span>
            <h1 className="text-3xl font-bold text-white mt-1.5">Session Hub</h1>
            <p className="text-white/75 mt-1 text-sm max-w-md">
              Plan, launch and track mentoring sessions with your founders — all in one room.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-semibold shadow-lg shadow-purple-900/20 hover:bg-purple-50 hover:scale-[1.02] active:scale-[0.99] transition-all"
          >
            <Plus size={16} /> Create Session
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Planned",    value: totalPlanned,        icon: <ListChecks className="w-5 h-5" />, gradient: "from-purple-500 to-purple-700" },
          { label: "Completed",        value: totalCompleted,      icon: <CheckCircle2 className="w-5 h-5" />, gradient: "from-emerald-500 to-green-600" },
          { label: "Live Now",         value: liveCount,           icon: <Radio className="w-5 h-5" />, gradient: "from-rose-500 to-red-600" },
          { label: "Overall Progress", value: `${overallPct}%`,    icon: <Gauge className="w-5 h-5" />, gradient: "from-pink-500 to-purple-600" },
        ].map((stat) => (
          <Card key={stat.label} className={`p-5 bg-gradient-to-br ${stat.gradient} border-none text-white relative overflow-hidden`}>
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium">{stat.label}</p>
                <p className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── JITSI BANNER ── */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl px-4 py-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
          <Video size={16} className="text-white" />
        </div>
        <p className="text-sm text-purple-700">
          Sessions use <strong>Jitsi Meet</strong> — free, no account needed. Click <strong>Start Session</strong> to launch. Share the link with your founder.
        </p>
      </div>

      {/* ── JUST CREATED BANNER ── */}
      {justCreated && (
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-100/60" />
          <div className="relative flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Session created for {justCreated.founderName}!</p>
                <p className="text-sm text-emerald-700 mt-0.5">Share this link with your founder so they can join:</p>
              </div>
            </div>
            <button onClick={() => setJustCreated(null)} className="text-emerald-400 hover:text-emerald-600 shrink-0">
              <X size={18} />
            </button>
          </div>
          <div className="relative flex items-center gap-2 bg-white rounded-xl pl-1.5 pr-2 py-1.5 border border-emerald-200">
            <div className="flex items-center gap-2 flex-1 min-w-0 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
              <Video size={13} className="text-emerald-500 shrink-0" />
              <span className="text-sm text-emerald-800 font-mono flex-1 truncate">{justCreated.meetingLink}</span>
            </div>
            <button
              onClick={() => copyToClipboard(justCreated.meetingLink, (v) => v && setCopiedId("new"))}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition shrink-0"
            >
              <Copy size={12} />
              {copiedId === "new" ? "Copied!" : "Copy"}
            </button>
            <a
              href={justCreated.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition shrink-0"
            >
              <ExternalLink size={12} /> Open
            </a>
          </div>
        </div>
      )}

      {/* ── SESSION CARDS ── */}
      {sessions.length === 0 ? (
        <Card className="border border-purple-100 bg-gradient-to-br from-purple-50/60 to-pink-50/40 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-purple-100 flex items-center justify-center shadow-sm">
            <Users size={26} className="text-purple-300" />
          </div>
          <p className="font-semibold text-gray-700">No sessions yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Create Session" to schedule your first one</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const progress = Math.round((session.completedSessions / session.totalSessions) * 100);
            const isLive = session.status === "live";
            const isDone = session.status === "completed";

            return (
              <Card
                key={session.id}
                className={`relative overflow-hidden p-5 border transition-all hover:shadow-lg ${
                  isLive
                    ? "border-red-200 shadow-md shadow-red-100"
                    : isDone
                    ? "border-emerald-100"
                    : "border-purple-100"
                }`}
              >
                {/* status accent bar */}
                <div className={`absolute top-0 left-0 h-1 w-full ${
                  isLive ? "bg-gradient-to-r from-red-500 to-pink-500" :
                  isDone ? "bg-gradient-to-r from-emerald-400 to-green-500" :
                  "bg-gradient-to-r from-purple-500 to-pink-400"
                }`} />

                {/* Card header */}
                <div className="flex justify-between items-start mb-3 gap-3 pt-1">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      isLive ? "bg-gradient-to-br from-red-500 to-pink-500" :
                      isDone ? "bg-gradient-to-br from-emerald-500 to-green-600" :
                      "bg-gradient-to-br from-purple-500 to-pink-500"
                    }`}>
                      {getInitials(session.founderName || session.founderEmail)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-black truncate">{session.founderName || session.founderEmail}</h3>
                        {isLive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {session.topic || "General mentoring"} • {session.totalSessions} sessions
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    isDone  ? "bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0" :
                    isLive  ? "bg-red-100 text-red-700 border-red-200 shrink-0" :
                              "bg-purple-100 text-purple-700 border-purple-200 shrink-0"
                  }>
                    {isDone ? "Completed" : isLive ? "Live" : "Planned"}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-black">{session.completedSessions}/{session.totalSessions} done</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Meeting link */}
                <div className="flex items-center gap-2 bg-purple-50 rounded-xl pl-3 pr-1.5 py-1.5 mb-4 border border-purple-100">
                  <Video size={12} className="text-purple-400 shrink-0" />
                  <span className="text-xs text-purple-700 font-mono flex-1 truncate">{session.meetingLink}</span>
                  <button
                    onClick={() => copyToClipboard(session.meetingLink, (v) => v && setCopiedId(session.id))}
                    className="shrink-0 p-1.5 rounded-lg text-purple-400 hover:text-purple-600 hover:bg-white transition"
                    title="Copy link"
                  >
                    {copiedId === session.id ? (
                      <span className="text-xs text-emerald-600 font-medium px-1">Copied!</span>
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Start / Rejoin */}
                  {!isDone && (
                    <button
                      onClick={() => handleStartSession(session)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm ${
                        isLive
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:opacity-90"
                          : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                      }`}
                    >
                      <Video size={13} />
                      {isLive ? "Rejoin Session" : "Start Session"}
                    </button>
                  )}

                  {/* Copy link */}
                  <button
                    onClick={() => copyToClipboard(session.meetingLink, (v) => v && setCopiedId(session.id + "-btn"))}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 text-purple-600 rounded-lg text-xs hover:bg-purple-50 transition"
                  >
                    <Copy size={13} />
                    {copiedId === session.id + "-btn" ? "Copied!" : "Copy Link"}
                  </button>

                  {/* Delete session */}
                  <button
                    onClick={() => handleDelete(session)}
                    disabled={!!deletingId}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 transition disabled:opacity-50"
                    title="Permanently delete this session"
                  >
                    {deletingId === session.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Delete
                  </button>

                  {/* Mark done */}
                  {!isDone && (
                    <button
                      onClick={() => handleMarkDone(session)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300 text-emerald-600 rounded-lg text-xs hover:bg-emerald-50 transition"
                    >
                      <CheckCircle2 size={13} />
                      Mark Done
                    </button>
                  )}

                  {isDone && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 size={13} />
                      All {session.totalSessions} sessions completed!
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ══════════════ CREATE SESSION MODAL ══════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="relative overflow-hidden flex justify-between items-center p-6 bg-gradient-to-r from-purple-600 to-pink-500">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative">
                <h2 className="text-lg font-bold text-white">Create New Session</h2>
                <p className="text-sm text-white/75 mt-0.5">A Jitsi room link will be generated automatically</p>
              </div>
              <button onClick={() => setShowModal(false)} className="relative text-white/70 hover:text-white transition shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Select founder */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Select Founder *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-black bg-gray-50 focus:bg-white transition-all"
                  value={form.founderEmail}
                  onChange={(e) => {
                    const selected = founders.find(f => (f.founderEmail || f.id) === e.target.value);
                    setForm(prev => ({
                      ...prev,
                      founderEmail: e.target.value,
                      founderName: selected?.founderName || e.target.value.split("@")[0] || e.target.value,
                    }));
                  }}
                >
                  <option value="">
                    {founders.length === 0 ? "No founders found in myFounders" : "Choose a founder..."}
                  </option>
                  {founders.map((f) => (
                    <option key={f.id} value={f.founderEmail || f.id}>
                      {f.founderName}{f.startup ? ` — ${f.startup}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of sessions */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Number of Sessions *</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.totalSessions}
                  onChange={(e) => setForm(prev => ({ ...prev, totalSessions: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-black bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Topic / Goal (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pitch preparation, Fundraising strategy"
                  value={form.topic}
                  onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-black bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Auto-generated link preview */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">Auto-generated Jitsi room</span>
                </div>
                <p className="text-xs text-purple-600 font-mono truncate">
                  https://meet.jit.si/empowerher-{Date.now().toString().slice(-6)}...
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-purple-300 hover:text-purple-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.founderEmail}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-purple-200"
              >
                {creating ? (
                  <><Loader2 size={15} className="animate-spin" /> Creating...</>
                ) : (
                  <><Video size={15} /> Create & Generate Link</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}