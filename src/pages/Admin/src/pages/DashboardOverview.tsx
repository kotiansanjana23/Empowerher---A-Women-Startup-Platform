import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Users,
  TrendingUp,
  BookOpen,
  ShoppingBag,
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

const statsCards = [
  {
    title: "Total Users",
    value: "12,543",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Active Women Entrepreneurs",
    value: "8,234",
    change: "+8.2%",
    trend: "up",
    icon: TrendingUp,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    title: "Total Courses",
    value: "156",
    change: "+4 new",
    trend: "up",
    icon: BookOpen,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
  },
  {
    title: "Marketplace Sales",
    value: "$84,250",
    change: "+23.1%",
    trend: "up",
    icon: ShoppingBag,
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-100",
  },
  {
    title: "New Registrations",
    value: "342",
    change: "This month",
    trend: "neutral",
    icon: UserPlus,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Pending Approvals",
    value: "28",
    change: "Requires action",
    trend: "neutral",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
];

const userGrowthData = [
  { month: "Jan", users: 4200 },
  { month: "Feb", users: 5100 },
  { month: "Mar", users: 6300 },
  { month: "Apr", users: 7800 },
  { month: "May", users: 9400 },
  { month: "Jun", users: 10800 },
  { month: "Jul", users: 12543 },
];

const monthlySalesData = [
  { month: "Jan", sales: 45000 },
  { month: "Feb", sales: 52000 },
  { month: "Mar", sales: 61000 },
  { month: "Apr", sales: 68000 },
  { month: "May", sales: 74000 },
  { month: "Jun", sales: 79000 },
  { month: "Jul", sales: 84250 },
];

const courseEnrollmentData = [
  { name: "Business & Finance", value: 2840, color: "#8b5cf6" },
  { name: "Digital Marketing", value: 2134, color: "#ec4899" },
  { name: "Design & Creativity", value: 1653, color: "#a78bfa" },
  { name: "Technology & Coding", value: 1287, color: "#c084fc" },
  { name: "Personal Development", value: 1052, color: "#f0abfc" },
];

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with EmpowerHer today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: "#8b5cf6", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="sales" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Enrollment by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={courseEnrollmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
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
    </div>
  );
}
