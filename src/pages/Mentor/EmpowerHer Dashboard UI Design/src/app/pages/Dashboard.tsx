import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Shield,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Clock,
  MessageSquare,
} from "lucide-react";

/* ---------------- DATA ---------------- */

const kpiData = [
  { label: "Total Founders", value: "48", icon: Users },
  { label: "Pending Requests", value: "12", icon: Calendar },
  { label: "Funding Ready", value: "8", icon: DollarSign },
  { label: "High Risk", value: "5", icon: AlertTriangle },
  { label: "Compliance Pending", value: "15", icon: Shield },
  { label: "Sessions Completed", value: "34", icon: CheckCircle2 },
];

const growthData = [
  { month: "Jan", startups: 28 },
  { month: "Feb", startups: 32 },
  { month: "Mar", startups: 35 },
  { month: "Apr", startups: 40 },
  { month: "May", startups: 44 },
  { month: "Jun", startups: 48 },
];

const industryData = [
  { name: "FinTech", value: 15 },
  { name: "HealthTech", value: 12 },
  { name: "EdTech", value: 8 },
  { name: "E-commerce", value: 7 },
  { name: "Others", value: 6 },
];

const COLORS = ["#6C63FF", "#50E3C2", "#FF6B9D", "#FFA94D", "#A78BFA"];

const upcomingSessions = [
  { id: 1, founder: "Emma Chen", startup: "EcoBox", time: "Today, 2:00 PM", topic: "Pitch Review" },
  { id: 2, founder: "Priya Sharma", startup: "HealthSync", time: "Tomorrow, 10:00 AM", topic: "Funding Strategy" },
  { id: 3, founder: "Lisa Anderson", startup: "EdTech Pro", time: "Mar 3, 3:00 PM", topic: "Market Expansion" },
];

const recentMessages = [
  { id: 1, founder: "Emma Chen", message: "Thanks for your feedback!", time: "5 min ago", unread: true },
  { id: 2, founder: "Priya Sharma", message: "Can we reschedule tomorrow?", time: "1 hour ago", unread: true },
  { id: 3, founder: "Lisa Anderson", message: "I've updated the financial projections.", time: "3 hours ago", unread: false },
];

const readinessScores = [
  { name: "Emma Chen", startup: "EcoBox", score: 85 },
  { name: "Priya Sharma", startup: "HealthSync", score: 72 },
  { name: "Lisa Anderson", startup: "EdTech Pro", score: 90 },
];

/* ---------------- HELPER ---------------- */

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

/* ================================================= */

export default function Dashboard() {
  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#6C63FF] via-[#8B5CF6] to-[#EC4899] text-white shadow-xl">
        <h1 className="text-4xl font-semibold">EmpowerHer Mentor Dashboard</h1>
        <p className="mt-2 text-sm opacity-90">
          Complete mentoring, funding & performance overview
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-6 rounded-2xl hover:shadow-xl transition-all bg-white border border-purple-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-black">{kpi.label}</p>
                  <p className="text-3xl font-bold mt-2 text-[#6C63FF]">
                    {kpi.value}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#EC4899] flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 rounded-3xl bg-white border border-purple-100">
          <h3 className="text-lg font-semibold mb-4 text-[#6C63FF]">
            Startup Growth
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="startups" stroke="#6C63FF" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 rounded-3xl bg-white border border-purple-100">
          <h3 className="text-lg font-semibold mb-4 text-[#6C63FF]">
            Industry Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={industryData} dataKey="value" outerRadius={90}>
                {industryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* SESSIONS + MESSAGES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Upcoming Sessions */}
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
          <h3 className="text-lg font-semibold mb-4 text-[#6C63FF] flex items-center gap-2">
            <Clock size={18} />
            Upcoming Sessions
          </h3>
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#EC4899] text-white flex items-center justify-center font-semibold">
                    {getInitials(session.founder)}
                  </div>
                  <div>
                    <p className="font-medium text-black">{session.founder}</p>
                    <p className="text-xs text-gray-500">{session.startup}</p>
                    <p className="text-xs text-purple-600 mt-1">{session.topic}</p>
                  </div>
                </div>
                <span className="text-sm text-black">{session.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Messages */}
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border border-purple-100">
          <h3 className="text-lg font-semibold mb-4 text-[#EC4899] flex items-center gap-2">
            <MessageSquare size={18} />
            Recent Messages
          </h3>
          <div className="space-y-4">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="flex items-start justify-between bg-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EC4899] to-[#6C63FF] text-white flex items-center justify-center font-semibold">
                      {getInitials(msg.founder)}
                    </div>
                    {msg.unread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-black">{msg.founder}</p>
                    <p className="text-xs text-gray-500 mt-1">{msg.message}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{msg.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* READINESS */}
      <Card className="p-6 rounded-3xl bg-white border border-purple-100">
        <h3 className="text-lg font-semibold mb-6 text-[#6C63FF]">
          Recent Readiness Evaluations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {readinessScores.map((item, index) => (
            <div key={index} className="p-4 rounded-2xl bg-purple-50">
              <p className="font-medium text-black">{item.name}</p>
             <p className="text-xs text-gray-500">{item.startup}</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-black h-2 rounded-full"
    style={{ width: `${item.score}%` }}
  ></div>
</div>
                <p className="text-sm text-purple-700 mt-2 font-medium">
                  {item.score}/100
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}