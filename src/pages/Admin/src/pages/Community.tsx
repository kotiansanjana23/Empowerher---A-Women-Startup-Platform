import { useState, useEffect } from "react";
import { Heart, MessageCircle, CheckCircle, XCircle, Loader2, RefreshCw, Shield, Search, Zap } from "lucide-react";
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";

/* ─── Tokens ─── */
const T = {
  page:  { background: "#0d0b1a", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  card:  { background: "#16122b", border: "1px solid #2d2050", borderRadius: 18 },
  pad:   { padding: "22px 24px" },
  muted: { color: "#6b5fa6" },
  label: { color: "#8b7db5", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" },
};

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  Approved: { color: "#4ade80", bg: "#052e16",  border: "#4ade8033" },
  Pending:  { color: "#fbbf24", bg: "#3b2a04",  border: "#fbbf2433" },
  Removed:  { color: "#f87171", bg: "#3b0a0a",  border: "#f8717133" },
};

/* ─── Hardcoded names for the likes / comments modal ─── */
const LIKER_NAMES = [
  "Priya Sharma", "Neha Kapoor", "Ananya Iyer", "Riya Mehta", "Sneha Reddy",
  "Pooja Desai", "Kavya Nair", "Isha Verma", "Divya Joshi", "Tanya Malhotra",
  "Simran Kaur", "Aarti Singh", "Meera Pillai", "Nisha Rao", "Shreya Bose",
];

/* Pool of real businesswomen headshots (randomuser.me, female, fixed seeds so they don't change on reload) */
const WOMAN_PHOTOS = Array.from({ length: 50 }, (_, i) =>
  `https://randomuser.me/api/portraits/women/${i}.jpg`
);

function pickPhoto(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return WOMAN_PHOTOS[Math.abs(h) % WOMAN_PHOTOS.length];
}

const COMMENT_SAMPLES = [
  "This is so inspiring, thank you for sharing! 🙌",
  "Congrats! You totally deserve this 🎉",
  "Following your journey, keep going!",
  "Would love to know more about how you got started.",
  "Such great energy, this made my day!",
  "Saving this for motivation later 💜",
  "Can you share some tips on this?",
  "Proud of you, this community is amazing.",
  "Wow, didn't expect this so soon — well done!",
  "Sending you so much support! 💪",
];

/* Deterministic small generator so the same post always shows the same names/comments */
function seededList<T>(arr: T[], count: number, seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const out: T[] = [];
  const n = Math.max(0, count);
  for (let i = 0; i < n; i++) {
    const idx = Math.abs(h + i * 17) % arr.length;
    out.push(arr[idx]);
  }
  return out;
}

/* ─── Hardcoded seed posts ─── */
const SEED_POSTS = [
  {
    id: "seed-1", source: "hardcoded",
    author: "Sarah Johnson",
    avatar: pickPhoto("Sarah"),
    date: "2 hours ago", createdAt: null,
    content: "Just launched my first online course! So excited to share my digital marketing knowledge with fellow entrepreneurs. What topics would you like to learn next?",
    likes: 48, comments: 12, status: "Approved",
  },
  {
    id: "seed-2", source: "hardcoded",
    author: "Emily Chen",
    avatar: pickPhoto("Emily"),
    date: "5 hours ago", createdAt: null,
    content: "Looking for a mentor in the e-commerce space. I'm building a sustainable fashion brand and would love to connect with someone who's been there!",
    likes: 32, comments: 8, status: "Pending",
  },
  {
    id: "seed-3", source: "hardcoded",
    author: "Maria Garcia",
    avatar: pickPhoto("Maria"),
    date: "1 day ago", createdAt: null,
    content: "Just hit ₹8L in monthly sales! Thank you to this amazing community for all the support and guidance. Never give up on your dreams! 💪",
    likes: 156, comments: 34, status: "Approved",
  },
  {
    id: "seed-4", source: "hardcoded",
    author: "Aisha Patel",
    avatar: pickPhoto("Aisha"),
    date: "1 day ago", createdAt: null,
    content: "Hosting a free webinar next week on financial planning for startups. Who's interested? Drop a comment below!",
    likes: 67, comments: 19, status: "Approved",
  },
  {
    id: "seed-5", source: "hardcoded",
    author: "Jessica Williams",
    avatar: pickPhoto("Jessica"),
    date: "2 days ago", createdAt: null,
    content: "Has anyone here dealt with scaling challenges? I'm growing faster than expected and need advice on hiring and delegation.",
    likes: 41, comments: 15, status: "Pending",
  },
  {
    id: "seed-6", source: "hardcoded",
    author: "Lisa Anderson",
    avatar: pickPhoto("Lisa"),
    date: "3 days ago", createdAt: null,
    content: "New product alert! Just added handmade ceramic collections to my store. Check them out and let me know what you think!",
    likes: 53, comments: 11, status: "Approved",
  },
];

/* ─── GlowButton ─── */
function GlowButton({ children, onClick, disabled, accent = "#7c3aed", small = false }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: small ? "6px 14px" : "9px 18px", borderRadius: 9,
        border: `1px solid ${accent}55`,
        background: hover ? `${accent}28` : `${accent}12`,
        color: accent, fontSize: small ? 12 : 13, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >{children}</button>
  );
}

/* ─── Engagement Modal (likes / comments) ─── */
function EngagementModal({ post, type, onClose }: { post: any; type: "likes" | "comments"; onClose: () => void }) {
  const isLikes = type === "likes";
  const count = isLikes ? post.likes : post.comments;
  const names = isLikes
    ? seededList(LIKER_NAMES, count, post.id + "-likes")
    : seededList(LIKER_NAMES, count, post.id + "-comments");
  const comments = !isLikes ? seededList(COMMENT_SAMPLES, count, post.id + "-text") : [];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(8,6,18,0.7)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#16122b", border: "1px solid #2d2050", borderRadius: 16, width: "100%", maxWidth: 380, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1a33", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isLikes
              ? <Heart size={15} style={{ color: "#db2777" }} />
              : <MessageCircle size={15} style={{ color: "#7c3aed" }} />}
            <span style={{ color: "#f5f3ff", fontSize: 14, fontWeight: 700 }}>
              {count} {isLikes ? "Likes" : "Comments"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b5fa6", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ overflowY: "auto", padding: "8px 0" }}>
          {names.length === 0 ? (
            <p style={{ color: "#4a4070", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No {isLikes ? "likes" : "comments"} yet.</p>
          ) : names.map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 20px" }}>
              <img
                src={pickPhoto(name)}
                alt={name}
                style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "#2d1f4f", objectFit: "cover" }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "#e9d5ff", fontSize: 13, fontWeight: 700, margin: 0 }}>{name}</p>
                {!isLikes && (
                  <p style={{ color: "#8b7db5", fontSize: 12, margin: "2px 0 0", lineHeight: 1.4 }}>{comments[i]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════ MAIN ════════════ */
export function Community() {
  const [posts, setPosts]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setAction]    = useState<string | null>(null);
  const [searchQuery, setSearch]      = useState("");
  const [statusFilter, setFilter]     = useState("all");
  const [modal, setModal]             = useState<{ post: any; type: "likes" | "comments" } | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "communityPosts"));
      const fbPosts = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt;
        let dateStr = "";
        if (ts) {
          const date = ts.toDate ? ts.toDate() : new Date(ts);
          const diff = Date.now() - date.getTime();
          const mins = Math.floor(diff / 60000);
          dateStr = mins < 60 ? `${mins}m ago`
            : mins < 1440 ? `${Math.floor(mins / 60)}h ago`
            : `${Math.floor(mins / 1440)}d ago`;
        }
        return {
          id: d.id, source: "firebase",
          author: data.authorName || data.userName || "Community Member",
          avatar: data.avatarURL || pickPhoto(d.id),
          date: dateStr || "Recently",
          content: data.content || data.text || "",
          likes: data.likes || 0,
          comments: data.comments || 0,
          status: data.status || "Pending",
        };
      });

      /* Merge: Firebase first, then seed posts not already represented */
      setPosts([...fbPosts, ...SEED_POSTS]);
    } catch (e) {
      console.error(e);
      setPosts(SEED_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  /* ── Approve ── */
  const handleApprove = async (post: any) => {
    setAction(post.id);
    try {
      if (post.source === "firebase") {
        await updateDoc(doc(db, "communityPosts", post.id), { status: "Approved" });
      }
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: "Approved" } : p));
    } catch (e) { console.error(e); }
    setAction(null);
  };

  /* ── Remove ── fully removes the post everywhere, not just a status flag */
  const handleRemove = async (post: any) => {
    if (!window.confirm(`Remove post by ${post.author}? This will delete it everywhere.`)) return;
    setAction(post.id);
    try {
      if (post.source === "firebase") {
        await deleteDoc(doc(db, "communityPosts", post.id));
      }
      // Drop the post from local state entirely (seed posts too) instead of just flagging it Removed
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (e) { console.error(e); }
    setAction(null);
  };

  /* ── Filters ── */
  const filtered = posts.filter(p => {
    const matchSearch = !searchQuery ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPosts    = posts.length;
  const pendingCount  = posts.filter(p => p.status === "Pending").length;
  const totalLikes    = posts.reduce((a, p) => a + (p.likes || 0), 0);

  /* ── Stat cards ── */
  const stats = [
    { label: "Total Posts",      value: totalPosts,                               accent: "#7c3aed", icon: MessageCircle },
    { label: "Pending Review",   value: pendingCount,                             accent: "#fbbf24", icon: Shield },
    { label: "Total Engagement", value: totalLikes >= 1000 ? `${(totalLikes/1000).toFixed(1)}k` : totalLikes, accent: "#db2777", icon: Heart },
  ];

  if (loading) return (
    <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 16px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #2d1f4f" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        </div>
        <p style={{ color: "#6b5fa6", fontSize: 14 }}>Loading community posts…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={T.page}>
      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", top: -200, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(219,39,119,0.06) 0%, transparent 70%)", bottom: 0, right: 0 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#db2777", boxShadow: "0 0 10px #db2777" }} />
              <span style={{ ...T.muted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Panel</span>
            </div>
            <h1 style={{ color: "#f5f3ff", fontSize: 26, fontWeight: 800, margin: 0 }}>Community Posts</h1>
            <p style={{ ...T.muted, fontSize: 13, margin: "4px 0 0" }}>Moderate and manage community engagement</p>
          </div>
          <button onClick={loadPosts}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "#1e1a33", border: "1px solid #2d2050", color: "#a78bfa", fontSize: 13, fontWeight: 600, borderRadius: 10, padding: "9px 16px", cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ ...T.card, ...T.pad, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", background: `${s.accent}12` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ ...T.label, margin: 0 }}>{s.label}</p>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={15} style={{ color: s.accent }} />
                  </div>
                </div>
                <p style={{ color: "#f5f3ff", fontSize: 34, fontWeight: 900, margin: "10px 0 4px", lineHeight: 1 }}>{s.value}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.accent, boxShadow: `0 0 5px ${s.accent}` }} />
                  <span style={{ color: s.accent, fontSize: 11, fontWeight: 600 }}>Live</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search + Filter ── */}
        <div style={{ ...T.card, ...T.pad, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a4070" }} />
            <input value={searchQuery} onChange={e => setSearch(e.target.value)}
              placeholder="Search by author or content…"
              style={{ width: "100%", boxSizing: "border-box", background: "#0f0c1f", border: "1px solid #2d2050", borderRadius: 10, color: "#f5f3ff", fontSize: 13, padding: "10px 14px 10px 36px", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "all",      label: "All",      accent: "#a78bfa" },
              { key: "approved", label: "Approved", accent: "#4ade80" },
              { key: "pending",  label: "Pending",  accent: "#fbbf24" },
              { key: "removed",  label: "Removed",  accent: "#f87171" },
            ].map(({ key, label, accent }) => {
              const active = statusFilter === key;
              return (
                <button key={key} onClick={() => setFilter(key)}
                  style={{
                    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: `1px solid ${active ? accent : "#2d2050"}`,
                    background: active ? `${accent}22` : "transparent",
                    color: active ? accent : "#6b5fa6",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>{label}</button>
              );
            })}
          </div>
        </div>

        {/* ── Posts ── */}
        <div style={{ ...T.card }}>
          <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #1e1a33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
              Recent Posts
              <span style={{ color: "#4a4070", marginLeft: 8, fontWeight: 400, textTransform: "none", fontSize: 12 }}>({filtered.length} results)</span>
            </p>
            {pendingCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#fbbf2415", border: "1px solid #fbbf2440", borderRadius: 8, padding: "4px 10px" }}>
                <Shield size={11} style={{ color: "#fbbf24" }} />
                <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>{pendingCount} awaiting review</span>
              </div>
            )}
          </div>

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <MessageCircle size={36} style={{ color: "#2d2050", margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "#4a4070", fontSize: 14 }}>No posts match your filters.</p>
              </div>
            ) : filtered.map((post) => {
              const sc = STATUS_CFG[post.status] || STATUS_CFG["Pending"];
              const isLoading = actionLoading === post.id;

              return (
                <div key={post.id}
                  style={{ background: "#0f0c1f", border: "1px solid #1e1a33", borderRadius: 14, padding: "16px 18px", transition: "border-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b3060")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1a33")}
                >
                  <div style={{ display: "flex", gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={post.avatar} alt={post.author}
                        style={{ width: 42, height: 42, borderRadius: 11, display: "block", background: "#2d1f4f", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: sc.color, border: "2px solid #0f0c1f", boxShadow: `0 0 6px ${sc.color}` }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <p style={{ color: "#e9d5ff", fontSize: 14, fontWeight: 700, margin: 0 }}>{post.author}</p>
                          <p style={{ ...T.muted, fontSize: 11, margin: "2px 0 0" }}>{post.date}</p>
                        </div>
                        <span style={{
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "3px 10px",
                        }}>{post.status}</span>
                      </div>

                      {/* Post text */}
                      <p style={{ color: "#c4b5fd", fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>{post.content}</p>

                      {/* Engagement + Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", gap: 18 }}>
                          <button
                            onClick={() => setModal({ post, type: "likes" })}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            <Heart size={14} style={{ color: "#db2777" }} />
                            <span style={{ color: "#6b5fa6", fontSize: 12, fontWeight: 600 }}>{post.likes} likes</span>
                          </button>
                          <button
                            onClick={() => setModal({ post, type: "comments" })}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            <MessageCircle size={14} style={{ color: "#7c3aed" }} />
                            <span style={{ color: "#6b5fa6", fontSize: 12, fontWeight: 600 }}>{post.comments} comments</span>
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8 }}>
                          {isLoading ? (
                            <Loader2 size={14} style={{ color: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
                          ) : (
                            <>
                              {post.status === "Pending" && (
                                <GlowButton small onClick={() => handleApprove(post)} accent="#4ade80">
                                  <CheckCircle size={13} /> Approve
                                </GlowButton>
                              )}
                              {post.status === "Approved" && (
                                <span style={{ color: "#4ade8066", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                  <CheckCircle size={12} /> Approved
                                </span>
                              )}
                              <GlowButton small onClick={() => handleRemove(post)} accent="#f87171">
                                <XCircle size={13} /> Remove
                              </GlowButton>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {modal && (
        <EngagementModal post={modal.post} type={modal.type} onClose={() => setModal(null)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4a4070; }
        input:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 2px rgba(124,58,237,0.2); }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}