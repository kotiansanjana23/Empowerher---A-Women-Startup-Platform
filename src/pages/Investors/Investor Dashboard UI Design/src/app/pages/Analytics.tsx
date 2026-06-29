

import { useEffect, useState } from "react";
import {
  TrendingUp, DollarSign, PieChart as PieChartIcon,
  Activity, Target, Award, Loader2, Users, CheckCircle,
  Clock, XCircle, ArrowUpRight, Zap, IndianRupee,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  collection, query, where, onSnapshot, doc, getDoc, getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../../../../firebase";

const COLORS = ["#7B61FF", "#A78BFA", "#C4B5FD", "#EC4899", "#DDD6FE", "#F9A8D4"];

function monthLabel(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("default", { month: "short" });
}
function dateLabel(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
}

// Parses money strings — now understands ₹, $, K, L (lakh), Cr (crore), M
function parseMoney(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const s = String(val).replace(/[₹$,\s]/gi, "").toUpperCase();
  if (s.endsWith("CR")) return parseFloat(s) * 10_000_000;
  if (s.endsWith("L"))  return parseFloat(s) * 100_000;
  if (s.endsWith("M"))  return parseFloat(s) * 1_000_000;
  if (s.endsWith("K"))  return parseFloat(s) * 1_000;
  return parseFloat(s) || 0;
}

// Formats a number as Indian Rupees using lakh/crore notation
function fmt(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
}

interface EnrichedRec {
  id: string; status: string; createdAt: any; startupName: string;
  industry: string; founderId: string; founderName: string;
  growthRate: number; dealAmount: number; equity: number;
}

export default function Analytics() {
  const [investorId, setInvestorId] = useState("");
  const [recs, setRecs]             = useState<EnrichedRec[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { if (u) setInvestorId(u.uid); }), []);

  useEffect(() => {
    if (!investorId) return;
    const q = query(collection(db, "mentorRecommendations"), where("investorId", "==", investorId));
    const unsub = onSnapshot(q, async (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const enriched: EnrichedRec[] = await Promise.all(
        raw.map(async (data: any) => {
          let growthRate = Number(data.growthRate) || 0;
          let industry   = data.sector || data.industry || "Other";
          let dealAmount = parseMoney(data.amount) || 0;
          let equity     = 0;
          const fid = data.founderId || "";
          if (fid) {
            try {
              const fs = await getDoc(doc(db, "founders", fid));
              if (fs.exists()) {
                const fd = fs.data();
                if (!growthRate) growthRate = Number(fd.growthRate) || 0;
                if (!industry || industry === "Other") industry = fd.industry || industry;
              }
            } catch {}
          }
          try {
            const offersSnap = await getDocs(
              query(collection(db, "fundingOffers", data.id, "offers"), where("status", "==", "accepted"))
            );
            if (!offersSnap.empty) {
              const best = offersSnap.docs.map((od) => od.data())
                .sort((a, b) => parseMoney(b.maxAmount) - parseMoney(a.maxAmount))[0];
              dealAmount = parseMoney(best.maxAmount) || parseMoney(best.minAmount) || dealAmount;
              equity = parseFloat(best.equity) || 0;
            } else {
              const anySnap = await getDocs(
                query(collection(db, "fundingOffers", data.id, "offers"), where("fromRole", "==", "investor"))
              );
              if (!anySnap.empty) {
                const latest = anySnap.docs.map((od) => od.data())
                  .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))[0];
                dealAmount = parseMoney(latest.maxAmount) || parseMoney(latest.minAmount) || dealAmount;
                equity = parseFloat(latest.equity) || 0;
              }
            }
          } catch {}
          return {
            id: data.id, status: data.status || "", createdAt: data.createdAt || null,
            startupName: data.startupName || data.startup || "Unknown",
            industry, founderId: fid,
            founderName: data.founderName || data.founder || "Founder",
            growthRate, dealAmount, equity,
          };
        })
      );
      setRecs(enriched);
      setLoading(false);
    });
    return unsub;
  }, [investorId]);

  const accepted  = recs.filter((r) => r.status === "accepted" || r.status === "Connected");
  const pending   = recs.filter((r) => r.status === "pending");
  const passed    = recs.filter((r) => r.status === "passed");
  const totalInvested  = accepted.reduce((s, r) => s + r.dealAmount, 0);
  const avgInvestment  = accepted.length ? totalInvested / accepted.length : 0;
  const activeCount    = accepted.length;
  const portfolioValue = accepted.reduce((s, r) => {
    if (r.equity > 0 && r.dealAmount > 0) return s + (r.dealAmount / r.equity) * 100;
    return s + r.dealAmount * 1.3;
  }, 0);
  const growthRates = accepted.filter((r) => r.growthRate > 0).map((r) => r.growthRate);
  const avgGrowth   = growthRates.length ? Math.round(growthRates.reduce((s, v) => s + v, 0) / growthRates.length) : 0;
  const successRate = recs.length ? Math.round((accepted.length / recs.length) * 100) : 0;

  // De-duplicate by startup name, keeping the latest record — same fix pattern as Dashboard
  const dedupedAccepted = (() => {
    const sorted = [...accepted].sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
    const seen = new Set<string>();
    const out: EnrichedRec[] = [];
    for (const r of sorted) {
      if (seen.has(r.startupName)) continue;
      seen.add(r.startupName);
      out.push(r);
    }
    return out;
  })();

  const investmentTrend = (() => {
    const map: Record<string, number> = {};
    accepted.forEach((r) => { const l = monthLabel(r.createdAt); if (l) map[l] = (map[l] || 0) + (r.dealAmount || 1); });
    return Object.entries(map).map(([month, amount]) => ({ month, amount })).slice(-6);
  })();

  const activityTimeline = (() => {
    const map: Record<string, { views: number; meetings: number; investments: number }> = {};
    recs.forEach((r) => {
      const l = dateLabel(r.createdAt);
      if (!l) return;
      if (!map[l]) map[l] = { views: 0, meetings: 0, investments: 0 };
      map[l].views += 1;
      if (r.status === "Meeting Scheduled") map[l].meetings += 1;
      if (r.status === "accepted" || r.status === "Connected") map[l].investments += 1;
    });
    return Object.entries(map).map(([date, v]) => ({ date, ...v })).slice(-7);
  })();

  const industryDist = (() => {
    const map: Record<string, number> = {};
    dedupedAccepted.forEach((r) => { map[r.industry] = (map[r.industry] || 0) + 1; });
    const total = dedupedAccepted.length || 1;
    return Object.entries(map).map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }));
  })();

  const topPerformers = [...dedupedAccepted].sort((a, b) => b.growthRate - a.growthRate).slice(0, 5);

  const now = new Date();
  const thisMonth = recs.filter((r) => {
    if (!r.createdAt) return false;
    const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const newThisMonth      = thisMonth.filter((r) => r.status === "accepted" || r.status === "Connected").length;
  const meetingsThisMonth = thisMonth.filter((r) => r.status === "Meeting Scheduled").length;
  const reviewedThisMonth = thisMonth.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        <span className="text-violet-400 text-sm">Loading analytics…</span>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "#fff",
    border: "1px solid #EDE9FE",
    borderRadius: "10px",
    boxShadow: "0 4px 20px rgba(123,97,255,0.1)",
    fontSize: 13,
  };

  return (
    <div className="space-y-6 pb-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-500 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
              <Zap className="w-3 h-3" /> Live
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your investment performance and portfolio insights</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg shadow-violet-200">
          <IndianRupee className="w-3.5 h-3.5" /> Reporting in INR
        </div>
      </div>

      {/* ── Pending banner ── */}
      {accepted.length === 0 && recs.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3.5">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            You have <strong>{recs.length}</strong> recommendation{recs.length !== 1 ? "s" : ""} ({pending.length} pending).
            Accept founders and send funding offers to populate investment metrics.
          </p>
        </div>
      )}

      {/* ── Top KPI strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Invested */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200"
          style={{ background: "linear-gradient(135deg, #6D4AFF 0%, #8B5CF6 100%)" }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-4 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <IndianRupee className="w-4.5 h-4.5" />
              </div>
              <TrendingUp className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Total Invested</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{fmt(totalInvested)}</p>
            <p className="text-white/50 text-xs mt-1.5">{activeCount > 0 ? `Across ${activeCount} investments` : "No deals closed yet"}</p>
          </div>
        </div>

        {/* Active Investments */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200"
          style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)" }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-4 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Target className="w-4.5 h-4.5" />
              </div>
              <Activity className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Active Investments</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{activeCount}</p>
            <p className="text-white/50 text-xs mt-1.5">{pending.length > 0 ? `${pending.length} pending review` : "All reviewed"}</p>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-200"
          style={{ background: "linear-gradient(135deg, #C084FC 0%, #E879F9 100%)" }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-4 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <PieChartIcon className="w-4.5 h-4.5" />
              </div>
              <TrendingUp className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Portfolio Value</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{fmt(portfolioValue)}</p>
            <p className="text-white/50 text-xs mt-1.5">{portfolioValue > 0 ? "Based on implied valuations" : "Close deals to track"}</p>
          </div>
        </div>
      </div>

      {/* ── Status row ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending",      value: pending.length,     icon: <Clock className="w-4 h-4" />,        bg: "bg-amber-50",   border: "border-amber-100",  icon_color: "text-amber-500",  val_color: "text-amber-700"  },
          { label: "Accepted",     value: dedupedAccepted.length, icon: <CheckCircle className="w-4 h-4" />,  bg: "bg-violet-50",  border: "border-violet-100", icon_color: "text-violet-500", val_color: "text-violet-700" },
          { label: "Passed",       value: passed.length,      icon: <XCircle className="w-4 h-4" />,      bg: "bg-red-50",     border: "border-red-100",    icon_color: "text-red-400",    val_color: "text-red-600"    },
          { label: "Success Rate", value: `${successRate}%`,  icon: <Users className="w-4 h-4" />,        bg: "bg-purple-50",  border: "border-purple-100", icon_color: "text-purple-500", val_color: "text-purple-700" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5`}>
            <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center ${s.icon_color} shadow-sm`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className={`text-xl font-bold ${s.val_color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left: charts (2 cols) */}
        <div className="col-span-2 space-y-5">

          {/* Investment Trend */}
          <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-900">Investment Trend</h3>
                <p className="text-xs text-gray-400 mt-0.5">Monthly accepted deal activity (₹)</p>
              </div>
              <span className="text-xs font-semibold text-violet-500 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">Live</span>
            </div>
            {investmentTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-violet-300" />
                </div>
                <p className="text-sm text-gray-400">Accept founders & send offers to see investment trend</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={investmentTrend}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#7B61FF" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" vertical={false} />
                  <XAxis dataKey="month" stroke="#C4B5FD" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#C4B5FD" tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={fmt} axisLine={false} tickLine={false} width={64} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [fmt(Number(v)), "Amount"]} />
                  <Area type="monotone" dataKey="amount" stroke="#7B61FF" strokeWidth={2.5}
                    fill="url(#areaGrad)"
                    dot={{ fill: "#7B61FF", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#7B61FF", stroke: "#EDE9FE", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
                <p className="text-xs text-gray-400 mt-0.5">Recent recommendation activity</p>
              </div>
              <span className="text-xs font-semibold text-violet-500 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">Last 7 days</span>
            </div>
            {activityTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-violet-300" />
                </div>
                <p className="text-sm text-gray-400">No recent activity found</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={activityTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" vertical={false} />
                  <XAxis dataKey="date" stroke="#C4B5FD" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#C4B5FD" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" />
                  <Line type="monotone" dataKey="views"       stroke="#7B61FF" strokeWidth={2} dot={false} name="Viewed"   />
                  <Line type="monotone" dataKey="meetings"    stroke="#A78BFA" strokeWidth={2} dot={false} name="Meetings" />
                  <Line type="monotone" dataKey="investments" stroke="#C4B5FD" strokeWidth={2} dot={false} name="Accepted" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Industry Mix */}
          <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Industry Mix</h3>
            {industryDist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <PieChartIcon className="w-5 h-5 text-violet-300" />
                </div>
                <p className="text-sm text-gray-400">No accepted deals yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={industryDist} cx="50%" cy="50%"
                      innerRadius={46} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {industryDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {industryDist.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-gray-500 truncate">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Top Performers</h3>
            {topPerformers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Award className="w-8 h-8 text-violet-200" />
                <p className="text-sm text-gray-400">Accept founders to see top performers</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topPerformers.map((r, i) => (
                  <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-sm ${i === 0 ? "bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100" : "bg-gray-50"}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm" : "bg-violet-100 text-violet-600"
                    }`}>
                      {i === 0 ? <Award className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.startupName}</p>
                      <p className="text-xs text-gray-400">{r.industry}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r.growthRate > 0 && (
                        <div className="flex items-center gap-0.5 justify-end">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-600">{r.growthRate}%</span>
                        </div>
                      )}
                      {r.dealAmount > 0 && (
                        <p className="text-xs text-violet-500 font-medium mt-0.5">{fmt(r.dealAmount)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investment Summary */}
          <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2">
              {[
                { label: "Avg Deal Size",  value: fmt(avgInvestment) },
                { label: "Total Startups", value: String(dedupedAccepted.length) },
                { label: "Total Reviewed", value: String(recs.length) },
                { label: "Success Rate",   value: successRate > 0 ? `${successRate}%` : "—" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <span className="text-sm font-bold text-violet-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* This Month */}
          <div className="rounded-2xl p-5 text-white relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl"
            style={{ background: "linear-gradient(135deg, #6D4AFF 0%, #A78BFA 100%)" }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4 relative">This Month</p>
            <div className="space-y-3 relative">
              {[
                { label: "New Investments",   value: newThisMonth      },
                { label: "Startups Reviewed", value: reviewedThisMonth },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-white/65 text-sm">{item.label}</span>
                  <span className="text-2xl font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}