
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import {
  Search, Star, Clock, MessageSquare,
  Building2, Check, AlertCircle, Loader2, DollarSign, Calendar,
  Sparkles, Filter, X, ChevronRight, Award, Zap
} from "lucide-react";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../../../firebase";

/* ── Static fallback mentor list ── */
const STATIC_MENTORS: any[] = [];

export function MentorMatching() {
  const [mentors,        setMentors]        = useState<any[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [loadingConnect, setLoadingConnect] = useState<string | null>(null);
  const [connectedIds,   setConnectedIds]   = useState<string[]>([]);
  const [pendingIds,     setPendingIds]     = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage,   setErrorMessage]   = useState("");
  const [selectedFilters, setSelectedFilters] = useState({ industry: "", experience: "" });
  const [showFilters,    setShowFilters]    = useState(false);

  useEffect(() => {
    async function loadMentors() {
      try {
        const snap = await getDocs(collection(db, "mentors"));
       if (snap.empty) {
          setMentors([]);
        } else {
          const live = snap.docs.map((d) => ({
            id: d.id, ...d.data(),
          }));
          setMentors(live);
        }

      } catch {
        setMentors(STATIC_MENTORS);
      } finally {
        setLoadingMentors(false);
      }
    }
    loadMentors();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDocs(query(collection(db, "sessionRequests"), where("founderId", "==", uid))).then(snap => {
      const connected: string[] = [];
      const pending:   string[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.status === "accepted") connected.push(data.mentorName);
        else pending.push(data.mentorName);
      });
      setConnectedIds(connected);
      setPendingIds(pending);
    }).catch(console.error);
  }, []);

  const handleConnect = async (mentor: any) => {
    const user = auth.currentUser;
    if (!user) { setErrorMessage("Please log in to connect with mentors."); return; }
    const mentorName = mentor.fullName || mentor.name;
    setLoadingConnect(mentor.id);
    setErrorMessage("");
    try {
      await addDoc(collection(db, "sessionRequests"), {
        founder: user.email, founderId: user.uid, mentorName,
        mentorId: mentor.uid || mentor.id, startup: "Your Startup",
        status: "pending", createdAt: new Date(),
      });
      await addDoc(collection(db, "myFounders"), {
        founderId: user.uid, founderName: user.displayName || user.email?.split("@")[0] || "Founder",
        founderEmail: user.email, startup: "Your Startup",
        mentorName, status: "pending", createdAt: new Date(),
      }).catch(() => {});
      setPendingIds(prev => [...prev, mentorName]);
      setSuccessMessage(`Session request sent to ${mentorName}!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send request.");
    } finally {
      setLoadingConnect(null);
    }
  };

  const filtered = mentors.filter(m => {
    const name   = (m.fullName || m.name || "").toLowerCase();
    const skills = (m.skills || []).join(" ").toLowerCase();
    const ind    = (m.industry || "").toLowerCase();
    const matchQ   = !searchQuery || name.includes(searchQuery.toLowerCase()) || skills.includes(searchQuery.toLowerCase()) || ind.includes(searchQuery.toLowerCase());
    const matchInd = !selectedFilters.industry || ind === selectedFilters.industry.toLowerCase();
    return matchQ && matchInd;
  });

  const industries = [...new Set(mentors.map(m => m.industry).filter(Boolean))];

  // Unified brand gradient for all match scores
  const scoreColor = (_score: number) => "from-purple-600 to-pink-500";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f0fdf4 100%)" }}>

      {/* Toast Banners */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <div className="flex items-center gap-3 bg-white border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl shadow-xl shadow-emerald-100">
            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="font-medium text-sm">{successMessage}</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-3 bg-white border border-red-200 text-red-700 px-5 py-3 rounded-2xl shadow-xl shadow-red-100">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="font-medium text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-violet-300/20 to-fuchsia-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          {/* Label */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-purple-100 rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest">AI-Powered Matching</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-3">
                Find Your{" "}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    Perfect Mentor
                  </span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                    <path d="M0 5 Q50 0 100 5 Q150 10 200 5" stroke="url(#underline-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="underline-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#9333ea"/>
                        <stop offset="100%" stopColor="#ec4899"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              <p className="text-gray-500 text-lg max-w-xl">
                Connect with industry leaders who've been where you want to go — curated just for your journey.
              </p>
            </div>

            {/* Stats pill row */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Active Mentors", value: mentors.length || "50+", icon: "👩‍💼" },
                { label: "Avg. Rating", value: "4.8★", icon: "⭐" },
                { label: "Sessions Done", value: "1K+", icon: "🚀" },
              ].map(s => (
                <div key={s.label} className="bg-white/80 backdrop-blur border border-white shadow-sm rounded-2xl px-4 py-3 text-center min-w-[90px]">
                  <div className="text-lg">{s.icon}</div>
                  <div className="text-base font-bold text-gray-900">{s.value}</div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl p-4 shadow-lg shadow-purple-50 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              placeholder="Search by name, skill, or industry..."
              className="pl-10 border-0 bg-purple-50/50 rounded-xl focus-visible:ring-purple-300 text-sm h-10 placeholder:text-gray-400"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          <Select value={selectedFilters.industry || "all"} onValueChange={v => setSelectedFilters(p => ({ ...p, industry: v === "all" ? "" : v }))}>
            <SelectTrigger className="w-full sm:w-44 border-0 bg-purple-50/50 rounded-xl h-10 text-sm">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl z-50">
              <SelectItem value="all" className="text-gray-900 font-semibold focus:bg-purple-50 focus:text-purple-700 cursor-pointer">All Industries</SelectItem>
              {industries.map(i => <SelectItem key={i} value={i} className="text-gray-900 font-medium focus:bg-purple-50 focus:text-purple-700 cursor-pointer">{i}</SelectItem>)}
            </SelectContent>
          </Select>

          {(selectedFilters.industry) && (
            <button
              onClick={() => setSelectedFilters({ industry: "", experience: "" })}
              className="flex items-center gap-1.5 text-xs text-purple-600 font-medium bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              <X size={12} /> Clear
            </button>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap pl-2 border-l border-gray-100">
            <span className="font-semibold text-purple-600">{filtered.length}</span> mentors
          </div>
        </div>
      </div>

      {/* Mentor Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loadingMentors ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-pulse">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <p className="text-gray-400 font-medium">Finding your best matches...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-purple-300" />
            </div>
            <p className="text-gray-400 font-medium">No mentors match your search.</p>
            <button onClick={() => { setSearchQuery(""); setSelectedFilters({ industry: "", experience: "" }); }} className="mt-3 text-sm text-purple-500 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((mentor, idx) => {
              const name        = mentor.fullName || mentor.name || "Mentor";
              const initials    = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const isConnected = connectedIds.includes(name);
              const isPending   = pendingIds.includes(name);
const price       = mentor.hourlyRate === 0 ? "Free" : mentor.hourlyRate ? `₹${mentor.hourlyRate}/hr` : "Free";
              return (
                <div
                  key={mentor.id || mentor.uid}
                  className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Top gradient accent bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${scoreColor(mentor.matchScore || 80)}`} />

                  <div className="p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-14 w-14 ring-2 ring-purple-100">
                            <AvatarImage src={mentor.photoURL} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-base">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online dot */}
                          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight">{name}</h3>
                          <p className="text-purple-600 text-xs font-medium mt-0.5">{mentor.title}</p>
                          <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                            <Building2 size={10} />
                            <span>{mentor.industry}</span>
                          </div>
                        </div>
                      </div>

                      {/* Match score badge */}
                      {mentor.matchScore && (
                        <div className={`bg-gradient-to-br ${scoreColor(mentor.matchScore)} text-white text-xs font-bold rounded-xl px-2.5 py-1.5 shadow-sm text-center leading-tight`}>
                          <div className="text-base leading-none">{mentor.matchScore}%</div>
                          <div className="text-[9px] uppercase tracking-wider opacity-90">match</div>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                      {mentor.bio}
                    </p>

                    {/* Skills */}
                    {mentor.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mentor.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="bg-purple-50 text-purple-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-purple-100">
                            {s}
                          </span>
                        ))}
                        {mentor.skills.length > 3 && (
                          <span className="bg-gray-50 text-gray-400 text-[11px] px-2 py-1 rounded-lg">
                            +{mentor.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                      {mentor.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-gray-700">{mentor.rating}</span>
                          {mentor.reviews && <span className="text-gray-400">({mentor.reviews})</span>}
                        </div>
                      )}
                      {mentor.sessions && (
                        <div className="flex items-center gap-1">
                          <Award size={12} className="text-purple-400" />
                          <span>{mentor.sessions} sessions</span>
                        </div>
                      )}
                      {mentor.responseTime && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-green-400" />
                          <span>{mentor.responseTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mb-4" />

                    {/* Footer row */}
                    <div className="flex items-center justify-between">
                      <div>
<span className={`text-base font-bold ${mentor.hourlyRate === 0 ? "text-emerald-500" : "text-gray-900"}`}>
                          {price}
                        </span>
                        {mentor.availableDays?.length > 0 && (
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={10} />
                            {mentor.availableDays.slice(0, 2).join(" · ")}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* View Profile */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-xs text-purple-600 font-medium hover:text-purple-800 underline underline-offset-2 transition-colors">
                              View Profile
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl p-0">
                            {/* Modal hero */}
                            <div className={`h-28 bg-gradient-to-br ${scoreColor(mentor.matchScore || 80)} relative`}>
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")" }} />
                              <div className="absolute -bottom-8 left-6">
                                <Avatar className="h-16 w-16 ring-4 ring-white">
                                  <AvatarImage src={mentor.photoURL} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </div>
                            <div className="pt-12 px-6 pb-6">
                              <DialogHeader>
                                <DialogTitle className="text-left">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                                      <p className="text-purple-600 font-medium text-sm">{mentor.title}</p>
                                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                        <Building2 size={11} /> {mentor.industry} · {mentor.yearsExp}+ yrs exp
                                      </p>
                                    </div>
                                    {mentor.matchScore && (
                                      <span className={`bg-gradient-to-br ${scoreColor(mentor.matchScore)} text-white text-xs font-bold px-3 py-1.5 rounded-xl`}>
                                        {mentor.matchScore}% match
                                      </span>
                                    )}
                                  </div>
                                </DialogTitle>
                              </DialogHeader>

                              <div className="space-y-5 mt-4">
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                  {[
                                    { label: "Rating", value: mentor.rating, emoji: "⭐" },
                                    { label: "Sessions", value: mentor.sessions, emoji: "🎯" },
                                    { label: "Reviews", value: mentor.reviews, emoji: "💬" },
                                  ].filter(i => i.value).map(({ label, value, emoji }) => (
                                    <div key={label} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-3 text-center border border-purple-100/50">
                                      <div className="text-lg mb-0.5">{emoji}</div>
                                      <div className="text-lg font-bold text-gray-900">{value}</div>
                                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
                                    </div>
                                  ))}
                                </div>

                                {mentor.bio && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">About</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">{mentor.bio}</p>
                                  </div>
                                )}

                                {mentor.skills?.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {mentor.skills.map((s: string) => (
                                        <span key={s} className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-xl border border-purple-100">
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {(mentor.availableDays?.length > 0 || mentor.availableTimeSlots?.length > 0) && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Availability</h4>
                                    <div className="bg-gray-50 rounded-2xl p-3 space-y-1 text-sm text-gray-600">
                                      {mentor.availableDays?.length > 0 && (
                                        <p><span className="font-medium text-gray-700">Days: </span>{mentor.availableDays.join(", ")}</p>
                                      )}
                                      {mentor.availableTimeSlots?.length > 0 && (
                                        <p><span className="font-medium text-gray-700">Times: </span>{mentor.availableTimeSlots.join(", ")}</p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4">
                                  <span className="text-sm font-medium text-gray-600">Session Rate</span>
                                  <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
  {mentor.hourlyRate === 0 ? "Free" : mentor.hourlyRate ? `₹${mentor.hourlyRate}/hr` : "Free"}
                                  </span>
                                </div>

                                {(mentor.linkedin || mentor.website) && (
                                  <div className="text-sm space-y-1">
                                    {mentor.linkedin && (
                                      <p><span className="font-medium text-gray-600">LinkedIn: </span>
                                        <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{mentor.linkedin}</a>
                                      </p>
                                    )}
                                    {mentor.website && (
                                      <p><span className="font-medium text-gray-600">Website: </span>
                                        <a href={mentor.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{mentor.website}</a>
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Connect / Status button */}
                        {isConnected ? (
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-100">
                            <Check size={12} /> Connected
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-100">
                            <Clock size={12} /> Pending
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(mentor)}
                            disabled={loadingConnect === (mentor.id || mentor.uid)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm shadow-purple-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loadingConnect === (mentor.id || mentor.uid) ? (
                              <><Loader2 size={12} className="animate-spin" /> Sending</>
                            ) : (
                              <><MessageSquare size={12} /> Connect</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}