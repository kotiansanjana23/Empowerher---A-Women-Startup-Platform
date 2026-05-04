import { StatsCard } from "../components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Users,
  TrendingUp,
  GraduationCap,
  DollarSign,
  UserPlus,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const userGrowthData = [
  { month: "Jan", users: 1200 },
  { month: "Feb", users: 1900 },
  { month: "Mar", users: 2400 },
  { month: "Apr", users: 3100 },
  { month: "May", users: 3800 },
  { month: "Jun", users: 4500 },
];

const salesData = [
  { month: "Jan", sales: 12000 },
  { month: "Feb", sales: 19000 },
  { month: "Mar", sales: 15000 },
  { month: "Apr", sales: 25000 },
  { month: "May", sales: 22000 },
  { month: "Jun", sales: 30000 },
];

const courseEnrollmentData = [
  { name: "Business Skills", value: 450, color: "#8b5cf6" },
  { name: "Tech & Digital", value: 320, color: "#c084fc" },
  { name: "Marketing", value: 280, color: "#e9d5ff" },
  { name: "Leadership", value: 210, color: "#f9a8d4" },
  { name: "Finance", value: 180, color: "#ec4899" },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with EmpowerHer today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Users"
          value="4,521"
          change="+12.5% from last month"
          icon={Users}
          trend="up"
        />
        <StatsCard
          title="Active Women Entrepreneurs"
          value="3,245"
          change="+8.2% from last month"
          icon={TrendingUp}
          trend="up"
        />
        <StatsCard
          title="Total Courses"
          value="156"
          change="+5 new this month"
          icon={GraduationCap}
          trend="up"
        />
        <StatsCard
          title="Marketplace Sales"
          value="$30,450"
          change="+18.7% from last month"
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title="New Registrations"
          value="324"
          change="This month"
          icon={UserPlus}
          trend="up"
        />
        <StatsCard
          title="Pending Approvals"
          value="47"
          change="Requires attention"
          icon={Clock}
          trend="down"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Course Enrollment Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Course Enrollment by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={courseEnrollmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // label={({ name, percent }) =>
                //   `${name} ${(percent * 100).toFixed(0)}%`
                // }
                label={({ name, percent }) =>
                   `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {courseEnrollmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                user: "Sarah Johnson",
                action: "completed the course",
                item: "Digital Marketing Fundamentals",
                time: "2 minutes ago",
              },
              {
                user: "Emily Chen",
                action: "listed a new product",
                item: "Handmade Jewelry Set",
                time: "15 minutes ago",
              },
              {
                user: "Maria Garcia",
                action: "joined as a mentor",
                item: "Business Strategy",
                time: "1 hour ago",
              },
              {
                user: "Aisha Patel",
                action: "made a purchase",
                item: "Leadership Course Bundle",
                time: "2 hours ago",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm">
                    {activity.user.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="text-primary">{activity.item}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
