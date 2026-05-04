import { Card } from '../components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';

const fundingConversionData = [
  { stage: 'Evaluated', count: 48, conversion: 100 },
  { stage: 'Verified', count: 32, conversion: 67 },
  { stage: 'Referred', count: 18, conversion: 38 },
  { stage: 'Funded', count: 8, conversion: 17 },
];

const readinessScoreData = [
  { month: 'Jan', avgScore: 65 },
  { month: 'Feb', avgScore: 68 },
  { month: 'Mar', avgScore: 72 },
  { month: 'Apr', avgScore: 75 },
  { month: 'May', avgScore: 78 },
  { month: 'Jun', avgScore: 82 },
];

const riskDistributionData = [
  { name: 'Low Risk', value: 28, color: '#50E3C2' },
  { name: 'Medium Risk', value: 15, color: '#FFA94D' },
  { name: 'High Risk', value: 5, color: '#FF6B9D' },
];

const sessionPerformanceData = [
  { month: 'Jan', sessions: 25, attendance: 88 },
  { month: 'Feb', sessions: 28, attendance: 90 },
  { month: 'Mar', sessions: 30, attendance: 87 },
  { month: 'Apr', sessions: 32, attendance: 91 },
  { month: 'May', sessions: 35, attendance: 93 },
  { month: 'Jun', sessions: 34, attendance: 92 },
];

const mentorPerformanceData = [
  { metric: 'Engagement', value: 85 },
  { metric: 'Responsiveness', value: 92 },
  { metric: 'Knowledge', value: 88 },
  { metric: 'Impact', value: 90 },
  { metric: 'Availability', value: 78 },
];

const COLORS = ['#7b4cfd', '#50E3C2', '#FF6B9D', '#FFA94D', '#A78BFA'];

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-black">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive insights and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-[#6C63FF]/10 to-[#6C63FF]/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Funding Success Rate</span>
            <TrendingUp className="w-5 h-5 text-[#6C63FF]" />
          </div>
          <p className="text-3xl font-semibold text-[#6C63FF]">17%</p>
          <p className="text-xs text-muted-foreground mt-1">8 of 48 startups funded</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#50E3C2]/10 to-[#50E3C2]/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Avg Readiness Score</span>
            <Target className="w-5 h-5 text-[#50E3C2]" />
          </div>
          <p className="text-3xl font-semibold text-[#50E3C2]">82</p>
          <p className="text-xs text-muted-foreground mt-1">+6 points this month</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#FFA94D]/10 to-[#FFA94D]/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Active Founders</span>
            <Users className="w-5 h-5 text-[#FFA94D]" />
          </div>
          <p className="text-3xl font-semibold text-[#FFA94D]">48</p>
          <p className="text-xs text-muted-foreground mt-1">Across 6 industries</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#A78BFA]/10 to-[#A78BFA]/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Funding Facilitated</span>
            <DollarSign className="w-5 h-5 text-[#A78BFA]" />
          </div>
          <p className="text-3xl font-semibold text-[#A78BFA]">₹12Cr</p>
          <p className="text-xs text-muted-foreground mt-1">Across 8 startups</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Conversion Rate */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-black">Funding Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fundingConversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="stage" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="count" fill="#6C63FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {fundingConversionData.map((item, index) => (
              <div key={item.stage} className="p-2 rounded-lg bg-accent/50">
                <p className="text-xs text-muted-foreground">{item.stage}</p>
                <p className="text-lg font-semibold text-[#6C63FF]">{item.conversion}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Average Readiness Score Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-black">Average Readiness Score Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={readinessScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" domain={[60, 85]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke="#50E3C2"
                strokeWidth={3}
                dot={{ fill: '#50E3C2', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-black">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="text-center p-2 rounded-lg bg-accent/50">
                <div
                  className="w-4 h-4 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Session Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-black">Session Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis yAxisId="left" stroke="#888" />
              <YAxis yAxisId="right" orientation="right" stroke="#888" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="sessions"
                fill="#6C63FF"
                name="Sessions"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="attendance"
                fill="#50E3C2"
                name="Attendance %"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Mentor Performance Radar */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-black">Mentor Performance Metrics</h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={mentorPerformanceData}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis dataKey="metric" stroke="#000" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#000" />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#6C63FF"
                fill="#6C63FF"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-4">
          {mentorPerformanceData.map((metric) => (
           <div key={metric.metric} className="text-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">{metric.metric}</p>
              <p className="text-2xl font-bold text-[#6C63FF]">{metric.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
