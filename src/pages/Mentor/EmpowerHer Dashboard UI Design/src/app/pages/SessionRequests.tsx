import { useState, useEffect } from "react";
import {
  collection, onSnapshot, query, where,
  updateDoc, doc, addDoc, getDoc , getDocs
} from "firebase/firestore";
import { db, auth } from "../../../../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Loader2, Clock, CheckCircle, XCircle,
  Sparkles, Users, Calendar, Globe, Mail, X
} from "lucide-react";


interface SessionRequest {
  id: string;
  founder: string;
  founderId: string;
  mentorName: string;
  mentorId?: string;
  startup: string;
  status: string;
  requestedDate: any;
  createdAt: any;
  photoURL?: string;
}

function formatDate(val: any): string {
  if (!val) return "N/A";
  if (val instanceof Date) return val.toLocaleDateString();
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
  if (typeof val === "string") return new Date(val).toLocaleDateString();
  return "N/A";
}

function initials(name: string): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

async function resolveFounderData(req: SessionRequest): Promise<SessionRequest> {
  if (!req.founderId) {
    req.founder  = req.founder  || "Unknown Founder";
    req.startup  = req.startup  || "Startup Not Added";
    req.photoURL = req.photoURL || "";
    return req;
  }
  try {
    const founderSnap = await getDoc(doc(db, "founders", req.founderId));
    if (founderSnap.exists()) {
      const d = founderSnap.data();
      req.founder  = d.fullName || d.displayName || d.name || req.founder || "Unknown Founder";
      req.startup  = d.startupName || d.companyName || req.startup || "Startup Not Added";
      req.photoURL = d.photoURL || d.profileImage || req.photoURL || "";
      return req;
    }
  } catch {}
  try {
    const userSnap = await getDoc(doc(db, "users", req.founderId));
    if (userSnap.exists()) {
      const d = userSnap.data();
      req.founder  = d.displayName || d.firstName || d.name || d.email?.split("@")[0] || req.founder || "Unknown Founder";
      req.startup  = d.startupName || d.companyName || d.company || d.startup || req.startup || "Startup Not Added";
      req.photoURL = d.photoURL || d.profileImage || req.photoURL || "";
    }
  } catch {}
  req.founder  = req.founder  || "Unknown Founder";
  req.startup  = req.startup  || "Startup Not Added";
  req.photoURL = req.photoURL || "";
  return req;
}

const avatarGradients = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-indigo-600",
  "from-fuchsia-500 to-pink-600",
  "from-indigo-500 to-violet-600",
  "from-rose-500 to-pink-500",
];

export default function SessionRequests() {
  const [requests,         setRequests]         = useState<SessionRequest[]>([]);
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [modalType,        setModalType]        = useState<"accept" | "reject" | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [authLoading,      setAuthLoading]      = useState(true);
  const [updatingId,       setUpdatingId]       = useState<string | null>(null);
  const [currentUid,       setCurrentUid]       = useState<string | null>(null);
  const [error,            setError]            = useState<string | null>(null);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [founderDetails,   setFounderDetails]   = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user?.uid ?? null);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUid) { setLoading(false); return; }
    setLoading(true); setError(null);

    const q = query(
      collection(db, "sessionRequests"),
      where("status", "==", "pending"),
      where("mentorId", "==", currentUid)
    );

    const unsub = onSnapshot(q,
      async (snapshot) => {
        const raw = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SessionRequest));
        const resolved = await Promise.all(raw.map(resolveFounderData));
        setRequests(resolved);
        setLoading(false);
      },
      () => fallbackQuery()
    );
    return unsub;
  }, [authLoading, currentUid]);

  function fallbackQuery() {
    const q = query(collection(db, "sessionRequests"), where("status", "==", "pending"));
    const unsub = onSnapshot(q,
      async (snapshot) => {
        const raw = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SessionRequest));
        const resolved = await Promise.all(raw.map(resolveFounderData));
        setRequests(resolved); setLoading(false);
      },
      (err) => { setError("Failed to load session requests. Check Firestore permissions."); setLoading(false); console.error(err); }
    );
    return unsub;
  }

  async function handleUpdate(requestId: string, newStatus: "accepted" | "rejected") {
    setUpdatingId(requestId);
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;
      await updateDoc(doc(db, "sessionRequests", requestId), { status: newStatus });
   if (newStatus === "accepted" && currentUid) {
        const existingQuery = query(
          collection(db, "myFounders"),
          where("mentorId", "==", currentUid),
          where("founderId", "==", request.founderId)
        );
        const existingSnap = await getDocs(existingQuery);
        if (existingSnap.empty) {
          await addDoc(collection(db, "myFounders"), {
            founderName: request.founder, founderId: request.founderId,
            startup: request.startup, mentorId: currentUid,
            status: "active", acceptedAt: new Date().toISOString(),
          });
        }
      }
      setModalType(null); setSelectedId(null);
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  }

  function confirmAction() {
    if (!selectedId || !modalType) return;
    handleUpdate(selectedId, modalType === "accept" ? "accepted" : "rejected");
  }

  async function fetchFounderDetails(founderId: string) {
    try {
      const founderSnap = await getDoc(doc(db, "founders", founderId));
      if (founderSnap.exists()) { setFounderDetails(founderSnap.data()); setShowFounderModal(true); return; }
      const userSnap = await getDoc(doc(db, "users", founderId));
      if (userSnap.exists()) { setFounderDetails(userSnap.data()); setShowFounderModal(true); return; }
      alert("Founder profile not found");
    } catch (e) { console.log(e); }
  }

  /* ── Loading ── */
  if (authLoading || loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
      <p className="text-purple-400 font-medium text-sm">Loading session requests…</p>
    </div>
  );

  if (!currentUid) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
      <p className="text-gray-400">Please sign in to view session requests.</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-8 shadow-xl shadow-purple-200">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 left-16 w-36 h-36 rounded-full bg-pink-400/20" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-purple-200" />
                <span className="text-purple-200 text-xs font-semibold tracking-widest uppercase">Mentor Dashboard</span>
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Session Requests</h1>
              <p className="text-purple-100 text-sm mt-1">Review and respond to incoming mentorship requests</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-6 py-4 border border-white/20 text-center">
              <p className="text-3xl font-black text-white">{requests.length}</p>
              <p className="text-purple-200 text-xs uppercase tracking-wider mt-0.5">Pending</p>
            </div>
          </div>
        </div>

        {/* ── Empty State ── */}
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-inner">
              <CheckCircle size={32} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">All caught up!</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">No pending session requests right now. Check back later.</p>
            </div>
          </div>

        ) : (
          /* ── Cards Grid ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((req, i) => {
              const grad = avatarGradients[i % avatarGradients.length];
              return (
                <div
                  key={req.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-purple-100 border border-purple-50 hover:border-purple-200 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                >
                  {/* Top accent */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${grad}`} />

                  <div className="p-6">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4 mb-5">
                      {req.photoURL ? (
                        <img src={req.photoURL} alt={req.founder}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-100 shrink-0" />
                      ) : (
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md`}>
                          {initials(req.founder)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base truncate">{req.founder}</h3>
                        <p className="text-purple-500 text-sm font-medium truncate">{req.startup}</p>
                        {req.mentorName && (
                          <p className="text-gray-400 text-xs mt-0.5 truncate">For: {req.mentorName}</p>
                        )}
                      </div>
                      {/* Pending badge */}
                      <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    </div>

                    {/* Date chip */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-5">
                      <Calendar size={13} className="text-purple-400 shrink-0" />
                      <span className="text-xs text-gray-500">Requested</span>
                      <span className="ml-auto text-xs font-bold text-purple-600">
                        {formatDate(req.requestedDate || req.createdAt)}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-4" />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedId(req.id); setModalType("accept"); }}
                        disabled={updatingId === req.id}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${grad} hover:opacity-90 hover:shadow-md transition-all disabled:opacity-50`}
                      >
                        <CheckCircle size={13} />
                        {updatingId === req.id ? "Accepting…" : "Accept"}
                      </button>
                      <button
                        onClick={() => { setSelectedId(req.id); setModalType("reject"); }}
                        disabled={updatingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 border border-rose-100 hover:bg-rose-50 hover:border-rose-200 transition-all disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        {updatingId === req.id ? "Rejecting…" : "Reject"}
                      </button>
                      <button
                        onClick={() => fetchFounderDetails(req.founderId)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-purple-600 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Founder Profile Modal ── */}
      {showFounderModal && founderDetails && (() => {
        const d = founderDetails;
        const name        = d.fullName || d.displayName || d.name || "Unknown Founder";
        const photo       = d.photoURL || d.profileImage || "";
        const subtitle    = [d.startupName || d.companyName, d.industry].filter(Boolean).join(" · ");

        // Stat chips — only render if value exists
        const stats = [
          { label: "Funding Stage",  value: d.fundingStage  },
          { label: "Startup Stage",  value: d.startupStage  },
          { label: "Industry",       value: d.industry      },
          { label: "Experience",     value: d.experience    },
          { label: "Location",       value: d.location || d.city },
          { label: "Team Size",      value: d.teamSize      },
          { label: "Revenue",        value: d.revenue       },
          { label: "Founded",        value: d.foundedYear   },
        ].filter(s => s.value);

        // General text fields — only render if value exists
        const textFields = [
          { label: "About",           value: d.bio || d.about || d.description },
          { label: "Problem",         value: d.problem       },
          { label: "Solution",        value: d.solution      },
          { label: "Business Model",  value: d.businessModel },
          { label: "Target Market",   value: d.targetMarket  },
          { label: "Traction",        value: d.traction      },
          { label: "Vision",          value: d.vision        },
          { label: "Mission",         value: d.mission       },
          { label: "Goals",           value: d.goals         },
          { label: "Notes",           value: d.notes         },
        ].filter(f => f.value);

        // Array/chip fields
        const chips = [
          { label: "Focus Areas",    values: d.skills       },
          { label: "Expertise",      values: d.expertise    },
          { label: "Interests",      values: d.interests    },
          { label: "Tags",           values: d.tags         },
        ].filter(c => Array.isArray(c.values) && c.values.length > 0);

        // Contact row fields
        const contacts = [
          { icon: <Mail size={14} className="text-purple-400 shrink-0" />,  value: d.email,    href: d.email    ? `mailto:${d.email}`    : null, display: d.email    },
          { icon: <Globe size={14} className="text-purple-400 shrink-0" />, value: d.website,  href: d.website,                                   display: d.website  },
          { icon: <Globe size={14} className="text-pink-400 shrink-0" />,   value: d.linkedin, href: d.linkedin,                                  display: "LinkedIn" },
          { icon: <Globe size={14} className="text-sky-400 shrink-0" />,    value: d.twitter,  href: d.twitter,                                   display: "Twitter"  },
          { icon: <Globe size={14} className="text-gray-400 shrink-0" />,   value: d.github,   href: d.github,                                    display: "GitHub"   },
        ].filter(c => c.value);

        // Remaining unknown keys — catch-all for any other string fields in Firestore
        const knownKeys = new Set([
          "fullName","displayName","name","photoURL","profileImage","startupName","companyName",
          "industry","fundingStage","startupStage","experience","location","city","teamSize",
          "revenue","foundedYear","bio","about","description","problem","solution","businessModel",
          "targetMarket","traction","vision","mission","goals","notes","skills","expertise",
          "interests","tags","email","website","linkedin","twitter","github","uid","createdAt",
          "updatedAt","role","password","mentorId",
        ]);
        const extraFields = Object.entries(d)
          .filter(([k, v]) => !knownKeys.has(k) && typeof v === "string" && (v as string).trim() !== "")
          .map(([k, v]) => ({ label: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()), value: v as string }));

        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl border border-purple-100">

              {/* Hero */}
              <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-6">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
               
                <div className="relative z-10 flex items-center gap-4">
                  {photo ? (
                    <img src={photo} alt={name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {initials(name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-0.5">Founder Profile</p>
                    <h2 className="text-xl font-bold text-white">{name}</h2>
                    {subtitle && <p className="text-purple-100 text-sm mt-0.5 truncate">{subtitle}</p>}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* Stat chips — only shown fields */}
                {stats.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {stats.map(({ label, value }) => (
                      <div key={label} className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl px-3 py-2.5">
                        <p className="text-purple-700 font-bold text-sm truncate">{value}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text sections */}
                {textFields.map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">{label}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{value}</p>
                  </div>
                ))}

                {/* Chip arrays */}
                {chips.map(({ label, values }) => (
                  <div key={label}>
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">{label}</p>
                    <div className="flex flex-wrap gap-2">
                      {values.map((v: string) => (
                        <span key={v} className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-xs font-semibold">{v}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Extra / unknown Firestore fields */}
                {extraFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {extraFields.map(({ label, value }) => (
                      <div key={label} className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl px-3 py-2.5">
                        <p className="text-violet-700 font-bold text-sm truncate">{value}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact */}
                {contacts.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">Contact</p>
                    <div className="space-y-2">
                      {contacts.map((c, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
                          {c.icon}
                          {c.href ? (
                            <a href={c.href} target="_blank" rel="noreferrer" className="text-sm text-purple-600 hover:underline truncate">{c.display}</a>
                          ) : (
                            <span className="text-sm text-gray-700 truncate">{c.display}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowFounderModal(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-purple-200 transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Accept / Reject Confirmation Modal ── */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white shadow-2xl rounded-3xl p-7 w-full max-w-sm border border-purple-50">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              modalType === "accept"
                ? "bg-gradient-to-br from-purple-100 to-violet-100"
                : "bg-gradient-to-br from-rose-100 to-pink-100"
            }`}>
              {modalType === "accept"
                ? <CheckCircle size={24} className="text-purple-600" />
                : <XCircle    size={24} className="text-rose-500" />
              }
            </div>
            <h2 className="text-lg font-bold text-center text-gray-900 mb-1">
              {modalType === "accept" ? "Accept this session?" : "Reject this session?"}
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
              {modalType === "accept"
                ? "The founder will be notified and added to your founders list."
                : "The founder will be notified of the rejection."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setModalType(null); setSelectedId(null); }}
                className="flex-1 py-2.5 text-sm border-2 border-gray-100 rounded-xl hover:bg-gray-50 font-semibold text-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={updatingId !== null}
                className={`flex-1 py-2.5 text-sm text-white rounded-xl font-bold transition-all disabled:opacity-50 hover:opacity-90 hover:shadow-lg ${
                  modalType === "accept"
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-purple-200"
                    : "bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-rose-200"
                }`}
              >
                {updatingId ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}