import { useState, useEffect, useRef, useCallback, type ReactNode, type MouseEvent as ReactMouseEvent, type CSSProperties } from "react";
import logo from "../../../../../logo.png";
import { db } from "../../../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AboutUs } from "./Aboutus";

interface FounderProfile {
  name: string;
  role: string;
  startup: string;
  content: string;
  raised: string;
  img: string;
  tag: string;
  journey: string;
  achievements: string[];
}

type ChatMessage = { from: "bot" | "user"; text: string };

interface LandingPageProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
  onNavigate?: (page: string) => void;
}

interface NetworkFounder {
  name: string;
  xPct: number;
  y: number;
  color: string;
  img: string;
}

const FOUNDER_IMAGES = [
  "https://images.unsplash.com/photo-1573496130141-209d200cebd8?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1623122245120-7eef6faa39c6?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1666305103177-79269fe480bf?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1683511479326-ad50331077cc?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1646296066880-c61cac79470b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  "https://plus.unsplash.com/premium_photo-1675859364880-198e17c9376a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

const TESTIMONIALS: FounderProfile[] = [
  { name: "Priya Sharma", role: "CEO, FinFlow India", startup: "FinFlow", content: "EmpowerHer connected me with the right mentor, helping close my ₹2Cr seed round in 6 weeks.", raised: "₹2Cr", img: FOUNDER_IMAGES[0], tag: "Fintech", journey: "From idea to revenue in six months, her payments startup now supports thousands of SMBs.", achievements: ["Seed round closed", "50K active merchants", "Bank partnership secured"] },
  { name: "Riya Patel", role: "Founder, GreenLeaf", startup: "GreenLeaf", content: "The mentor match was industry-perfect. Our revenue grew 3x in a year.", raised: "3× Revenue", img: FOUNDER_IMAGES[1], tag: "CleanTech", journey: "She scaled an eco-focused consumer brand with retail pilots and sustainable sourcing.", achievements: ["Retail launch", "3x YoY revenue", "Top sustainability award"] },
  { name: "Anika Nair", role: "Co-founder, MedTech Hub", startup: "MedTech Hub", content: "Training and community support helped us grow to 10,000 customers in 8 months.", raised: "10K Users", img: FOUNDER_IMAGES[2], tag: "HealthTech", journey: "Built a digital care platform with clinical mentors and enterprise pilots.", achievements: ["10K customers", "Enterprise pilot", "HealthTech awards"] },
  { name: "Kavya Reddy", role: "Founder, EdSpace", startup: "EdSpace", content: "I pitched to 3 VCs through EmpowerHer and landed my Series A in just 4 months.", raised: "Series A", img: FOUNDER_IMAGES[3], tag: "EdTech", journey: "Built a collaborative learning platform that now supports hybrid classrooms across cities.", achievements: ["Series A closed", "Classroom partnerships", "50% retention"] },
  { name: "Meera Kapoor", role: "CEO, StyleAI", startup: "StyleAI", content: "The funding roadmap helped me understand exactly what investors were looking for.", raised: "₹5Cr", img: FOUNDER_IMAGES[4], tag: "Fashion AI", journey: "Created an intelligent styling platform trusted by fashion founders and boutiques.", achievements: ["₹5Cr funding", "AI styling launch", "Top fashion startup"] },
  { name: "Shreya Joshi", role: "Founder, AgriConnect", startup: "AgriConnect", content: "My mentor introduced me to 12 investors. Closed ₹1.5Cr pre-seed within 3 months.", raised: "₹1.5Cr", img: FOUNDER_IMAGES[5], tag: "AgriTech", journey: "Built a farmer-tech marketplace connecting rural producers with urban demand.", achievements: ["Pre-seed closed", "Farm network built", "Pilot launch"] },
];

const NETWORK_FOUNDERS: NetworkFounder[] = [
  { name: "Priya S.", xPct: 22, y: 120, color: "#7C3AED", img: FOUNDER_IMAGES[0] },
  { name: "Riya P.", xPct: 46, y: 80, color: "#DB2777", img: FOUNDER_IMAGES[1] },
  { name: "Anika N.", xPct: 71, y: 130, color: "#7C3AED", img: FOUNDER_IMAGES[2] },
  { name: "Kavya R.", xPct: 34, y: 230, color: "#DB2777", img: FOUNDER_IMAGES[3] },
  { name: "Meera K.", xPct: 59, y: 210, color: "#7C3AED", img: FOUNDER_IMAGES[4] },
  { name: "Shreya J.", xPct: 13, y: 250, color: "#DB2777", img: FOUNDER_IMAGES[5] },
  { name: "Divya M.", xPct: 80, y: 255, color: "#7C3AED", img: FOUNDER_IMAGES[6] },
  { name: "Neha T.", xPct: 48, y: 320, color: "#DB2777", img: FOUNDER_IMAGES[7] },
];

const FLOAT_BADGES = [
  { label: "₹2Cr Raised", icon: "💰", color: "#7C3AED", top: "8%", left: "2%", delay: "0s" },
  { label: "Series A", icon: "🚀", color: "#DB2777", top: "5%", right: "5%", delay: "0.6s" },
  { label: "Mentor Matched", icon: "🤝", color: "#7C3AED", top: "42%", left: "0%", delay: "1.2s" },
  { label: "10K Customers", icon: "🌟", color: "#DB2777", bottom: "18%", right: "2%", delay: "1.8s" },
  { label: "Featured Founder", icon: "👑", color: "#7C3AED", bottom: "5%", left: "8%", delay: "2.4s" },
];

/* ── MERCIA SMART RESPONSES ── */
function getMerciaReply(userMsg: string): string {
  const lower = userMsg.toLowerCase();

  if (lower.includes("pitch") || lower.includes("deck") || lower.includes("presentation")) {
    return "For a strong investor pitch: lead with the problem (1 slide), your unique solution (1–2 slides), market size (TAM/SAM/SOM), traction so far, team credentials, and your ask. Keep it under 12 slides and under 10 minutes. Our Pitch Lab has live expert feedback sessions — submit a draft and get scored within 48 hours! 🎤";
  }
  if (lower.includes("mentor") || lower.includes("match") || lower.includes("find mentor")) {
    return "Our AI mentor matching analyses your industry vertical, startup stage, funding goals, and key challenges to surface your top 3 matches from 1,200+ vetted mentors. Most founders get their first intro within 48 hours of completing their profile. Mentors have direct experience in your sector — not just generic startup advice. 🧠";
  }
  if (lower.includes("seed") || lower.includes("pre-seed") || lower.includes("raise") || lower.includes("funding") || lower.includes("investor") || lower.includes("vc")) {
    return "For Seed funding in India: start with angels (₹25L–₹1Cr range), then approach micro-VCs. What investors want to see: a sharp problem statement, early traction (even 10 paying customers matters), a large addressable market, and a compelling founding story. EmpowerHer's funding database has 200+ women-focused investors and grant programs. 💸";
  }
  if (lower.includes("mvp") || lower.includes("product") || lower.includes("build") || lower.includes("launch")) {
    return "Build the smallest version that validates your riskiest assumption. For most founders: pick one core user action, manually fulfil it behind the scenes first, and get 10–20 beta users giving weekly feedback. Avoid building features before validating demand — talk to 50 potential customers before writing a single line of code. 🚀";
  }
  if (lower.includes("co-founder") || lower.includes("cofounder") || lower.includes("team") || lower.includes("hire")) {
    return "Finding a co-founder: look for complementary skills (tech + business is classic), shared risk tolerance, and aligned long-term vision. Use EmpowerHer's community to post a co-founder brief. Always do a 3–6 month trial before formalising equity splits — and get a vesting schedule (4 years, 1-year cliff) in writing from day one. 🤝";
  }
  if (lower.includes("market") || lower.includes("customer") || lower.includes("growth") || lower.includes("gtm") || lower.includes("go to market")) {
    return "For early GTM: identify one narrow customer segment where you have an unfair advantage (network, domain expertise, geography). Acquire your first 100 customers manually — DMs, WhatsApp groups, offline events. Only invest in paid channels once you have a repeating conversion pattern. EmpowerHer's Growth & GTM course covers this in depth. 📈";
  }
  if (lower.includes("valuation") || lower.includes("equity") || lower.includes("dilution") || lower.includes("cap table")) {
    return "At pre-seed, Indian startup valuations typically range ₹2Cr–₹8Cr post-money. Expect 10–20% dilution per round. Key cap table rule: founders should retain 60%+ through Series A. Watch out for overly broad ESOP pools (>15% pre-Series A) and participating preferred clauses in term sheets. Our Equity 101 resource explains every clause in plain English. 📊";
  }
  if (lower.includes("legal") || lower.includes("contract") || lower.includes("incorporate") || lower.includes("company")) {
    return "For Indian startups: register as a Private Limited Company (Pvt Ltd) — it's investor-friendly and clean for future fundraising. Use a CA to file with MCA. Get your co-founder agreement, IP assignment, and NDAs in place before you incorporate. EmpowerHer's Resources section has lawyer-reviewed templates for free. ⚖️";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("namaste")) {
    return "Hi! 👋 I'm Mercia, your AI startup concierge at EmpowerHer. I can help you with mentor matching, fundraising strategy, pitch preparation, MVP planning, co-founder search, and more. What are you working on right now?";
  }
  if (lower.includes("community") || lower.includes("network") || lower.includes("connect") || lower.includes("founders")) {
    return "EmpowerHer's Founders Circle has 50,000+ women entrepreneurs across 40 countries. You'll get daily check-ins, peer introductions, mentor office hours, and accountability groups. Many of our members have found co-founders, early customers, and investors entirely through the community. Join the circle — it's free! 🌐";
  }
  if (lower.includes("course") || lower.includes("learn") || lower.includes("training") || lower.includes("skill")) {
    return "Our Training Hub has 200+ courses built by founders who've actually raised and scaled. Popular tracks: Startup Foundations (4 weeks), Fundraising Masterclass, Growth & GTM, and Founder Mindset. All self-paced. Sign up free and your progress is saved so you can learn between meetings. 📚";
  }
  if (lower.includes("revenue") || lower.includes("monetise") || lower.includes("monetize") || lower.includes("pricing") || lower.includes("business model")) {
    return "Pricing tip: most early-stage founders underprice significantly. If nobody says 'that's expensive', your price is too low. For B2B SaaS in India, ₹5K–₹25K/month per seat is common at early stages. For B2C, start with a freemium model only if viral growth is your acquisition strategy — otherwise go paid from day one. 💡";
  }
  if (lower.includes("empowerher") || lower.includes("platform") || lower.includes("how does") || lower.includes("what is")) {
    return "EmpowerHer is India's #1 platform for women founders. We provide AI-powered mentor matching (1,200+ mentors), a curated funding database (₹500Cr+ facilitated), 200+ founder-built courses, a Pitch Lab with live feedback, and a 50,000+ strong community. Everything in one place — no gatekeepers. Get started free! ✨";
  }

  // Default helpful response
  return "Great question! Here's how I'd approach it: start by clearly defining the specific problem you're trying to solve, then look for founders in EmpowerHer's community who've faced the same challenge. You can also book a mentor session for personalised guidance. What aspect would you like to explore further? 🎯";
}

/* ── SCROLL HELPER ── */
const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

/* ── COUNT-UP HOOK ── */
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (startTime === null) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [start, target, duration]);
  return count;
}

/* ── INTERSECTION OBSERVER HOOK ── */
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ── STAT: 50K+ FOUNDERS ── */
function StatFounders({ inView }: { inView: boolean }) {
  const count = useCountUp(50000, 2200, inView);
  const [done, setDone] = useState(false);
  useEffect(() => { if (count >= 50000) setTimeout(() => setDone(true), 100); }, [count]);
  const displayCount = count >= 50000 ? "50K+" : count >= 1000 ? `${Math.floor(count / 1000)}K` : count;
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", gap: "-6px" }}>
        {FOUNDER_IMAGES.slice(0, 5).map((img, i) => (
          <div key={i} style={{ width: "20px", height: "20px", borderRadius: "50%", overflow: "hidden", border: "2px solid white", marginLeft: i === 0 ? 0 : "-5px", transition: `all 0.4s ${i * 0.1}s`, transform: inView ? "translateY(0) scale(1)" : "translateY(12px) scale(0.5)", opacity: inView ? 1 : 0, boxShadow: "0 2px 8px rgba(124,58,237,0.25)", zIndex: 5 - i }}>
            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: "clamp(20px,2vw,30px)", fontWeight: "900", background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "all 0.3s", transform: done ? "scale(1.06)" : "scale(1)", filter: done ? "drop-shadow(0 0 12px rgba(124,58,237,0.4))" : "none" }}>
        {displayCount}
      </div>
      <div style={{ fontSize: "12px", color: "#888", fontWeight: "600", marginTop: "4px" }}>Women Founders</div>
    </div>
  );
}

/* ── STAT: 1,200+ MENTORS ── */
function StatMentors({ inView }: { inView: boolean }) {
  const count = useCountUp(1200, 2000, inView);
  const [done, setDone] = useState(false);
  useEffect(() => { if (count >= 1200) setTimeout(() => setDone(true), 100); }, [count]);
  const icons = ["🎓","💼","🧠","⚡","🏆"];
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "20px" }}>
        {icons.map((icon, i) => (
          <div key={i} style={{ width: "24px", height: "24px", borderRadius: "8px", background: "linear-gradient(135deg,#7C3AED22,#DB277722)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", transition: `all 0.4s ${i * 0.08}s`, transform: inView ? "translateY(0) rotate(0deg)" : "translateY(16px) rotate(-20deg)", opacity: inView ? 1 : 0 }}>
            {icon}
          </div>
        ))}
      </div>
      <div style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: "900", background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "all 0.3s", transform: done ? "scale(1.06)" : "scale(1)", filter: done ? "drop-shadow(0 0 12px rgba(124,58,237,0.4))" : "none" }}>
        {count >= 1200 ? "1,200+" : count.toLocaleString()}
      </div>
      <div style={{ fontSize: "12px", color: "#888", fontWeight: "600", marginTop: "4px" }}>Expert Mentors</div>
    </div>
  );
}

/* ── STAT: ₹500Cr+ FUNDING ── */
function StatFunding({ inView }: { inView: boolean }) {
  const count = useCountUp(500, 1800, inView);
  const [done, setDone] = useState(false);
  useEffect(() => { if (count >= 500) setTimeout(() => setDone(true), 100); }, [count]);
  const coins = ["₹","💸","🪙","💵","✨"];
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "3px", marginBottom: "20px" }}>
        {coins.map((c, i) => (
          <div key={i} style={{ fontSize: "16px", transition: `all 0.5s ${i * 0.1}s`, transform: inView ? "translateY(0)" : "translateY(-20px)", opacity: inView ? 1 : 0, filter: "drop-shadow(0 2px 4px rgba(124,58,237,0.3))" }}>
            {c}
          </div>
        ))}
      </div>
      <div style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: "900", background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "all 0.3s", transform: done ? "scale(1.06)" : "scale(1)", filter: done ? "drop-shadow(0 0 12px rgba(124,58,237,0.4))" : "none" }}>
        {count >= 500 ? "₹500Cr+" : `₹${count}Cr`}
      </div>
      <div style={{ fontSize: "12px", color: "#888", fontWeight: "600", marginTop: "4px" }}>Funding Facilitated</div>
    </div>
  );
}

/* ── STAT: 94% SUCCESS RING ── */
function StatSuccess({ inView }: { inView: boolean }) {
  const count = useCountUp(94, 1800, inView);
  const [done, setDone] = useState(false);
  useEffect(() => { if (count >= 94) setTimeout(() => setDone(true), 150); }, [count]);
  const radius = 28; const circ = 2 * Math.PI * radius;
  const pct = count / 100;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: "68px", height: "68px", margin: "0 auto 6px" }}>
        <svg width="68" height="68" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={radius} fill="none" stroke="#f0e6ff" strokeWidth="5" />
          <circle cx="34" cy="34" r={radius} fill="none" stroke="url(#ringGrad)" strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.05s" }} />
          <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#DB2777" /></linearGradient></defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: done ? "20px" : "0px", transition: "font-size 0.4s 0.2s", filter: done ? "drop-shadow(0 0 6px rgba(124,58,237,0.5))" : "none" }}>
          {done ? "✓" : ""}
        </div>
      </div>
      <div style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: "900", background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "all 0.3s", transform: done ? "scale(1.06)" : "scale(1)", filter: done ? "drop-shadow(0 0 12px rgba(124,58,237,0.4))" : "none" }}>
        {count}%
      </div>
      <div style={{ fontSize: "12px", color: "#888", fontWeight: "600", marginTop: "4px" }}>Success Rate</div>
    </div>
  );
}

/* ── ANIMATED STATS ROW ── */
function StatsRow() {
  const [ref, inView] = useInView(0.4);
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", padding: "28px 24px", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", borderRadius: "24px", border: "1px solid rgba(124,58,237,0.12)", boxShadow: "0 8px 40px rgba(124,58,237,0.08)", marginTop: "36px" }}>
      <StatFounders inView={inView} />
      <StatMentors inView={inView} />
      <StatFunding inView={inView} />
      <StatSuccess inView={inView} />
    </div>
  );
}

/* ── FLIP TESTIMONIAL CARD ── */
function TestimonialCard({ t }: { t: FounderProfile }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)} style={{ width: "260px", height: "280px", flexShrink: 0, perspective: "1200px" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", transition: "transform 0.65s cubic-bezier(0.4,0,0.2,1)", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: "22px", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(124,58,237,0.12)", boxShadow: "0 8px 30px rgba(124,58,237,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "22px", textAlign: "center" }}>
          <span style={{ position: "absolute", top: "14px", right: "14px", background: "linear-gradient(135deg,#7C3AED,#DB2777)", color: "white", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: "700" }}>{t.tag}</span>
          <div style={{ width: "92px", height: "92px", borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(124,58,237,0.25)", boxShadow: "0 6px 20px rgba(124,58,237,0.2)", marginBottom: "16px", flexShrink: 0 }}>
            <img src={t.img} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
          <div style={{ fontWeight: "800", fontSize: "16px", color: "#1a1a2e" }}>{t.name}</div>
          <div style={{ fontSize: "13px", color: "#7C3AED", fontWeight: "600", marginTop: "4px" }}>{t.startup}</div>
        </div>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "22px", background: "linear-gradient(160deg,#7C3AED,#DB2777)", boxShadow: "0 14px 40px rgba(124,58,237,0.35)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "22px", color: "white" }}>
          <div>
            <div style={{ fontWeight: "800", fontSize: "15px" }}>{t.startup}</div>
            <div style={{ fontSize: "11px", opacity: 0.85, marginBottom: "10px" }}>{t.role}</div>
            <p style={{ fontSize: "12.5px", lineHeight: "1.6", opacity: 0.95, margin: 0 }}>{t.journey}</p>
          </div>
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              {t.achievements.map((a) => (
                <div key={a} style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏆</span> {a}
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "8px 10px", fontSize: "13px", fontWeight: "800", textAlign: "center" }}>
              {t.raised} achieved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── JOIN COMMUNITY POPUP ── */
function JoinCommunityModal({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: "380px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 10px 30px rgba(124,58,237,0.25)" }}>
          <img src={logo} alt="EmpowerHer" style={{ width: "42px", height: "42px", objectFit: "contain" }} />
        </div>
        <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f0a1e", marginBottom: "6px" }}>EmpowerHer Founders Circle</h3>
        <p style={{ fontSize: "13px", color: "#777", marginBottom: "18px" }}>A community-style group for daily founder support, intros & wins.</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex" }}>
            {FOUNDER_IMAGES.slice(0, 5).map((img, i) => (
              <div key={i} style={{ width: "38px", height: "38px", borderRadius: "50%", overflow: "hidden", border: "2px solid white", marginLeft: i === 0 ? 0 : "-12px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", zIndex: 5 - i }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#7C3AED", color: "white", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "-12px", border: "2px solid white", zIndex: 0 }}>+495</div>
          </div>
        </div>
        <div style={{ fontSize: "13px", color: "#7C3AED", fontWeight: 800, marginBottom: "22px" }}>✓ 500+ founders already joined</div>
        <button className="btn-primary" style={{ width: "100%", fontSize: "15px", padding: "14px 18px", background: "linear-gradient(135deg,#7C3AED,#DB2777)" }} onClick={onJoined}>
          Join the Circle
        </button>
      </div>
    </div>
  );
}

/* ── SUCCESS TOAST ── */
function JoinSuccessToast({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="join-toast">
      <div style={{ fontSize: "22px" }}>✅</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f0a1e" }}>You've successfully joined our community!</div>
        <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>You'll start receiving updates & mentor invites soon.</div>
      </div>
    </div>
  );
}

/* ── SCROLL REVEAL WRAPPER ── */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div ref={ref} className={className} style={{ transition: `opacity 0.7s ${delay}s, transform 0.7s ${delay}s`, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(36px)" }}>
      {children}
    </div>
  );
}

/* ── MAGNETIC BUTTON ── */
function MagneticButton({ children, className, style, onClick }: { children: ReactNode; className?: string; style?: CSSProperties; onClick?: () => void }) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50, active: false });
  const handleMouseMove = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.25;
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x: dx, y: dy });
    setShine({ x: shineX, y: shineY, active: true });
  };
  const handleMouseLeave = () => { setPos({ x: 0, y: 0 }); setShine(s => ({ ...s, active: false })); };
  return (
    <button ref={btnRef} className={className} style={{ ...style, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1)", position: "relative", overflow: "hidden" }} onClick={onClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {shine.active && (
        <span style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.25) 0%, transparent 60%)`, pointerEvents: "none", borderRadius: "inherit" }} />
      )}
      {children}
    </button>
  );
}

/* ── FAQ ITEM ── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", border: `1px solid ${open ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.1)"}`, borderRadius: "18px", padding: "20px 24px", cursor: "pointer", transition: "all 0.3s", boxShadow: open ? "0 8px 32px rgba(124,58,237,0.12)" : "0 2px 8px rgba(124,58,237,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ fontWeight: "700", fontSize: "15px", color: "#1a1a2e" }}>{q}</div>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: open ? "linear-gradient(135deg,#7C3AED,#DB2777)" : "rgba(124,58,237,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: open ? "white" : "#7C3AED", flexShrink: 0, transition: "all 0.3s", transform: open ? "rotate(45deg)" : "none" }}>+</div>
      </div>
      {open && <div style={{ marginTop: "14px", fontSize: "14px", color: "#6a5a7a", lineHeight: "1.75", borderTop: "1px solid rgba(124,58,237,0.08)", paddingTop: "14px" }}>{a}</div>}
    </div>
  );
}

/* ── CONTACT FORM (Firebase integrated) ── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "contactMessages"), {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        submittedAt: serverTimestamp(),
        source: "landing_page",
      });
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error("Error saving contact form:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return sent ? (
    <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(219,39,119,0.08))", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "20px", padding: "36px", textAlign: "center" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
      <div style={{ fontWeight: "800", fontSize: "18px", color: "#0f0a1e", marginBottom: "6px" }}>Message sent!</div>
      <div style={{ fontSize: "14px", color: "#7a6a8a" }}>We'll get back to you within 24 hours.</div>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {[
        { label: "Your Name", key: "name", type: "text", placeholder: "Priya Sharma" },
        { label: "Email Address", key: "email", type: "email", placeholder: "priya@startup.com" },
      ].map(f => (
        <div key={f.key}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4c3270", marginBottom: "6px" }}>{f.label}</label>
          <input
            type={f.type}
            value={form[f.key as keyof typeof form]}
            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            style={{ width: "100%", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#ffffff", color: "#1a1a2e", boxSizing: "border-box" }}
          />
        </div>
      ))}
      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4c3270", marginBottom: "6px" }}>Message</label>
        <textarea
          value={form.message}
          onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Tell us how we can help..."
          rows={4}
          style={{ width: "100%", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#ffffff", color: "#1a1a2e", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>
      {error && <div style={{ fontSize: "13px", color: "#e11d48", fontWeight: "600" }}>{error}</div>}
      <button
        className="btn-primary"
        style={{ alignSelf: "flex-start", padding: "14px 36px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? "Sending..." : "Send Message →"}
      </button>
    </div>
  );
}

/* ── MAIN LANDING PAGE ── */
export function LandingPage({ onSignIn, onGetStarted, onNavigate }: LandingPageProps = {}) {
  const [scrollY, setScrollY] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [showTeam, setShowTeam] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [communityJoined, setCommunityJoined] = useState(false);
  const [joinPopupOpen, setJoinPopupOpen] = useState(false);
  const [joinToastOpen, setJoinToastOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Hi! 👋 I'm Mercia — your AI startup concierge. Ask me about mentors, funding, pitching, MVP strategy, co-founders, or anything else about building your startup!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [cursor, setCursor] = useState({ x: -200, y: -200 });
  const [heroParallax, setHeroParallax] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let paused = false;
    const scroll = () => {
      if (!paused) {
        el.scrollLeft += 0.6;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth) el.scrollLeft = 0;
      }
      animFrameRef.current = window.requestAnimationFrame(scroll);
    };
    animFrameRef.current = window.requestAnimationFrame(scroll);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    return () => {
      if (animFrameRef.current !== null) window.cancelAnimationFrame(animFrameRef.current);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, []);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    setCursor({ x: e.clientX, y: e.clientY });
    if (heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setHeroParallax({ x: (e.clientX - cx) / rect.width * 18, y: (e.clientY - cy) / rect.height * 12 });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const confirmCommunityJoin = () => { setCommunityJoined(true); setCommunityModalOpen(false); };
  const handleJoinPopupConfirm = () => { setJoinPopupOpen(false); setJoinToastOpen(true); };

  const handleChatSend = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage.trim();
    setChatMessages(c => [...c, { from: "user", text: userMsg }]);
    setChatMessage("");
    setIsTyping(true);
    // Simulate a brief typing delay for natural feel
    setTimeout(() => {
      setIsTyping(false);
      const reply = getMerciaReply(userMsg);
      setChatMessages(c => [...c, { from: "bot", text: reply }]);
    }, 900);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatMessages(c => [...c, { from: "user", text: suggestion }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply = getMerciaReply(suggestion);
      setChatMessages(c => [...c, { from: "bot", text: reply }]);
    }, 900);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #f8f4ff; }

    .spotlight {
      pointer-events: none; position: fixed;
      width: 600px; height: 600px; border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%);
      transform: translate(-50%,-50%); z-index: 9998;
      transition: left 0.12s, top 0.12s;
    }

    @keyframes bgShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.95)} }
    @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,20px) scale(1.05)} 66%{transform:translate(30px,-40px) scale(0.9)} }
    @keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,30px) scale(1.08)} }
    @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.12)} }
    @keyframes fadeSlideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
    @keyframes badgeFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
    @keyframes connPulse { 0%,100%{opacity:0.18} 50%{opacity:0.55} }
    @keyframes nodeFloat { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-6px)} }
    @keyframes toastSlideUp { from{opacity:0;transform:translate(-50%,16px)} to{opacity:1;transform:translate(-50%,0)} }
    @keyframes imgFloat1 { 0%,100%{transform:translateY(0px) rotate(-2deg)} 50%{transform:translateY(-18px) rotate(1deg)} }
    @keyframes imgFloat2 { 0%,100%{transform:translateY(0px) rotate(2deg)} 50%{transform:translateY(-24px) rotate(-1deg)} }
    @keyframes imgFloat3 { 0%,100%{transform:translateY(0px) rotate(-1deg) scale(1)} 50%{transform:translateY(-14px) rotate(2deg) scale(1.02)} }
    @keyframes imgFloat4 { 0%,100%{transform:translateY(0px) rotate(3deg)} 50%{transform:translateY(-20px) rotate(-2deg)} }
    @keyframes imgFloat5 { 0%,100%{transform:translateY(0px) rotate(-3deg) scale(1)} 50%{transform:translateY(-16px) rotate(1deg) scale(1.03)} }
    @keyframes typingDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }

    .btn-primary {
      background: linear-gradient(135deg,#7C3AED,#DB2777);
      color: white; border: none; border-radius: 16px;
      padding: 16px 36px; font-size: 15px; font-weight: 800;
      cursor: pointer; font-family: 'Inter', system-ui, sans-serif;
      letter-spacing: -0.2px; position: relative; overflow: hidden;
      transition: transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s;
    }
    .btn-primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 16px 48px rgba(124,58,237,0.45); }
    .btn-ghost {
      background: rgba(255,255,255,0.15); color: white;
      border: 1.5px solid rgba(255,255,255,0.35); border-radius: 16px;
      padding: 16px 36px; font-size: 15px; font-weight: 700; cursor: pointer;
      transition: background 0.25s; font-family: 'Inter', system-ui, sans-serif;
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.28); }
    .btn-outline {
      background: rgba(255,255,255,0.7); color: #7C3AED; backdrop-filter: blur(12px);
      border: 1.5px solid rgba(124,58,237,0.25); border-radius: 16px;
      padding: 16px 36px; font-size: 15px; font-weight: 700; cursor: pointer;
      transition: all 0.3s; font-family: 'Inter', system-ui, sans-serif;
    }
    .btn-outline:hover { border-color: #7C3AED; background: rgba(255,255,255,0.9); box-shadow: 0 8px 28px rgba(124,58,237,0.18); transform: translateY(-2px); }

    .glass-card {
      background: rgba(255,255,255,0.7); backdrop-filter: blur(20px);
      border: 1px solid rgba(124,58,237,0.1); border-radius: 24px;
      box-shadow: 0 8px 32px rgba(124,58,237,0.06);
      transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    .glass-card:hover { transform: translateY(-8px); box-shadow: 0 24px 64px rgba(124,58,237,0.16); border-color: rgba(124,58,237,0.2); }

    .feat-card {
      background: rgba(255,255,255,0.75); backdrop-filter: blur(16px);
      border: 1px solid rgba(124,58,237,0.1); border-radius: 24px; padding: 30px;
      transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    .feat-card:hover { transform: translateY(-8px); box-shadow: 0 24px 64px rgba(124,58,237,0.14); border-color: rgba(124,58,237,0.22); }

    .step-card {
      background: rgba(255,255,255,0.75); backdrop-filter: blur(16px);
      border: 1.5px solid rgba(124,58,237,0.1); border-radius: 26px;
      padding: 32px 26px; cursor: pointer;
      transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    .step-card:hover, .step-card.active {
      border-color: #7C3AED; transform: translateY(-10px);
      box-shadow: 0 24px 64px rgba(124,58,237,0.18), 0 0 0 1px rgba(124,58,237,0.1);
    }

    .net-circle {
      position: absolute; transform: translate(-50%,-50%);
      cursor: pointer; animation: nodeFloat 4s ease-in-out infinite;
    }
    .net-circle:nth-child(2n) { animation-delay: 0.8s; }
    .net-circle:nth-child(3n) { animation-delay: 1.4s; }
    .net-circle:nth-child(4n) { animation-delay: 0.4s; }
    .net-circle:hover { z-index: 10; animation-play-state: paused; transform: translate(-50%,-50%) scale(1.3); transition: transform 0.3s; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,10,30,0.4);
      backdrop-filter: blur(12px); z-index: 105;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-card {
      background: rgba(255,255,255,0.98); border: 1px solid rgba(124,58,237,0.15);
      border-radius: 32px; box-shadow: 0 40px 100px rgba(15,10,30,0.15);
      max-width: 520px; width: 100%; padding: 32px; position: relative;
    }
    .modal-close {
      position: absolute; top: 18px; right: 18px;
      width: 40px; height: 40px; border: none; border-radius: 50%;
      background: rgba(124,58,237,0.08); color: #7C3AED;
      font-size: 20px; cursor: pointer; transition: background 0.2s;
    }
    .modal-close:hover { background: rgba(124,58,237,0.16); }

    .join-toast {
      position: fixed; left: 50%; bottom: 36px; transform: translate(-50%, 0);
      background: rgba(255,255,255,0.98); border: 1px solid rgba(37,211,102,0.25);
      border-radius: 20px; padding: 16px 22px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 24px 64px rgba(15,10,30,0.16);
      z-index: 120; max-width: 380px; animation: toastSlideUp 0.35s ease both;
    }

    .chat-widget {
      position: fixed; right: 24px; bottom: 24px;
      width: 380px; max-width: calc(100% - 40px); z-index: 110;
      display: flex; flex-direction: column; justify-content: flex-end; gap: 12px;
    }
    .chat-panel {
      background: #ffffff; border: 1px solid rgba(124,58,237,0.16);
      border-radius: 28px; box-shadow: 0 32px 80px rgba(124,58,237,0.2);
      overflow: hidden;
    }
    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; background: linear-gradient(135deg,#7C3AED,#DB2777); color: white;
    }
    .chat-body {
      max-height: 340px; overflow-y: auto; padding: 16px 20px 10px;
      display: flex; flex-direction: column; gap: 12px;
      background: #ffffff;
    }
    .chat-body::-webkit-scrollbar { width: 4px; }
    .chat-body::-webkit-scrollbar-track { background: transparent; }
    .chat-body::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 4px; }
    .chat-bubble {
      max-width: 85%; padding: 12px 16px; border-radius: 20px;
      font-size: 13.5px; line-height: 1.65;
    }
    .chat-bubble.bot {
      background: #f6f0ff; color: #2d1a4e;
      align-self: flex-start; border-bottom-left-radius: 6px;
    }
    .chat-bubble.user {
      background: linear-gradient(135deg,#7C3AED,#DB2777); color: #ffffff;
      align-self: flex-end; border-bottom-right-radius: 6px;
    }
    .chat-typing {
      align-self: flex-start; background: #f6f0ff;
      border-radius: 20px; border-bottom-left-radius: 6px;
      padding: 12px 18px; display: flex; gap: 5px; align-items: center;
    }
    .chat-typing span {
      width: 7px; height: 7px; background: #9b72ef; border-radius: 50%;
      display: inline-block; animation: typingDot 1.2s infinite;
    }
    .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
    .chat-suggestions {
      display: flex; flex-wrap: wrap; gap: 7px;
      padding: 4px 20px 14px; background: #ffffff;
    }
    .chat-suggestion {
      background: rgba(124,58,237,0.07); border: 1px solid rgba(124,58,237,0.18);
      color: #5b2ea6; padding: 7px 13px; border-radius: 999px;
      font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .chat-suggestion:hover { background: rgba(124,58,237,0.14); border-color: rgba(124,58,237,0.35); }
    .chat-input {
      display: flex; gap: 10px; align-items: center;
      padding: 12px 16px 16px; background: #ffffff;
      border-top: 1px solid rgba(124,58,237,0.08);
    }
    .chat-input input {
      flex: 1; border: 1.5px solid rgba(124,58,237,0.2); border-radius: 14px;
      padding: 11px 14px; font-size: 13px; outline: none;
      font-family: 'Inter', system-ui, sans-serif; transition: border-color 0.2s;
      background: #ffffff !important;
      color: #1a1a2e !important;
      -webkit-text-fill-color: #1a1a2e !important;
    }
    .chat-input input:focus { border-color: rgba(124,58,237,0.5); }
    .chat-input input::placeholder { color: #9ca3af !important; opacity: 1; }
    .chat-input button {
      border: none; background: linear-gradient(135deg,#7C3AED,#DB2777);
      color: white; border-radius: 14px; padding: 11px 18px;
      cursor: pointer; font-weight: 700; font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px; white-space: nowrap; transition: opacity 0.2s;
    }
    .chat-input button:hover { opacity: 0.9; }
    .chat-launcher {
      width: 64px; height: 64px; border-radius: 22px;
      background: linear-gradient(135deg,#7C3AED,#DB2777); border: none;
      color: white; font-size: 26px; box-shadow: 0 20px 48px rgba(124,58,237,0.35);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      align-self: flex-end; transition: transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s;
    }
    .chat-launcher:hover { transform: translateY(-4px) scale(1.06); box-shadow: 0 28px 56px rgba(124,58,237,0.45); }
    .chat-toast {
      position: fixed; right: 24px; bottom: 108px;
      background: rgba(255,255,255,0.98); border: 1px solid rgba(124,58,237,0.15);
      border-radius: 22px; padding: 16px 20px; box-shadow: 0 24px 60px rgba(124,58,237,0.14);
      z-index: 109; max-width: 320px; color: #2b1a4d;
    }

    .scroll-none::-webkit-scrollbar { display:none; }
    .scroll-none { -ms-overflow-style:none; scrollbar-width:none; }
    .nav-link {
      font-size: 14px; font-weight: 600; color: #444; cursor: pointer;
      transition: color 0.2s; background: none; border: none;
      font-family: 'Inter', system-ui, sans-serif; padding: 0;
    }
    .nav-link:hover { color: #7C3AED; }
    .footer-link {
      color: #5f4a7d; font-size: 14px; text-decoration: none; display: block;
      padding: 5px 0; cursor: pointer; transition: color 0.2s;
      background: none; border: none; font-family: 'Inter', system-ui, sans-serif; text-align: left;
    }
    .footer-link:hover { color: #7C3AED; }
    .join-badge { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .join-badge:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(124,58,237,0.22); }

    .resource-card {
      background: rgba(255,255,255,0.7); backdrop-filter: blur(16px);
      border: 1px solid rgba(124,58,237,0.12); border-radius: 20px; padding: 28px;
      transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
    }
    .resource-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(124,58,237,0.14); border-color: rgba(124,58,237,0.22); }

    .tech-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.75); backdrop-filter: blur(12px);
      border: 1px solid rgba(124,58,237,0.15); border-radius: 14px;
      padding: 12px 20px; font-size: 14px; font-weight: 700; color: #4c3270;
      transition: all 0.25s;
    }
    .tech-pill:hover { background: rgba(255,255,255,0.95); border-color: rgba(124,58,237,0.3); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(124,58,237,0.12); }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr !important; }
      .how-grid { grid-template-columns: 1fr !important; }
      .footer-grid { grid-template-columns: 1fr 1fr !important; }
      .bento-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; }
      .bento-large { grid-row: auto !important; }
      .two-col { grid-template-columns: 1fr !important; }
      .three-col { grid-template-columns: 1fr 1fr !important; }
      .four-col { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 600px) {
      .footer-grid { grid-template-columns: 1fr !important; }
      .bento-grid { grid-template-columns: 1fr !important; }
      .three-col { grid-template-columns: 1fr !important; }
      .four-col { grid-template-columns: 1fr !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `;
 useEffect(() => {
    window.scrollTo(0, 0);
  }, [showAboutUs]);

  if (showAboutUs) {
    return <AboutUs onBack={() => setShowAboutUs(false)} />;
  }

  const sectionLabel = (text: string) => (
    <div style={{ display: "inline-block", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "30px", padding: "7px 18px", fontSize: "12px", fontWeight: "700", color: "#7C3AED", marginBottom: "18px", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>{text}</div>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden", background: "linear-gradient(160deg,#fdf4ff 0%,#fce7f3 25%,#ede9fe 50%,#fdf4ff 75%,#fce7f3 100%)", backgroundSize: "300% 300%", backgroundAttachment: "fixed" }}>
      <style>{css}</style>

      {/* GRADIENT SPOTLIGHT */}
      <div className="spotlight" style={{ left: cursor.x, top: cursor.y }} />

      {/* BACKGROUND BLOBS */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)", top: "-200px", left: "-150px", animation: "orb1 14s ease-in-out infinite", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(219,39,119,0.1) 0%,transparent 70%)", bottom: "-100px", right: "5%", animation: "orb2 18s ease-in-out infinite", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.09) 0%,transparent 70%)", top: "45%", left: "35%", animation: "orb3 20s ease-in-out infinite", filter: "blur(48px)" }} />
      </div>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrollY > 40 ? "rgba(255,255,255,0.82)" : "transparent", backdropFilter: scrollY > 40 ? "blur(28px)" : "none", borderBottom: scrollY > 40 ? "1px solid rgba(124,58,237,0.1)" : "none", transition: "all 0.35s", padding: "0 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", height: "72px", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={logo} alt="EmpowerHer" style={{ width: "38px", height: "38px", objectFit: "contain" }} />
            <span style={{ fontWeight: "900", fontSize: "21px", background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EmpowerHer</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="nav-link" style={{ padding: "9px 18px", borderRadius: "12px" }} onClick={() => onSignIn?.() ?? onNavigate?.("signin")}>Sign In</button>
            <MagneticButton className="btn-primary" style={{ padding: "11px 24px", fontSize: "14px", borderRadius: "14px" }} onClick={() => onGetStarted?.() ?? onNavigate?.("signup")}>
              Get Started →
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", paddingTop: "88px", zIndex: 1 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 28px", width: "100%" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
            <div style={{ animation: "fadeSlideUp 0.9s ease both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "30px", padding: "9px 20px", fontSize: "13px", fontWeight: "700", color: "#7C3AED", marginBottom: "28px", boxShadow: "0 4px 20px rgba(124,58,237,0.1)" }}>
                ✨ India's #1 Platform for Women Founders
              </div>
              <h1 style={{ fontSize: "clamp(40px,5.5vw,68px)", fontWeight: "900", lineHeight: "1.05", marginBottom: "24px", color: "#0f0a1e", letterSpacing: "-1.5px" }}>
                Your{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777,#7C3AED)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradientShift 4s ease infinite" }}>Vision</span>
                {" "}Starts Here
              </h1>
              <p style={{ fontSize: "18px", color: "#5a4a6a", lineHeight: "1.8", marginBottom: "40px", maxWidth: "480px" }}>
                Join 50,000+ women entrepreneurs building the future. AI-powered mentor matching, ₹500Cr+ in funding access, and a community that lifts you up.
              </p>
              <div style={{ marginBottom: "36px", display: "flex", flexWrap: "wrap", gap: "14px" }}>
                <MagneticButton className="btn-primary" style={{ fontSize: "16px", padding: "18px 40px" }} onClick={() => onNavigate?.("signup")}>
                  Start Your Journey 🚀
                </MagneticButton>
              </div>
              <StatsRow />
            </div>
            <div style={{ position: "relative", height: "540px", animation: "fadeSlideUp 0.9s 0.2s ease both" }}>
              {FLOAT_BADGES.map((b, i) => (
                <div key={i} style={{ position: "absolute", top: b.top, left: b.left, right: b.right, bottom: b.bottom, background: "rgba(255,255,255,0.82)", backdropFilter: "blur(20px)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: "16px", padding: "10px 18px", display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", fontWeight: "700", color: b.color, boxShadow: "0 8px 30px rgba(124,58,237,0.12)", whiteSpace: "nowrap", animation: `badgeFloat 3.5s ${b.delay} ease-in-out infinite`, zIndex: 10 }}>
                  <span style={{ fontSize: "15px" }}>{b.icon}</span>{b.label}
                </div>
              ))}
              {[
                { src: FOUNDER_IMAGES[0], style: { left: "4%", top: "5%", width: "200px", height: "265px", animation: "imgFloat1 6s ease-in-out infinite", zIndex: 3 }, overlay: "#7C3AED30" },
                { src: FOUNDER_IMAGES[1], style: { right: "1%", top: "1%", width: "175px", height: "235px", animation: "imgFloat2 7s 0.5s ease-in-out infinite", zIndex: 2 }, overlay: "#DB277730" },
                { src: FOUNDER_IMAGES[2], style: { left: "37%", top: "24%", width: "195px", height: "255px", animation: "imgFloat3 5.5s 1s ease-in-out infinite", zIndex: 4 }, overlay: "#7C3AED25" },
                { src: FOUNDER_IMAGES[3], style: { left: "1%", bottom: "2%", width: "160px", height: "205px", animation: "imgFloat4 8s 0.8s ease-in-out infinite", zIndex: 3 }, overlay: null },
                { src: FOUNDER_IMAGES[4], style: { right: "3%", bottom: "0%", width: "170px", height: "215px", animation: "imgFloat5 6.5s 1.5s ease-in-out infinite", zIndex: 3 }, overlay: null },
              ].map((img, i) => (
                <div key={i} style={{ position: "absolute", ...img.style, borderRadius: "22px", overflow: "hidden", boxShadow: "0 24px 64px rgba(124,58,237,0.22)", border: "3px solid rgba(255,255,255,0.9)", transform: `translate(${heroParallax.x * (i % 2 === 0 ? 0.6 : -0.4)}px, ${heroParallax.y * (i % 2 === 0 ? 0.4 : -0.3)}px)`, transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1)" }}>
                  <img src={img.src} alt="Founder" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  {img.overlay && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg,transparent 55%,${img.overlay} 100%)` }} />}
                </div>
              ))}
              <div style={{ position: "absolute", width: "280px", height: "280px", borderRadius: "50%", background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(219,39,119,0.12))", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1, animation: "pulse 5s ease-in-out infinite", filter: "blur(12px)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section style={{ padding: "110px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              {sectionLabel("FEATURES")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", marginBottom: "16px", letterSpacing: "-0.8px" }}>
                Everything You Need to{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Succeed</span>
              </h2>
              <p style={{ fontSize: "18px", color: "#7a6a8a", maxWidth: "480px", margin: "0 auto", lineHeight: "1.7" }}>
                Built by founders, for founders. Every tool removes a barrier between your vision and reality.
              </p>
            </div>
          </Reveal>
          <div className="bento-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "auto auto", gap: "16px" }}>
            <Reveal delay={0.05}>
              <div id="mentor-matching" className="feat-card bento-large" style={{ gridRow: "1 / 3", background: "linear-gradient(160deg,rgba(124,58,237,0.06),rgba(219,39,119,0.04))", minHeight: "360px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <div>
                  <div style={{ fontSize: "52px", marginBottom: "22px", filter: "drop-shadow(0 4px 12px rgba(124,58,237,0.25))" }}>🧠</div>
                  <h3 style={{ fontSize: "26px", fontWeight: "900", color: "#0f0a1e", marginBottom: "14px", letterSpacing: "-0.3px" }}>AI Mentor Matching</h3>
                  <p style={{ fontSize: "16px", color: "#6a5a7a", lineHeight: "1.75" }}>Our AI analyzes your industry, stage, funding needs, and goals to pair you with mentors who've walked your exact path — same sector, same challenges, proven results.</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "28px" }}>
                  {["Industry Match", "Stage-Aware", "Goals-Based", "AI-Powered"].map((t) => (
                    <span key={t} style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", border: "1px solid rgba(124,58,237,0.15)" }}>{t}</span>
                  ))}
                </div>
              </div>
            </Reveal>
            {[
              { icon: "💸", title: "Funding Access", desc: "₹500Cr+ in grants, angels & VCs for women-led startups.", delay: 0.1 },
              { icon: "📚", title: "Training Hub", desc: "200+ courses built by and for female founders.", delay: 0.15 },
              { icon: "🎤", title: "Pitch Lab", desc: "Submit, rehearse, and perfect your pitch with live expert feedback.", delay: 0.2 },
              { icon: "🌐", title: "Global Community", desc: "50K+ founders across 40 countries — find co-founders and cheerleaders.", delay: 0.25 },
            ].map((f, i) => (
              <Reveal key={i} delay={f.delay}>
                <div className="feat-card" style={{ height: "100%" }}>
                  <div style={{ fontSize: "34px", marginBottom: "14px", filter: "drop-shadow(0 2px 8px rgba(124,58,237,0.2))" }}>{f.icon}</div>
                  <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f0a1e", marginBottom: "8px" }}>{f.title}</h3>
                  <p style={{ fontSize: "14px", color: "#7a6a8a", lineHeight: "1.65" }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "110px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              {sectionLabel("YOUR JOURNEY")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                From Idea to{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Funded Startup</span>
              </h2>
            </div>
          </Reveal>
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "22px", position: "relative" }}>
            <div style={{ position: "absolute", top: "50px", left: "calc(16.6% + 20px)", right: "calc(16.6% + 20px)", height: "2px", background: "linear-gradient(90deg,#7C3AED,#DB2777)", zIndex: 0, opacity: 0.5 }} />
            {[
              { num: "01", title: "Create Your Profile", desc: "Tell us your startup story, industry, stage, and goals. Under 5 minutes.", img: FOUNDER_IMAGES[6], icon: "✍️", delay: 0 },
              { num: "02", title: "Get AI-Matched", desc: "Our AI scans 1,200+ mentors and surfaces your top matches with compatibility scores.", img: FOUNDER_IMAGES[7], icon: "🤖", delay: 0.1 },
              { num: "03", title: "Scale & Succeed", desc: "Access funding, training, pitch labs, and a 50K-strong community. Grow week by week.", img: FOUNDER_IMAGES[3], icon: "🚀", delay: 0.2 },
            ].map((step, i) => (
              <Reveal key={i} delay={step.delay}>
                <div className={`step-card${activeStep === i ? " active" : ""}`} style={{ zIndex: 1, position: "relative" }} onClick={() => setActiveStep(i)}>
                  <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: activeStep === i ? "linear-gradient(135deg,#7C3AED,#DB2777)" : "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", border: activeStep === i ? "none" : "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "20px", transition: "all 0.35s", boxShadow: activeStep === i ? "0 8px 24px rgba(124,58,237,0.3)" : "0 2px 8px rgba(124,58,237,0.08)" }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#DB2777", letterSpacing: "1.5px", marginBottom: "8px" }}>STEP {step.num}</div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f0a1e", marginBottom: "10px" }}>{step.title}</h3>
                  <p style={{ fontSize: "14px", color: "#7a6a8a", lineHeight: "1.65", marginBottom: "18px" }}>{step.desc}</p>
                  <div style={{ borderRadius: "16px", overflow: "hidden", height: "120px" }}>
                    <img src={step.img} alt="Founder" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.4s", transform: activeStep === i ? "scale(1.06)" : "scale(1)" }} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY NETWORK ── */}
      <section id="community" style={{ padding: "110px 28px", position: "relative", zIndex: 1, overflow: "hidden" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "52px" }}>
              {sectionLabel("COMMUNITY")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                You're Never{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Building Alone</span>
              </h2>
              <p style={{ fontSize: "17px", color: "#7a6a8a", maxWidth: "520px", margin: "14px auto 0", lineHeight: "1.7" }}>
                EmpowerHer's Founders Circle is a living network of 50,000+ women entrepreneurs across 40 countries. Daily check-ins, peer introductions, and mentor office hours keep momentum going through every hard week.
              </p>
            </div>
          </Reveal>
          <div style={{ position: "relative", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", borderRadius: "32px", overflow: "hidden", height: "400px", border: "1px solid rgba(124,58,237,0.12)", boxShadow: "0 16px 60px rgba(124,58,237,0.08)" }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 900 400" preserveAspectRatio="xMidYMid meet">
              <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#DB2777" /></linearGradient></defs>
              {NETWORK_FOUNDERS.map((f, i) =>
                NETWORK_FOUNDERS.slice(i + 1).map((f2, j) => {
                  const fx = (f.xPct / 100) * 900; const f2x = (f2.xPct / 100) * 900;
                  const dist = Math.hypot(fx - f2x, f.y - f2.y);
                  if (dist > 300) return null;
                  return <line key={`${i}-${j}`} x1={fx} y1={f.y} x2={f2x} y2={f2.y} stroke="url(#cg)" strokeWidth="1.5" strokeOpacity="0.2" strokeDasharray="5 8" style={{ animation: `connPulse 3s ${i * 0.3}s ease-in-out infinite` }} />;
                })
              )}
            </svg>
            {NETWORK_FOUNDERS.map((f, i) => (
              <div key={i} className="net-circle" style={{ left: `${f.xPct}%`, top: `${f.y}px`, zIndex: 2, animationDelay: `${i * 0.3}s` }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: `3px solid ${f.color}`, overflow: "hidden", boxShadow: `0 6px 24px ${f.color}55`, background: "white" }}>
                  <img src={f.img} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </div>
                <div style={{ position: "absolute", bottom: "-22px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: "700", color: f.color, whiteSpace: "nowrap", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", padding: "2px 8px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
                  {f.name}
                </div>
              </div>
            ))}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "linear-gradient(135deg,#7C3AED,#DB2777)", color: "white", borderRadius: "22px", padding: "16px 26px", textAlign: "center", boxShadow: "0 12px 40px rgba(124,58,237,0.35)", zIndex: 5 }}>
              <div style={{ fontSize: "26px", fontWeight: "900" }}>50K+</div>
              <div style={{ fontSize: "12px", fontWeight: "600", opacity: 0.9 }}>Founders Connected</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "110px 0", position: "relative", zIndex: 1, overflow: "hidden" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px", marginBottom: "48px" }}>
          <Reveal>
            <div style={{ textAlign: "center" }}>
              {sectionLabel("SUCCESS STORIES")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                Founders Who{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Made It</span>
              </h2>
            </div>
          </Reveal>
        </div>
        <div ref={scrollRef} className="scroll-none" style={{ display: "flex", gap: "22px", padding: "16px 44px 30px", overflowX: "auto" }}>
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      </section>

      {/* ── LEARNING HUB ── */}
      <section id="learning-hub" style={{ padding: "110px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              {sectionLabel("LEARNING HUB")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                Learn From{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Those Who've Done It</span>
              </h2>
              <p style={{ fontSize: "17px", color: "#7a6a8a", maxWidth: "540px", margin: "14px auto 0", lineHeight: "1.7" }}>
                200+ courses crafted by founders who've raised, scaled, and exited. Pick your track and go at your pace.
              </p>
            </div>
          </Reveal>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[
              { icon: "🚀", title: "Startup Foundations", desc: "Validate your idea, write your first pitch deck, and build your MVP roadmap in 4 weeks.", lessons: "12 lessons", level: "Beginner", color: "#7C3AED" },
              { icon: "💰", title: "Fundraising Masterclass", desc: "From bootstrapping to Series A — learn how to talk to investors, structure your ask, and close fast.", lessons: "18 lessons", level: "Intermediate", color: "#DB2777" },
              { icon: "📈", title: "Growth & GTM", desc: "Acquire your first 1,000 customers without a big budget. Playbooks from D2C, SaaS, and marketplace founders.", lessons: "15 lessons", level: "Intermediate", color: "#7C3AED" },
              { icon: "🤝", title: "Negotiation & Deals", desc: "Salary, equity, contracts, term sheets. Know what every clause means before you sign.", lessons: "10 lessons", level: "Advanced", color: "#DB2777" },
              { icon: "🧠", title: "Founder Mindset", desc: "Resilience, decision-making under pressure, and building teams that don't burn out — including you.", lessons: "8 lessons", level: "All Levels", color: "#7C3AED" },
              { icon: "🌍", title: "Global Expansion", desc: "How to take your India-built startup into Southeast Asia, the Middle East, and beyond.", lessons: "14 lessons", level: "Advanced", color: "#DB2777" },
            ].map((course, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="resource-card" style={{ height: "100%" }}>
                  <div style={{ fontSize: "38px", marginBottom: "14px" }}>{course.icon}</div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={{ background: `${course.color}18`, color: course.color, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700" }}>{course.level}</span>
                    <span style={{ background: "rgba(124,58,237,0.06)", color: "#7a6a8a", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "600" }}>{course.lessons}</span>
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f0a1e", marginBottom: "10px" }}>{course.title}</h3>
                  <p style={{ fontSize: "14px", color: "#7a6a8a", lineHeight: "1.65", marginBottom: "18px" }}>{course.desc}</p>
                  <button className="btn-outline" style={{ padding: "10px 22px", fontSize: "13px", borderRadius: "12px" }} onClick={() => onNavigate?.("signup")}>Start Learning →</button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESOURCES ── */}
      <section id="resources" style={{ padding: "110px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              {sectionLabel("RESOURCES")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                Tools &{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Guides for Every Stage</span>
              </h2>
              <p style={{ fontSize: "17px", color: "#7a6a8a", maxWidth: "520px", margin: "14px auto 0", lineHeight: "1.7" }}>
                Free, practical resources built for women entrepreneurs navigating India's startup ecosystem.
              </p>
            </div>
          </Reveal>
          <div className="four-col" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
            {[
              { icon: "📄", title: "Pitch Deck Template", desc: "A 12-slide investor-ready template used by EmpowerHer founders to raise ₹2Cr+.", tag: "Template", color: "#7C3AED" },
              { icon: "📊", title: "Funding Tracker", desc: "Track investor conversations, follow-ups, and term sheet status in one clean sheet.", tag: "Spreadsheet", color: "#DB2777" },
              { icon: "🗺️", title: "Startup Roadmap", desc: "Week-by-week guide from idea validation to your first paying customer in 90 days.", tag: "Guide", color: "#7C3AED" },
              { icon: "💌", title: "Cold Outreach Toolkit", desc: "Email scripts for reaching investors, mentors, and potential co-founders — that actually get replies.", tag: "Toolkit", color: "#DB2777" },
              { icon: "⚖️", title: "Equity 101", desc: "Plain-English explainer on cap tables, vesting schedules, and founder dilution.", tag: "Explainer", color: "#7C3AED" },
              { icon: "🧾", title: "Founder Contracts", desc: "Co-founder agreement, advisor equity, and NDA templates reviewed by startup lawyers.", tag: "Legal", color: "#DB2777" },
              { icon: "📱", title: "Social Playbook", desc: "Build a founder personal brand on LinkedIn and Twitter that attracts investors and talent.", tag: "Playbook", color: "#7C3AED" },
              { icon: "🎯", title: "OKR Framework", desc: "Set and track goals the way top-funded startups do — simple, measurable, motivating.", tag: "Framework", color: "#DB2777" },
            ].map((r, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="resource-card" style={{ cursor: "pointer" }} onClick={() => onNavigate?.("signup")}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>{r.icon}</div>
                  <span style={{ background: `${r.color}15`, color: r.color, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", display: "inline-block", marginBottom: "10px" }}>{r.tag}</span>
                  <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f0a1e", marginBottom: "8px" }}>{r.title}</h3>
                  <p style={{ fontSize: "13px", color: "#7a6a8a", lineHeight: "1.6" }}>{r.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT PROJECT ── */}
   <section id="about-project" style={{ padding: "110px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              {sectionLabel("ABOUT PROJECT")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                Why We{" "}
            <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Built EmpowerHer</span>
              </h2>
              <button
onClick={() => { setShowAboutUs(true); window.scrollTo(0, 0); }}
                style={{
                  marginTop: "22px",
                  background: "linear-gradient(135deg,#7C3AED,#DB2777)",
                  color: "white", border: "none", borderRadius: "16px",
                  padding: "13px 30px", fontSize: "14px", fontWeight: "800",
                  cursor: "pointer", fontFamily: "'Inter', system-ui, sans-serif",
                  boxShadow: "0 10px 30px rgba(124,58,237,0.25)",
                  transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(124,58,237,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(124,58,237,0.25)"; }}
              >
                Meet Our Team →
              </button>
            </div>
          </Reveal>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "start" }}>
            <Reveal delay={0.05}>
              <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: "28px", padding: "40px" }}>
                <div style={{ fontSize: "44px", marginBottom: "20px" }}>💡</div>
                <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#0f0a1e", marginBottom: "16px" }}>The Problem</h3>
                <p style={{ fontSize: "15px", color: "#6a5a7a", lineHeight: "1.8" }}>
                  Women-led startups receive less than 2% of total VC funding in India, despite evidence that diverse founding teams consistently outperform. The gap isn't talent — it's access. Access to the right mentors, the right rooms, and the right information at the right time.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ background: "linear-gradient(160deg,rgba(124,58,237,0.07),rgba(219,39,119,0.05))", backdropFilter: "blur(20px)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "28px", padding: "40px" }}>
                <div style={{ fontSize: "44px", marginBottom: "20px" }}>🎯</div>
                <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#0f0a1e", marginBottom: "16px" }}>Our Mission</h3>
                <p style={{ fontSize: "15px", color: "#6a5a7a", lineHeight: "1.8" }}>
                  EmpowerHer is a capstone project designed to demonstrate how AI-powered matching, curated community, and structured learning can close the access gap. Every feature here is built around one question: what does a first-generation woman founder actually need to succeed?
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: "28px", padding: "40px" }}>
                <div style={{ fontSize: "44px", marginBottom: "20px" }}>🌱</div>
                <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#0f0a1e", marginBottom: "16px" }}>Our Approach</h3>
                <p style={{ fontSize: "15px", color: "#6a5a7a", lineHeight: "1.8" }}>
                  We focused on three pillars: intelligent mentor matching that goes beyond keywords, a funding access layer that surfaces relevant opportunities without gatekeepers, and a learning hub built from practitioner knowledge rather than theory.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: "28px", padding: "40px" }}>
                <div style={{ fontSize: "44px", marginBottom: "20px" }}>📐</div>
                <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#0f0a1e", marginBottom: "16px" }}>Objectives</h3>
                <div id="objectives" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    "Build an AI mentor-matching system with measurable compatibility scores",
                    "Create a curated funding database accessible without prior network",
                    "Design a learning platform adapted to founder time constraints",
                    "Demonstrate the role of community in reducing founder dropout rates",
                  ].map((obj, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#DB2777)", color: "white", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
                      <p style={{ fontSize: "14px", color: "#5a4a6a", lineHeight: "1.65" }}>{obj}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {showTeam && (
            <Reveal delay={0.05}>
              <div style={{ marginTop: "60px" }}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a855f7", marginBottom: "12px" }}>The People Behind It</p>
                  <h3 style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 900, color: "#0f0a1e" }}>Meet The Creators</h3>
                </div>
                <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                  {[
                    { name: "Sanjana Kotian", role: "Co-Creator & Developer", initials: "SK" },
                    { name: "Swapnil Kadam", role: "Co-Creator & Developer", initials: "SK" },
                    { name: "Hemangi Purkar", role: "Co-Creator & Developer", initials: "HP" },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className="glass-card"
                      style={{ padding: "32px", textAlign: "center", position: "relative", overflow: "hidden" }}
                    >
                      <div style={{ position: "absolute", insetInline: 0, top: 0, height: "70px", background: "linear-gradient(135deg,#7C3AED,#DB2777)", opacity: 0.6 }} />
                      <div
                        style={{
                          position: "relative", width: "76px", height: "76px", borderRadius: "50%",
                          margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "20px", fontWeight: 800,
                          background: "linear-gradient(135deg,#7C3AED,#DB2777)",
                          border: "4px solid white", boxShadow: "0 10px 28px rgba(124,58,237,0.3)",
                        }}
                      >
                        {c.initials}
                      </div>
                      <h4 style={{ position: "relative", fontSize: "16px", fontWeight: 800, color: "#0f0a1e" }}>{c.name}</h4>
                      <p style={{ position: "relative", fontSize: "12px", color: "#9a8aaa", marginTop: "4px" }}>{c.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "110px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              {sectionLabel("FAQs")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                Questions{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Answered</span>
              </h2>
              <p style={{ fontSize: "17px", color: "#7a6a8a", maxWidth: "460px", margin: "14px auto 0", lineHeight: "1.7" }}>
                Everything you need to know before signing up.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { q: "Is EmpowerHer free to join?", a: "Yes — creating a profile, browsing mentors, and accessing the community are all free. Premium features like unlimited mentor sessions and the full course library are available on paid plans once the platform launches publicly." },
              { q: "Who are the mentors on the platform?", a: "Mentors are vetted women (and allies) who have founded, scaled, or funded startups in India and globally. Every mentor profile shows their sector, funding stage expertise, and verified track record before you request a match." },
              { q: "How does AI mentor matching actually work?", a: "When you complete your founder profile, we generate an embedding of your startup context — industry, stage, goals, and specific challenges. We then compare that vector against all mentor profiles to surface compatibility scores. The top matches are ranked and explained in plain language." },
              { q: "I'm just starting out. Is this platform for me?", a: "Absolutely. Roughly 40% of our community is pre-revenue. The platform is designed for every stage from idea to Series B. The Learning Hub is especially useful if you're in the early validation phase." },
              { q: "How is this different from LinkedIn or other networks?", a: "LinkedIn is a broadcast network. EmpowerHer is a structured support system. Every feature — mentor matching, funding access, the learning hub — is built around the specific needs of women founders, not repurposed from generic professional networking." },
              { q: "Is this a real product or a project?", a: "EmpowerHer is currently a capstone project demonstrating what a purpose-built platform for women entrepreneurs could look like. The architecture, matching logic, and community features are fully designed and partially implemented. A production launch would follow with real mentor onboarding and funding partnerships." },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <FAQItem q={item.q} a={item.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: "110px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              {sectionLabel("CONTACT")}
              <h2 style={{ fontSize: "clamp(32px,4.5vw,54px)", fontWeight: "900", color: "#0f0a1e", letterSpacing: "-0.8px" }}>
                Get in{" "}
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Touch</span>
              </h2>
              <p style={{ fontSize: "17px", color: "#7a6a8a", maxWidth: "460px", margin: "14px auto 0", lineHeight: "1.7" }}>
                Questions about the project, partnerships, or mentor onboarding? We'd love to hear from you.
              </p>
            </div>
          </Reveal>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "28px", alignItems: "start" }}>
            <Reveal delay={0.05}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { icon: "📧", label: "Email", value: "support@empowerher.in", sub: "Response within 24 hours" },
                  { icon: "💼", label: "Partnerships", value: "partners@empowerher.in", sub: "Investor & mentor onboarding" },
                  { icon: "🏫", label: "Academic Enquiries", value: "research@empowerher.in", sub: "Capstone & collaboration" },
                ].map((c, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(124,58,237,0.1)", borderRadius: "20px", padding: "22px 24px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "26px", flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#7C3AED", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>{c.label}</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "2px" }}>{c.value}</div>
                      <div style={{ fontSize: "12px", color: "#9a8aaa" }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: "28px", padding: "36px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f0a1e", marginBottom: "24px" }}>Send a message</h3>
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "130px 28px", background: "linear-gradient(160deg,#7C3AED 0%,#a855f7 40%,#DB2777 100%)", position: "relative", overflow: "hidden", zIndex: 1 }}>
        <div style={{ position: "absolute", width: "700px", height: "700px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: "-250px", right: "-100px", pointerEvents: "none", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: "-180px", left: "-100px", pointerEvents: "none", filter: "blur(40px)" }} />
        <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div className="join-badge" onClick={() => setJoinPopupOpen(true)} style={{ display: "inline-block", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", borderRadius: "30px", padding: "7px 20px", fontSize: "13px", fontWeight: "700", color: "white", marginBottom: "26px", border: "1px solid rgba(255,255,255,0.25)" }}>
            ✨ Join 50,000+ women building the future
          </div>
          <h2 style={{ fontSize: "clamp(36px,5.5vw,64px)", fontWeight: "900", color: "white", lineHeight: "1.08", marginBottom: "20px", letterSpacing: "-1.5px" }}>
            The World Needs Your Startup. We'll Help You Build It.
          </h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.82)", marginBottom: "48px", lineHeight: "1.7" }}>
            Stop waiting for the perfect moment. Your vision deserves resources, mentors, and a community behind it — starting today.
          </p>
          <div style={{ marginTop: "40px", display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap" }}>
            {["No credit card required", "Free to get started", "Cancel anytime"].map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: "600" }}>
                <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>✓</span> {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODALS ── */}
      {communityModalOpen && (
        <div className="modal-backdrop" onClick={() => setCommunityModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCommunityModalOpen(false)}>×</button>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>EmpowerHer Community</div>
              <h3 style={{ fontSize: "30px", fontWeight: 900, color: "#0f0a1e", lineHeight: 1.1, marginBottom: "14px" }}>Join 50,000+ women founders, mentors and investors.</h3>
              <p style={{ color: "#5f4a7d", fontSize: "15px", lineHeight: 1.8 }}>Get instant access to curated introductions, peer workshops, live founder circles, and funding clinics designed for women-led startups.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
              {["Founder circles", "Mentor matching", "Pitch practice", "Funding clinics"].map((item) => (
                <div key={item} style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.06),rgba(219,39,119,0.04))", borderRadius: "18px", padding: "18px", color: "#4c3270", fontWeight: 700, fontSize: "13px", border: "1px solid rgba(124,58,237,0.1)" }}>{item}</div>
              ))}
            </div>
            <MagneticButton className="btn-primary" style={{ width: "100%", fontSize: "15px", padding: "18px" }} onClick={confirmCommunityJoin}>
              Yes, save my spot
            </MagneticButton>
          </div>
        </div>
      )}
      {joinPopupOpen && <JoinCommunityModal onClose={() => setJoinPopupOpen(false)} onJoined={handleJoinPopupConfirm} />}
      {joinToastOpen && <JoinSuccessToast onDone={() => setJoinToastOpen(false)} />}

      {/* ── CHAT WIDGET ── */}
      <div className="chat-widget">
        {chatOpen ? (
          <div className="chat-panel">
            {/* Header */}
            <div className="chat-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🤖</div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 800 }}>Mercia</div>
                  <div style={{ fontSize: "11px", opacity: 0.85, display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    AI startup concierge · online
                  </div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "12px", padding: "7px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: "600" }}>Close</button>
            </div>

            {/* Messages */}
            <div className="chat-body" ref={chatBodyRef}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.from}`}>{msg.text}</div>
              ))}
              {isTyping && (
                <div className="chat-typing">
                  <span /><span /><span />
                </div>
              )}
            </div>

            {/* Quick suggestions — only show when not mid-conversation */}
            {chatMessages.length <= 1 && (
              <div className="chat-suggestions">
                {["How do I prepare a pitch?", "Find me a mentor", "Best seed funding strategy", "How does AI matching work?"].map((s) => (
                  <button key={s} className="chat-suggestion" onClick={() => handleSuggestionClick(s)}>{s}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chat-input">
              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isTyping && handleChatSend()}
                placeholder="Ask Mercia anything..."
                disabled={isTyping}
              />
              <button onClick={handleChatSend} disabled={isTyping || !chatMessage.trim()}>Send</button>
            </div>
          </div>
        ) : (
          <button className="chat-launcher" onClick={() => setChatOpen(true)}>💬</button>
        )}
      </div>

      {communityJoined && !communityModalOpen && (
        <div className="chat-toast">
          <strong>Welcome to the community!</strong>
          <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#4d3c70" }}>You're now part of 50K+ founders. Check your inbox for exclusive mentor invites.</p>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", padding: "90px 28px 44px", borderTop: "1px solid rgba(124,58,237,0.08)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "52px", marginBottom: "60px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <img src={logo} alt="EmpowerHer" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
                <span style={{ fontWeight: "900", fontSize: "20px", background: "linear-gradient(135deg,#7C3AED,#DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EmpowerHer</span>
              </div>
              <p style={{ color: "#6a5a7a", fontSize: "14px", lineHeight: "1.8", maxWidth: "240px" }}>Empowering women entrepreneurs to build the future, one funded startup at a time.</p>
            </div>
            <div>
              <h4 style={{ fontWeight: "800", fontSize: "14px", marginBottom: "20px", color: "#1a1a2e", letterSpacing: "-0.2px" }}>Platform</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button className="footer-link" onClick={() => scrollTo("mentor-matching")}>Mentor Matching</button>
                <button className="footer-link" onClick={() => scrollTo("community")}>Community</button>
                <button className="footer-link" onClick={() => scrollTo("learning-hub")}>Learning Hub</button>
                <button className="footer-link" onClick={() => scrollTo("resources")}>Resources</button>
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: "800", fontSize: "14px", marginBottom: "20px", color: "#1a1a2e", letterSpacing: "-0.2px" }}>Project</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button className="footer-link" onClick={() => scrollTo("about-project")}>About Project</button>
                <button className="footer-link" onClick={() => scrollTo("about-project")}>Objectives</button>
                <button className="footer-link" onClick={() => scrollTo("contact")}>Contact</button>
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: "800", fontSize: "14px", marginBottom: "20px", color: "#1a1a2e", letterSpacing: "-0.2px" }}>Support</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button className="footer-link" onClick={() => scrollTo("faq")}>FAQs</button>
                <button className="footer-link" onClick={() => scrollTo("contact")}>Feedback</button>
                <button className="footer-link" onClick={() => scrollTo("contact")}>Help</button>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(124,58,237,0.1)", paddingTop: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
            <p style={{ color: "#7a6a8a", fontSize: "13px" }}>© 2026 EmpowerHer. A capstone project built with ❤️ for women entrepreneurs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;