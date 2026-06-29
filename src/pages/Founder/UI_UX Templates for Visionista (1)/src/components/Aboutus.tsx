import logo from "../../../../../logo.png"; // adjust this path if AboutUs.tsx lives in a different folder than LandingPage.tsx

function AboutUs({ onBack }: { onBack: () => void }) {
  const features = [
    { icon: "🤝", title: "Mentor Matching", desc: "Get paired with founders and operators who've walked the path before you." },
    { icon: "📊", title: "Pitch Center", desc: "Build, refine, and submit pitch decks that actually get read." },
    { icon: "💰", title: "Funding", desc: "Discover grants, schemes, and investor-ready funding opportunities." },
    { icon: "🤝🏽", title: "Investor Deal Room", desc: "Move from intro to term sheet in one focused, trackable space." },
    { icon: "🎓", title: "Startup Training", desc: "Structured modules covering everything from cap tables to GTM." },
    { icon: "✨", title: "AI Assistant", desc: "An always-on co-pilot for questions, drafts, and decisions." },
  ];

  const stats = [
    { value: "500+", label: "Women Founders" },
    { value: "120+", label: "Expert Mentors" },
    { value: "₹2Cr+", label: "Funding Facilitated" },
    { value: "35+", label: "Cities Reached" },
  ];

  const whyUs = [
    { title: "Built for Women, By Design", desc: "Every feature is designed around the real constraints and ambitions of women founders — not retrofitted." },
    { title: "Curated, Not Crowdsourced", desc: "Mentors and investors are vetted. Quality over quantity, every time." },
    { title: "End-to-End Journey", desc: "From your first idea to your first term sheet, one platform carries you the whole way." },
    { title: "Community That Shows Up", desc: "Founders helping founders — peer support that doesn't disappear after the demo day." },
  ];

  const creators = [
    { name: "Sanjana Kotian", role: "Co-Creator & Developer", initials: "SK" },
    { name: "Swapnil Kadam", role: "Co-Creator & Developer", initials: "SK" },
    { name: "Hemangi Purkar", role: "Co-Creator & Developer", initials: "HP" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(160deg, #faf5ff 0%, #fdf2f8 45%, #f5f3ff 100%)" }}>

      {/* ── Floating ambient blobs ── */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse" style={{ background: "radial-gradient(circle, #9333ea, transparent)" }} />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, #db2777, transparent)" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #c026d3, transparent)" }} />

      <div className="relative max-w-6xl mx-auto px-6 py-20">

        {/* ══ Hero ══ */}
        <div className="text-center mb-24">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 "
          >
            <img
              src={logo}
              alt="EmpowerHer"
              className="w-100 h-100 object-contain"
            />
          </div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ color: "#a855f7" }}>
            Empowering Women in Business
          </p>
          <h1
            className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight"
            style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Where Women Founders<br className="hidden sm:block" /> Build What's Next
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            EmpowerHer is the ecosystem behind ambitious women — mentorship, funding, training,
            and a community built to turn first ideas into first revenue.
          </p>
        </div>

        {/* ══ Our Story ══ */}
        <div
          className="relative rounded-[28px] p-10 mb-24 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(147,51,234,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(147,51,234,0.1)" }}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
          />
          <div className="relative grid md:grid-cols-[auto,1fr] gap-8 items-start">
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "#db2777" }}>Our Story</span>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                EmpowerHer began with a simple observation: women founders weren't short on ideas —
                they were short on access. Access to mentors who understood their context, capital
                that didn't come with second-guessing, and a community that took their ambition seriously.
              </p>
              <p>
                So we built the platform we wished existed: a single home for mentorship, pitch
                readiness, training, and funding — designed specifically around how women build
                businesses, not adapted from someone else's blueprint.
              </p>
            </div>
          </div>
        </div>

        {/* ══ Feature Showcase ══ */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#3b0764" }}>Everything You Need, One Platform</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Six tools built to move you from idea to investment-ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2 cursor-default"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(147,51,234,0.12)", backdropFilter: "blur(16px)", boxShadow: "0 8px 30px rgba(147,51,234,0.06)" }}
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.08), rgba(219,39,119,0.08))" }}
                />
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #f3e8ff, #fce7f3)" }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#3b0764" }}>{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ Impact Stats ══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-24">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative rounded-2xl p-6 text-center overflow-hidden transition-transform duration-300 hover:scale-[1.04]"
              style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", boxShadow: "0 10px 30px rgba(147,51,234,0.25)" }}
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-white/80 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ══ Vision & Mission ══ */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {[
            { tag: "Our Vision", title: "A world where funding follows merit, not gender.", desc: "We envision an entrepreneurial landscape where every woman with a viable idea has equal access to the capital, guidance, and network needed to build it." },
            { tag: "Our Mission", title: "Equip. Connect. Fund.", desc: "We equip founders with skills, connect them to mentors and investors who care, and help unlock the funding that turns plans into companies." },
          ].map((v) => (
            <div
              key={v.tag}
              className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(147,51,234,0.15)", backdropFilter: "blur(18px)" }}
            >
              <span
                className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", color: "#fff" }}
              >
                {v.tag}
              </span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#3b0764" }}>{v.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* ══ Why Choose EmpowerHer ══ */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#3b0764" }}>Why Choose EmpowerHer</h2>
            <p className="text-gray-500 max-w-lg mx-auto">We're not the only platform for founders. Here's why women choose us.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {whyUs.map((w) => (
              <div
                key={w.title}
                className="flex gap-4 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
                style={{ background: "#fff", border: "1.5px solid #f3e8ff" }}
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
                >
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "#3b0764" }}>{w.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ Meet The Creators ══ */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "#a855f7" }}>The People Behind It</p>
            <h2 className="text-3xl font-extrabold" style={{ color: "#3b0764" }}>Meet The Creators</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {creators.map((c) => (
              <div
                key={c.name}
                className="group relative rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(147,51,234,0.15)", backdropFilter: "blur(18px)", boxShadow: "0 10px 36px rgba(147,51,234,0.08)" }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-24 rounded-t-3xl opacity-60"
                  style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
                />
                <div
                  className="relative w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #9333ea, #db2777)" }}
                >
                  {c.initials}
                </div>
                <h3 className="relative text-base font-bold" style={{ color: "#3b0764" }}>{c.name}</h3>
                <p className="relative text-xs text-gray-400 mt-1">{c.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CTA ══ */}
        <div
          className="relative rounded-[32px] p-12 text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #9333ea, #db2777)", boxShadow: "0 25px 70px rgba(147,51,234,0.35)" }}
        >
          <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-white opacity-10" />
          <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-3">Ready to Build Your Future?</h2>
          <p className="relative text-white/85 max-w-xl mx-auto mb-8">
            Join hundreds of women founders already growing with mentorship, funding, and a community on their side.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: "#fff", color: "#9333ea" }}
            >
              Start Your Journey
            </button>
          </div>
        </div>

        <div className="text-center mt-14">
         
        </div>
      </div>
    </div>
  );
}

export { AboutUs };
export default AboutUs;