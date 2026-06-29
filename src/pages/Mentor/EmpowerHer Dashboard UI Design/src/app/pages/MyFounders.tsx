import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DollarSign, Trash2, Users, Sparkles, ArrowRight, Star } from "lucide-react";
import { db, auth } from "../../../../../../firebase";
import {
  collection, query, where, onSnapshot,
  deleteDoc, doc, getDocs, updateDoc,
} from "firebase/firestore";

interface Founder {
  id: string;
  founderName: string;
  founderId: string;
  startup: string;
  status: string;
  photoURL?: string;
}

const avatarGradients = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-indigo-600",
  "from-fuchsia-500 to-pink-600",
  "from-indigo-500 to-violet-600",
  "from-rose-500 to-pink-500",
];

export default function MyFounders() {
  const navigate = useNavigate();
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser?.uid) { setLoading(false); return; }
    const q = query(collection(db, "myFounders"), where("mentorId", "==", auth.currentUser.uid));
   const unsub = onSnapshot(q, async (snap) => {
  const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Founder));

  const enriched = await Promise.all(raw.map(async (founder) => {
    if (founder.photoURL) return founder;
    try {
      const founderSnap = await getDocs(
        query(collection(db, "founders"), where("__name__", "==", founder.founderId))
      );
      if (!founderSnap.empty) {
        const d = founderSnap.docs[0].data();
        const photo = d.photoURL || d.profileImage || "";
        if (photo) await updateDoc(doc(db, "myFounders", founder.id), { photoURL: photo });
        return { ...founder, photoURL: photo };
      }
    } catch {}
    try {
      const userSnap = await getDocs(
        query(collection(db, "users"), where("__name__", "==", founder.founderId))
      );
      if (!userSnap.empty) {
        const d = userSnap.docs[0].data();
        const photo = d.photoURL || d.profileImage || "";
        if (photo) await updateDoc(doc(db, "myFounders", founder.id), { photoURL: photo });
        return { ...founder, photoURL: photo };
      }
    } catch {}
    return founder;
  }));

  setFounders(enriched);
  setLoading(false);
});
    return unsub;
  }, []);

  const handleRemoveFounder = async (founder: Founder) => {
    setDeleting(founder.id);
    try {
      const mentorId = auth.currentUser?.uid;

      // 1. Find the matching sessionRequests doc for this founder + mentor
      //    and flip it back to "pending" so it reappears in Session Requests.
      if (mentorId && founder.founderId) {
        const reqQuery = query(
          collection(db, "sessionRequests"),
          where("mentorId", "==", mentorId),
          where("founderId", "==", founder.founderId)
        );
        const reqSnap = await getDocs(reqQuery);

        if (!reqSnap.empty) {
          // Update the existing request(s) back to pending
          await Promise.all(
            reqSnap.docs.map((d) =>
              updateDoc(doc(db, "sessionRequests", d.id), {
                status: "pending",
                requestedDate: new Date().toISOString(),
              })
            )
          );
        }
        // If no matching sessionRequests doc exists (e.g. it was deleted
        // after acceptance), there's nothing to revert — the founder simply
        // won't reappear, which is expected since the original request is gone.
      }

      // 2. Remove from myFounders
      await deleteDoc(doc(db, "myFounders", founder.id));

      navigate("/mentor/session-requests");
    } catch (e) {
      console.error(e);
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 md:p-10">

      {/* ── Hero Header ── */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-8 shadow-xl shadow-purple-200">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute top-4 right-32 w-16 h-16 rounded-full bg-pink-400/30" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-purple-200" />
              <span className="text-purple-200 text-xs font-semibold tracking-widest uppercase">Mentor Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">My Founders</h1>
            <p className="text-purple-100 mt-1 text-sm">
              Actively mentoring <span className="font-bold text-white">{founders.length}</span> {founders.length === 1 ? "founder" : "founders"}
            </p>
          </div>

          {/* stat pill */}
          <div className="flex gap-3">
            <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3 text-center border border-white/20">
              <p className="text-2xl font-bold text-white">{founders.length}</p>
              <p className="text-purple-200 text-xs mt-0.5 uppercase tracking-wider">Active</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3 text-center border border-white/20">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-purple-200 text-xs mt-0.5 uppercase tracking-wider">Engaged</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-purple-400 text-sm font-medium">Loading your founders…</p>
        </div>

      ) : founders.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-inner">
            <Users size={32} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">No founders yet</h3>
            <p className="text-gray-400 mt-1 text-sm max-w-xs">Accept session requests to start building your roster.</p>
          </div>
          <button
            onClick={() => navigate("/mentor/session-requests")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-105 transition-all"
          >
            View Session Requests <ArrowRight size={15} />
          </button>
        </div>

      ) : (
        /* ── Cards Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {founders.map((founder, i) => {
            const initials = founder.founderName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            const grad = avatarGradients[i % avatarGradients.length];

            return (
              <div
                key={founder.id}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-purple-100 border border-purple-50 hover:border-purple-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* top gradient accent bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${grad}`} />

                <div className="p-6">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4 mb-5">
                   {founder.photoURL ? (
  <img
    src={founder.photoURL}
    alt={founder.founderName}
    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-100 shrink-0 shadow-lg"
  />
) : (
  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
    {initials}
  </div>
)}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-base truncate">{founder.founderName}</h3>
                      <p className="text-purple-500 text-sm font-medium truncate">{founder.startup}</p>
                    </div>
                    <Star size={15} className="text-purple-200 group-hover:text-purple-400 transition-colors shrink-0" />
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-5">
                    <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold capitalize border border-purple-100">
                      {founder.status}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>

                  {/* Mentorship info row */}
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-5">
                    <DollarSign size={14} className="text-purple-400 shrink-0" />
                    <span className="text-xs text-gray-500">Mentorship</span>
                    <span className="ml-auto text-xs font-bold text-purple-600">In Progress</span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 mb-4" />

                  {/* Buttons */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/mentor/review-pitch/${founder.id}`)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${grad} shadow-sm hover:opacity-90 hover:shadow-md transition-all`}
                      >
                        📥 Review Pitch
                      </button>
                      <button
                        onClick={() => navigate("/mentor/mentor-hub/" + founder.id)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-purple-600 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
                      >
                        🧠 Mentor Hub
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFounder(founder)}
                      disabled={deleting === founder.id}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-rose-500 border border-rose-100 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      {deleting === founder.id ? "Removing…" : "End Mentorship"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}