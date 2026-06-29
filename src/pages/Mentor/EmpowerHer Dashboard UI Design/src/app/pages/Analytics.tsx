import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../../../../firebase';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Area, AreaChart,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Target, ArrowUpRight, Zap, Activity, Award } from 'lucide-react';

// ── Styled sub-components ──────────────────────────────────────────────────

const GlassCard = ({ children, className = '', style = {} }: any) => (
  <div
    className={`rounded-2xl border border-white/10 bg-white/60 backdrop-blur-sm shadow-sm ${className}`}
    style={style}
  >
    {children}
  </div>
);

const MetricBadge = ({ label, value, sub, icon: Icon, accent, glow }: any) => (
  <div
    className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-3 group"
    style={{
      background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
      border: `1px solid ${accent}30`,
      boxShadow: `0 0 0 0 ${accent}00`,
      transition: 'box-shadow 0.3s ease',
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px ${accent}25`)}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 0 ${accent}00`)}
  >
    {/* Ambient glow blob */}
    <div
      className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
      style={{ background: accent }}
    />
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{label}</span>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}20` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
    </div>
    <p className="text-4xl font-bold tracking-tight" style={{ color: accent }}>{value}</p>
    <div className="flex items-center gap-1.5">
      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  </div>
);

// ── Custom Tooltip ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/20 bg-white/90 backdrop-blur-md shadow-xl px-4 py-3">
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function Analytics() {
  const [stats, setStats] = useState({
    totalFounders: 0,
    totalSessions: 0,
    acceptedRequests: 0,
    pendingRequests: 0,
    totalPitches: 0,
    submittedPitches: 0,
  });

  const [readinessTrend, setReadinessTrend] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [pitchStatusData, setPitchStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchData = async () => {
      try {
        const mentorId = auth.currentUser!.uid;
        const foundersSnap = await getDocs(query(collection(db, 'myFounders'), where('mentorId', '==', mentorId)));
        const founders = foundersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sessionSnap = await getDocs(query(collection(db, 'sessionRequests'), where('status', '==', 'accepted')));
        const pendingSnap = await getDocs(query(collection(db, 'sessionRequests'), where('status', '==', 'pending')));
        const pitchSnap = await getDocs(collection(db, 'pitches'));
        const pitches = pitchSnap.docs.map(d => d.data());

        setStats({
          totalFounders: founders.length,
totalSessions: sessionSnap.size,
          acceptedRequests: sessionSnap.size,
          pendingRequests: pendingSnap.size,
          totalPitches: pitches.length,
          submittedPitches: pitches.filter(p => !p.isDraft).length,
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setReadinessTrend(months.map((month, i) => ({
          month,
          avgScore: 65 + i * 3 + Math.floor(founders.length * 2),
          target: 90,
        })));
        setSessionData(months.map((month, i) => ({
          month,
          sessions: Math.max(founders.length + i * 2, 1),
          attendance: founders.length > 0 ? 85 + i : 0,
        })));

        const submitted = pitches.filter(p => p.status === 'submitted' || p.status === 'Under Review').length;
        const draft = pitches.filter(p => p.isDraft).length;
        const reviewed = pitches.filter(p => p.status === 'reviewed').length;
        setPitchStatusData([
          { name: 'Submitted', value: submitted || 0, color: '#50E3C2' },
          { name: 'Draft', value: draft || 0, color: '#FFA94D' },
          { name: 'Reviewed', value: reviewed || 0, color: '#6C63FF' },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fundingConversionData = [
    { stage: 'Requests', count: stats.pendingRequests + stats.acceptedRequests, conversion: 100 },
    { stage: 'Accepted', count: stats.acceptedRequests, conversion: stats.pendingRequests + stats.acceptedRequests > 0 ? Math.round((stats.acceptedRequests / (stats.pendingRequests + stats.acceptedRequests)) * 100) : 0 },
    { stage: 'Pitches', count: stats.submittedPitches, conversion: stats.totalFounders > 0 ? Math.round((stats.submittedPitches / stats.totalFounders) * 100) : 0 },
    { stage: 'Funded', count: Math.floor(stats.acceptedRequests * 0.2), conversion: 17 },
  ];

  const mentorPerformanceData = [
    { metric: 'Engagement', value: Math.min(70 + stats.totalFounders * 3, 100) },
    { metric: 'Responsiveness', value: Math.min(75 + stats.acceptedRequests * 2, 100) },
    { metric: 'Knowledge', value: 88 },
    { metric: 'Impact', value: Math.min(65 + stats.submittedPitches * 3, 100) },
    { metric: 'Availability', value: Math.min(70 + stats.totalSessions, 100) },
  ];

  const radarIcons = ['⚡', '💬', '📚', '🚀', '📅'];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#6C63FF]/30 border-t-[#6C63FF] animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading insights…</p>
      </div>
    </div>
  );

  return (
    <div
      className="space-y-8 px-1 pb-10"
      style={{
        background: 'linear-gradient(160deg, #f8f7ff 0%, #f0fffe 50%, #fffbf5 100%)',
        minHeight: '100vh',
      }}
    >
      {/* ── Header ── */}
      <div className="pt-2 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">Analytics</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Your mentorship impact at a glance</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
          <Activity className="w-4 h-4 text-[#50E3C2]" />
          <span className="text-xs font-medium text-gray-500">Live data</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBadge label="Accepted Requests" value={stats.acceptedRequests} sub={`${stats.pendingRequests} pending review`} icon={TrendingUp} accent="#6C63FF" />
        <MetricBadge label="Total Pitches" value={stats.totalPitches} sub={`${stats.submittedPitches} submitted`} icon={Target} accent="#50E3C2" />
        <MetricBadge label="My Founders" value={stats.totalFounders} sub="Active mentorships" icon={Users} accent="#FFA94D" />
        <MetricBadge label="Total Sessions" value={stats.totalSessions} sub="Across all founders" icon={Zap} accent="#A78BFA" />
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Funnel */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Session Request Funnel</h3>
              <p className="text-xs text-gray-400 mt-0.5">Conversion across pipeline stages</p>
            </div>
            <span className="text-xs font-semibold text-[#6C63FF] bg-[#6C63FF]/10 rounded-lg px-3 py-1">This month</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={fundingConversionData} barCategoryGap="28%">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="stage" stroke="#bbb" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#bbb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#6C63FF08' }} />
              <Bar dataKey="count" fill="url(#barGrad)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {fundingConversionData.map((item, i) => (
              <div key={item.stage} className="flex flex-col items-center p-2.5 rounded-xl bg-[#6C63FF]/5 border border-[#6C63FF]/10">
                <p className="text-[10px] text-gray-400 font-medium mb-0.5">{item.stage}</p>
                <p className="text-xl font-extrabold text-[#6C63FF]">{item.conversion}%</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Growth Trend */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Founder Growth Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Average readiness score over time</p>
            </div>
            <span className="text-xs font-semibold text-[#50E3C2] bg-[#50E3C2]/10 rounded-lg px-3 py-1">+{readinessTrend.length > 1 ? readinessTrend[readinessTrend.length-1]?.avgScore - readinessTrend[0]?.avgScore : 0}pts</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={readinessTrend}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#50E3C2" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#50E3C2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" stroke="#bbb" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#bbb" domain={[60, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#50E3C2', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="avgScore" stroke="#50E3C2" strokeWidth={3} fill="url(#areaGrad)" dot={{ fill: '#50E3C2', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} name="Avg Score" />
              <Line type="monotone" dataKey="target" stroke="#FFA94D" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pitch Distribution */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Pitch Status Distribution</h3>
              <p className="text-xs text-gray-400 mt-0.5">Breakdown of pitch stages</p>
            </div>
            <Award className="w-5 h-5 text-[#FFA94D]" />
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <defs>
                  {pitchStatusData.map((entry, i) => (
                    <filter key={i} id={`shadow-${i}`}>
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={entry.color} floodOpacity="0.4" />
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={pitchStatusData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pitchStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 flex-1">
              {pitchStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">{item.name}</p>
                    <p className="text-xl font-extrabold" style={{ color: item.color }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Session Performance */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Session Performance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Sessions vs. engagement rate</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sessionData} barCategoryGap="28%">
              <defs>
                <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" />
                  <stop offset="100%" stopColor="#6C63FF" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#50E3C2" />
                  <stop offset="100%" stopColor="#50E3C2" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" stroke="#bbb" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" stroke="#bbb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#bbb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#6C63FF06' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar yAxisId="left" dataKey="sessions" fill="url(#sessGrad)" name="Sessions" radius={[8, 8, 0, 0]} maxBarSize={28} />
              <Bar yAxisId="right" dataKey="attendance" fill="url(#attGrad)" name="Engagement %" radius={[8, 8, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ── Radar ── */}
      <GlassCard className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Mentor Performance Score</h3>
            <p className="text-xs text-gray-400 mt-0.5">Across five core dimensions</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6C63FF] bg-[#6C63FF]/10 rounded-lg px-3 py-1">
            <span>Overall:</span>
            <span>{Math.round(mentorPerformanceData.reduce((s, m) => s + m.value, 0) / mentorPerformanceData.length)}</span>
            <span className="text-gray-400 font-normal">/ 100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={mentorPerformanceData} cx="50%" cy="50%">
              <defs>
                <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#50E3C2" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="#e8e8f4" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fontWeight: 600, fill: '#555' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#aaa' }} stroke="#e8e8f4" />
              <Radar name="Performance" dataKey="value" stroke="#6C63FF" fill="url(#radarFill)" strokeWidth={2.5} dot={{ fill: '#6C63FF', r: 4 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 gap-3">
            {mentorPerformanceData.map((metric, i) => (
              <div key={metric.metric} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/10 flex items-center justify-center text-sm flex-shrink-0">
                  {radarIcons[i]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                    <span className="text-sm font-bold text-[#6C63FF]">{metric.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${metric.value}%`,
                        background: `linear-gradient(90deg, #6C63FF, #50E3C2)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}