import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { X } from "lucide-react";
import {
  BookOpen, Play, Users, Award, Clock, Target,
  TrendingUp, Lightbulb, CheckCircle, Star, Zap,
  ExternalLink, Lock, Trophy, Sparkles
} from "lucide-react";
import { db, auth } from "../../../../../firebase";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";

interface CourseVideo { id: string; title: string; }
interface Course {
  id: string; title: string; description: string; instructor: string;
  rating: number; students: number; progress?: number; videos: CourseVideo[];
  color: string; emoji: string;
}

export function Training() {
  const [enrolledCourses, setEnrolledCourses]         = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse]           = useState<Course | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex]     = useState<number>(0);
  const [showModal, setShowModal]                     = useState<boolean>(false);
  const [courseProgress, setCourseProgress]           = useState<{ [key: string]: string[] }>({});
  const [completedCourses, setCompletedCourses]       = useState<string[]>([]);
  const [isSaving, setIsSaving]                       = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal]     = useState<boolean>(false);
  const [selectedWebinar, setSelectedWebinar]         = useState<any>(null);
  const [isRegistering, setIsRegistering]             = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [formData, setFormData]                       = useState({ name: "", email: "", startupName: "" });
  const [hasConnectedMentor, setHasConnectedMentor]   = useState(false);
  const [hasSubmittedPitch, setHasSubmittedPitch]     = useState(false);
  const [hasRegisteredSession, setHasRegisteredSession] = useState(false);

  const courses: Course[] = [
    {
      id: "marie-forleo",
      title: "Business Fundamentals",
      description: "Learn the core principles of building and growing a successful business",
      instructor: "Marie Forleo",
      rating: 4.9, students: 15420, emoji: "💼",
      color: "from-purple-500 to-violet-600",
      videos: [
        { id: "8Zsmk7kqzvQ", title: "How To Start A Business From Nothing" },
        { id: "fRHWK9Q_NAs", title: "How To Start Your Dream Business" },
        { id: "h5qcBxOfBe0", title: "Pricing Strategies For Your Business" },
        { id: "ESKSnNtEmVc", title: "Turn On Your Inner Beast & Accomplish Anything" },
        { id: "6k0u8hJvQ0k", title: "Marie Forleo's Actionable Business Advice" },
        { id: "wMuabWahVQY", title: "How To Create Unstoppable Success" },
      ]
    },
    {
      id: "silicon-valley-girl",
      title: "Startup & Tech Skills",
      description: "Master the essential skills for launching a tech startup",
      instructor: "Y Combinator & Experts",
      rating: 4.8, students: 12890, emoji: "🚀",
      color: "from-pink-500 to-rose-600",
      videos: [
        { id: "ZpKu2wvquWg", title: "How To Build A Tech Startup With No Technical Skills" },
        { id: "EINV8xK7qY4", title: "Google for Startups: Women Founders Demo Day" },
        { id: "jOgqIbeLXkE", title: "Entrepreneurship Masterclass: $10k to $1M/Month" },
        { id: "DJi0qmuHB9c", title: "Entrepreneurs Masterclass: AI & Business Trends" },
        { id: "gpv6X6E3Qxw", title: "A Masterclass In Entrepreneurship" },
        { id: "c2VY3zubZkY", title: "The Ultimate Small Business Masterclass" },
      ]
    },
    {
      id: "entrepreneur-channel",
      title: "Entrepreneurship Masterclass",
      description: "Comprehensive guide to entrepreneurship from ideation to execution",
      instructor: "Top Entrepreneurs",
      rating: 4.9, students: 18750, emoji: "🎯",
      color: "from-fuchsia-500 to-purple-600",
      videos: [
        { id: "DNeYKyUa-7w", title: "Sara Blakely: Self-Made Entrepreneurship" },
        { id: "2y_RyF5A4Wo", title: "How to Build a Brand as an Entrepreneur" },
        { id: "geNzr8d1A3E", title: "Masterclass: How To Start An Online Business" },
        { id: "xaF1bR3SZ6o", title: "How To Grow Your Business With YouTube" },
        { id: "qsXxckCbci0", title: "How To Grow ANY Business FASTER" },
        { id: "H6OwSHiDbxE", title: "How To Radically Transform Your Life & Business" },
      ]
    },
    {
      id: "alex-hormozi",
      title: "Scale Your Business",
      description: "Proven strategies to scale your business from $0 to $100M and beyond",
      instructor: "Alex Hormozi",
      rating: 4.9, students: 21340, emoji: "📈",
      color: "from-violet-500 to-pink-600",
      videos: [
        { id: "FGRGnPXVZIQ", title: "How to Scale a Business to $100 Million" },
        { id: "ioKjYU43vnI", title: "How To Scale Any Business" },
        { id: "I6BpTTlACv4", title: "How to Scale Your Business FAST" },
        { id: "z8WPl1v39P8", title: "Why You NEED To Build A Brand in 2024" },
        { id: "qku04Qv9fv0", title: "How to Find The Best Business Opportunities" },
        { id: "h2tokrQ4r-0", title: "The Most Powerful Marketing Strategy" },
      ]
    },
  ];

  const loadProgress = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, "trainingProgress"), where("founderId", "==", auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const progressMap: { [key: string]: string[] } = {};
      const completedMap: string[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        progressMap[data.courseId] = data.completedVideos || [];
        if (data.progressPercent >= 100) completedMap.push(data.courseId);
      });
      setCourseProgress(progressMap);
      setCompletedCourses(completedMap);
    } catch {}
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const checkAchievements = async () => {
      const mentorSnap = await getDocs(query(collection(db, "sessionRequests"), where("founderId", "==", auth.currentUser!.uid), where("status", "==", "accepted")));
      setHasConnectedMentor(!mentorSnap.empty);
      const pitchSnap = await getDocs(query(collection(db, "pitches"), where("founderId", "==", auth.currentUser!.uid)));
      setHasSubmittedPitch(!pitchSnap.empty);
      const sessionSnap = await getDocs(query(collection(db, "liveSessionRegistrations"), where("founderId", "==", auth.currentUser!.uid)));
      setHasRegisteredSession(!sessionSnap.empty);
    };
    checkAchievements();
  }, []);

  const getProgressPercent = (courseId: string): number => {
    const completed = courseProgress[courseId]?.length || 0;
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;
    return Math.round((completed / course.videos.length) * 100);
  };

  const startCourse = (course: Course): void => {
    if (!enrolledCourses.includes(course.id)) setEnrolledCourses([...enrolledCourses, course.id]);
    setSelectedCourse(course);
    setCurrentVideoIndex(courseProgress[course.id]?.length || 0);
    setShowModal(true);
  };

  const saveProgress = async (): Promise<void> => {
    if (!selectedCourse || !auth.currentUser) return;
    setIsSaving(true);
    try {
      const completedVideos = [...(courseProgress[selectedCourse.id] || [])];
      const currentVideoId = selectedCourse.videos[currentVideoIndex].id;
      if (!completedVideos.includes(currentVideoId)) completedVideos.push(currentVideoId);
      const progressPercent = Math.round((completedVideos.length / selectedCourse.videos.length) * 100);
      const isComplete = progressPercent >= 100;
      const q = query(collection(db, "trainingProgress"), where("founderId", "==", auth.currentUser.uid), where("courseId", "==", selectedCourse.id));
      const snapshot = await getDocs(q);
      const progressRef = snapshot.empty
        ? doc(collection(db, "trainingProgress"))
        : doc(db, "trainingProgress", snapshot.docs[0].id);
      await setDoc(progressRef, {
        founderId: auth.currentUser.uid, courseId: selectedCourse.id,
        courseName: selectedCourse.title, completedVideos, progressPercent,
        lastUpdated: new Date(), isComplete
      }, { merge: true });
      if (isComplete) {
        await setDoc(doc(db, "achievements", `${auth.currentUser.uid}_${selectedCourse.id}`), {
          founderId: auth.currentUser.uid, courseId: selectedCourse.id,
          courseName: selectedCourse.title, badgeType: "courseCompletion", earnedDate: new Date()
        }, { merge: true });
      }
      await loadProgress();
      if (currentVideoIndex < selectedCourse.videos.length - 1) setCurrentVideoIndex(currentVideoIndex + 1);
      else setShowModal(false);
    } catch (error) { console.error("Error saving progress:", error); }
    finally { setIsSaving(false); }
  };

  const handleCloseModal = (): void => { setShowModal(false); setSelectedCourse(null); setCurrentVideoIndex(0); };

  const handleOpenRegisterModal = (webinar: any): void => {
    setSelectedWebinar(webinar); setShowRegisterModal(true);
    setRegistrationSuccess(false); setFormData({ name: "", email: "", startupName: "" });
  };

  const handleCloseRegisterModal = (): void => {
    setShowRegisterModal(false); setSelectedWebinar(null);
    setFormData({ name: "", email: "", startupName: "" }); setRegistrationSuccess(false);
  };

  const handleRegisterWebinar = async (): Promise<void> => {
    if (!auth.currentUser || !selectedWebinar || !formData.name || !formData.email || !formData.startupName) return;
    setIsRegistering(true);
    try {
      await setDoc(doc(collection(db, "liveSessionRegistrations")), {
        name: formData.name, email: formData.email, startupName: formData.startupName,
        sessionTitle: selectedWebinar.title, founderId: auth.currentUser.uid,
        registeredAt: new Date().toISOString()
      });
      setRegistrationSuccess(true);
      setTimeout(() => handleCloseRegisterModal(), 2000);
    } catch (error) { console.error("Error registering:", error); }
    finally { setIsRegistering(false); }
  };

  const achievements = [
    { title: "First Mentor Connected", description: "Connect with your first mentor", icon: Award, earned: hasConnectedMentor, emoji: "🤝" },
    { title: "Pitcher", description: "Submit your first pitch", icon: TrendingUp, earned: hasSubmittedPitch, emoji: "🎤" },
    { title: "Course Graduate", description: "Complete your first course", icon: CheckCircle, earned: completedCourses.length >= 1, emoji: "🎓" },
    { title: "Live Learner", description: "Register for a live session", icon: Star, earned: hasRegisteredSession, emoji: "🎯" },
    { title: "Business Mastery", description: "Complete all 4 courses", icon: BookOpen, earned: completedCourses.length === 4, emoji: "👑" },
    { title: "Entrepreneur Star", description: "Complete 2 or more courses", icon: Lightbulb, earned: completedCourses.length >= 2, emoji: "⭐" },
  ];

  const webinars = [
    { title: "Breaking Barriers: Women in Tech Leadership", date: "Oct 15, 2025", time: "2:00 PM EST", speaker: "Elena Rodriguez", role: "CEO, TechNova", registered: 1247, emoji: "💻" },
    { title: "Scaling Your Startup: From MVP to Market Leader", date: "Oct 22, 2025", time: "1:00 PM EST", speaker: "Dr. Priya Patel", role: "Venture Capitalist", registered: 892, emoji: "📊" },
    { title: "Building Resilient Teams in Uncertain Times", date: "Oct 29, 2025", time: "3:00 PM EST", speaker: "Rachel Kim", role: "Leadership Coach", registered: 634, emoji: "🌱" },
  ];

  const resources = {
    ebooks: [
      { title: "Women Entrepreneurship: Financial Independence", meta: "PDF • PHDCCI Report", url: "https://www.phdcci.in/wp-content/uploads/2021/09/Women-Entrepreneurship-Transforming-from-domestic-household-to-financial-independence.pdf" },
      { title: "Women Entrepreneurship Lessons", meta: "PDF • Vidya Prasar", url: "https://vidyaprasar.dei.ac.in/wp-content/uploads/2022/03/Lesson-14.pdf" },
      { title: "Accelerating Women Entrepreneurs Handbook", meta: "PDF • GIZ 2022", url: "https://www.giz.de/de/downloads/giz2022-0011en-accelerating-women-entrepreneurs-handbook.pdf" },
      { title: "Female Entrepreneurs World Bank Report", meta: "PDF • World Bank", url: "https://documents1.worldbank.org/curated/en/400121542883319809/pdf/Female-Entrepreneurs-How-and-Why-are-They-Different.pdf" },
      { title: "Startup India: Women Entrepreneurs", meta: "Web • Government of India", url: "https://www.startupindia.gov.in/content/sih/en/women_entrepreneurs.html" },
    ],
    reports: [
      { title: "Global Startup Ecosystem Report", meta: "Startup Genome", url: "https://startupgenome.com/" },
      { title: "Funding Trends & News", meta: "Crunchbase News", url: "https://news.crunchbase.com/" },
      { title: "Women-Owned Business Report", meta: "Womenable Research", url: "https://www.womenable.com/" },
      { title: "Y Combinator Startup Library", meta: "YC Resources", url: "https://www.ycombinator.com/library" },
      { title: "Forbes Women in Business", meta: "Forbes Magazine", url: "https://www.forbes.com/women-in-business/" },
    ],
    templates: [
      { title: "Business Plan Template", meta: "SCORE • Free Download", url: "https://www.score.org/resource/business-plan-template-startup-business" },
      { title: "Pitch Deck Templates", meta: "Canva • Investor Ready", url: "https://www.canva.com/presentations/templates/pitch-deck/" },
      { title: "Financial Projections Template", meta: "SCORE • Excel", url: "https://www.score.org/resource/financial-projections-template" },
      { title: "Marketing Strategy Guide", meta: "Buffer • Free Guide", url: "https://buffer.com/library/social-media-marketing-strategy/" },
    ],
  };

  const overallProgress = Math.round((completedCourses.length / courses.length) * 100);
  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f5f3ff 100%)" }}>

      {/* ── Video Modal ── */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className={`bg-gradient-to-r ${selectedCourse.color} p-5 rounded-t-3xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">Now Playing</p>
                  <h2 className="text-white font-bold text-lg">{selectedCourse.title}</h2>
                  <p className="text-white/80 text-sm mt-0.5">{selectedCourse.videos[currentVideoIndex]?.title}</p>
                </div>
                <button onClick={handleCloseModal} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="aspect-video bg-black w-full">
              <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${selectedCourse.videos[currentVideoIndex]?.id}`}
                title={selectedCourse.videos[currentVideoIndex]?.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-6 space-y-5">
              {/* Video list */}
              <div className="space-y-2">
                {selectedCourse.videos.map((v, i) => {
                  const done = (courseProgress[selectedCourse.id] || []).includes(v.id);
                  const isCurrent = i === currentVideoIndex;
                  return (
                    <div key={v.id} onClick={() => setCurrentVideoIndex(i)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isCurrent ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${done ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : isCurrent ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"}`}>
                        {done ? <CheckCircle size={14} /> : i + 1}
                      </div>
                      <span className={`text-sm ${isCurrent ? "font-semibold text-purple-700" : done ? "text-gray-500 line-through" : "text-gray-700"}`}>{v.title}</span>
                      {isCurrent && <Play size={13} className="ml-auto text-purple-500" />}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 font-medium">Course Progress</span>
                  <span className="font-bold text-purple-600">{getProgressPercent(selectedCourse.id)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${selectedCourse.color} rounded-full transition-all duration-500`}
                    style={{ width: `${getProgressPercent(selectedCourse.id)}%` }} />
                </div>
              </div>

              {getProgressPercent(selectedCourse.id) === 100 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">🎉</div>
                  <p className="font-bold text-purple-700">Course Complete! Badge Earned.</p>
                </div>
              )}

              <button onClick={saveProgress} disabled={isSaving}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
                {isSaving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : currentVideoIndex < selectedCourse.videos.length - 1 ? (
                  <><CheckCircle size={16} /> Mark Complete & Next</>
                ) : (
                  <><Trophy size={16} /> Finish Course</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Register Modal ── */}
      {showRegisterModal && selectedWebinar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <div className="text-3xl mb-2">{selectedWebinar.emoji}</div>
              <h2 className="text-xl font-bold text-white">Register for Session</h2>
              <p className="text-white/80 text-sm mt-1 leading-snug">{selectedWebinar.title}</p>
            </div>
            <div className="p-6 space-y-4">
              {registrationSuccess ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="text-lg font-bold text-gray-900">Successfully Registered!</p>
                  <p className="text-sm text-gray-500 mt-1">Confirmation sent to {formData.email}</p>
                </div>
              ) : (
                <>
                  {[
                    { label: "Full Name", key: "name", type: "text", placeholder: "Your full name" },
                    { label: "Email", key: "email", type: "email", placeholder: "your@email.com" },
                    { label: "Startup Name", key: "startupName", type: "text", placeholder: "Your startup name" }
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        value={(formData as any)[f.key]}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                      />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleCloseRegisterModal} disabled={isRegistering}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleRegisterWebinar} disabled={isRegistering || !formData.name || !formData.email || !formData.startupName}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-md shadow-purple-200">
                      {isRegistering ? "Registering..." : "Register Free"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 p-8 mb-8 shadow-xl shadow-purple-200">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-20 -bottom-8 w-32 h-32 bg-pink-300/20 rounded-full blur-xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-3 py-1 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span className="text-white text-xs font-semibold uppercase tracking-widest">Learning Hub</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Training Hub</h1>
              <p className="text-purple-100 text-base max-w-lg">Develop skills, gain knowledge, and accelerate your entrepreneurial journey.</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "Overall Progress", value: `${overallProgress}%`, sub: `${completedCourses.length}/${courses.length} courses` },
                { label: "Badges Earned", value: `${earnedCount}`, sub: `of ${achievements.length} total` },
              ].map(s => (
                <div key={s.label} className="bg-white/15 backdrop-blur border border-white/20 rounded-2xl px-5 py-4 min-w-[130px]">
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-purple-100 text-xs font-semibold mt-0.5">{s.label}</div>
                  <div className="text-purple-200 text-[11px] mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="bg-white border border-purple-100 rounded-2xl p-1.5 shadow-sm w-full grid grid-cols-4">
            {[
              { value: "courses", label: "Courses", emoji: "🎓" },
              { value: "webinars", label: "Live Sessions", emoji: "🎙️" },
              { value: "achievements", label: "Achievements", emoji: "🏆" },
              { value: "resources", label: "Resources", emoji: "📚" },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="rounded-xl text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <span className="mr-1.5">{t.emoji}</span>{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── COURSES ── */}
          <TabsContent value="courses">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {courses.map((course) => {
                const progress = getProgressPercent(course.id);
                const isCompleted = completedCourses.includes(course.id);
                const isEnrolled = enrolledCourses.includes(course.id) || progress > 0;
                return (
                  <div key={course.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                    <div className={`bg-gradient-to-r ${course.color} p-5 relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                      <div className="flex items-start justify-between relative">
                        <div>
                          <div className="text-3xl mb-2">{course.emoji}</div>
                          <h3 className="text-white font-bold text-lg leading-tight">{course.title}</h3>
                          <p className="text-white/75 text-xs mt-1">by {course.instructor}</p>
                        </div>
                        {isCompleted && (
                          <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1">
                            <CheckCircle size={12} /> Done
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-gray-500 text-sm leading-relaxed">{course.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Play size={11} className="text-purple-400" /> {course.videos.length} videos</span>
                        <span className="flex items-center gap-1"><Clock size={11} className="text-pink-400" /> 6 hours</span>
                        <span className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" /> {course.rating}</span>
                        <span className="flex items-center gap-1"><Users size={11} className="text-blue-400" /> {course.students.toLocaleString()}</span>
                      </div>
                      {progress > 0 && (
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-400 font-medium">Progress</span>
                            <span className="font-bold text-purple-600">{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${course.color} rounded-full transition-all`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                      <button onClick={() => startCourse(course)}
                        className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          isEnrolled
                            ? `bg-gradient-to-r ${course.color} text-white shadow-md hover:shadow-lg hover:shadow-purple-200`
                            : "border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                        }`}>
                        {isEnrolled ? (
                          <><Play size={14} /> {progress > 0 ? "Continue Learning" : "Start Course"}</>
                        ) : (
                          <><Zap size={14} /> Enroll Now — Free</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── WEBINARS ── */}
          <TabsContent value="webinars">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {webinars.map((webinar, index) => (
                <div key={index} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 border-b border-purple-100">
                    <div className="text-3xl mb-3">{webinar.emoji}</div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">{webinar.title}</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Clock size={13} className="text-purple-500" />
                        </div>
                        <span>{webinar.date} · {webinar.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-7 h-7 bg-pink-50 rounded-lg flex items-center justify-center">
                          <Users size={13} className="text-pink-500" />
                        </div>
                        <span>{webinar.registered.toLocaleString()} registered</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-3 border border-purple-100">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Speaker</p>
                      <p className="font-bold text-gray-900 text-sm">{webinar.speaker}</p>
                      <p className="text-purple-600 text-xs">{webinar.role}</p>
                    </div>
                    <button onClick={() => handleOpenRegisterModal(webinar)}
                      className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2">
                      <Zap size={14} /> Register Free
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── ACHIEVEMENTS ── */}
          <TabsContent value="achievements">
            <div className="mb-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">Your Badge Collection</h3>
                  <p className="text-gray-400 text-sm">{earnedCount} of {achievements.length} badges earned</p>
                </div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {Math.round((earnedCount / achievements.length) * 100)}%
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-700"
                  style={{ width: `${(earnedCount / achievements.length) * 100}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index}
                  className={`rounded-3xl border p-5 transition-all duration-300 ${
                    achievement.earned
                      ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-md shadow-purple-100"
                      : "bg-white border-gray-100 opacity-70"
                  }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                      achievement.earned
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-200"
                        : "bg-gray-100"
                    }`}>
                      {achievement.earned ? achievement.emoji : <Lock size={20} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm ${achievement.earned ? "text-gray-900" : "text-gray-400"}`}>
                        {achievement.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{achievement.description}</p>
                      {achievement.earned && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-white rounded-full px-2.5 py-1 text-[11px] font-semibold text-purple-600 border border-purple-100">
                          <CheckCircle size={11} /> Earned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── RESOURCES ── */}
          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "E-Books & Guides", emoji: "📖", icon: BookOpen, items: resources.ebooks, accent: "purple" },
                { title: "Industry Reports", emoji: "📊", icon: TrendingUp, items: resources.reports, accent: "pink" },
                { title: "Templates & Tools", emoji: "🛠️", icon: Target, items: resources.templates, accent: "fuchsia" },
              ].map(section => (
                <div key={section.title} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`bg-gradient-to-r ${
                    section.accent === "purple" ? "from-purple-500 to-violet-600" :
                    section.accent === "pink" ? "from-pink-500 to-rose-600" :
                    "from-fuchsia-500 to-purple-600"
                  } p-5`}>
                    <div className="text-2xl mb-1">{section.emoji}</div>
                    <h3 className="font-bold text-white">{section.title}</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {section.items.map((item, i) => (
                      <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-2xl hover:bg-purple-50 group transition-colors cursor-pointer">
                        <div className={`w-1.5 flex-shrink-0 mt-1.5 h-1.5 rounded-full bg-gradient-to-b ${
                          section.accent === "purple" ? "from-purple-500 to-violet-500" :
                          section.accent === "pink" ? "from-pink-500 to-rose-500" :
                          "from-fuchsia-500 to-purple-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-700 transition-colors leading-snug">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.meta}</p>
                        </div>
                        <ExternalLink size={13} className="text-gray-300 group-hover:text-purple-400 flex-shrink-0 mt-0.5 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}