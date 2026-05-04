// import { Card, CardContent, CardHeader, CardTitle } from "../../Admin dashboard for EmpowerHer/src/app/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react";

const engagementData = [
  { date: "Mon", logins: 320, posts: 45, messages: 89 },
  { date: "Tue", logins: 380, posts: 52, messages: 102 },
  { date: "Wed", logins: 420, posts: 48, messages: 95 },
  { date: "Thu", logins: 390, posts: 61, messages: 118 },
  { date: "Fri", logins: 450, posts: 58, messages: 125 },
  { date: "Sat", logins: 290, posts: 38, messages: 78 },
  { date: "Sun", logins: 310, posts: 42, messages: 82 },
];

const revenueData = [
  { month: "Jan", revenue: 12000, orders: 145 },
  { month: "Feb", revenue: 19000, orders: 220 },
  { month: "Mar", revenue: 15000, orders: 180 },
  { month: "Apr", revenue: 25000, orders: 290 },
  { month: "May", revenue: 22000, orders: 260 },
  { month: "Jun", revenue: 30000, orders: 340 },
];

const topCourses = [
  { name: "Digital Marketing", enrollments: 450, revenue: 22500 },
  { name: "Business Strategy", enrollments: 380, revenue: 19000 },
  { name: "Leadership Skills", enrollments: 320, revenue: 16000 },
  { name: "Financial Planning", enrollments: 280, revenue: 14000 },
  { name: "Social Media", enrollments: 245, revenue: 12250 },
];

const topSellers = [
  { name: "Sarah Johnson", sales: 145, revenue: 12450 },
  { name: "Emily Chen", sales: 128, revenue: 10890 },
  { name: "Maria Garcia", sales: 116, revenue: 9870 },
  { name: "Aisha Patel", sales: 102, revenue: 8760 },
  { name: "Jessica Williams", sales: 95, revenue: 8120 },
];

export function Reports() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Track performance and analyze platform metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <p className="text-2xl">$123,450</p>
                <p className="text-xs text-green-600 mt-1">+18.2% this month</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Users
                </p>
                <p className="text-2xl">4,521</p>
                <p className="text-xs text-green-600 mt-1">+12.5% this month</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Orders
                </p>
                <p className="text-2xl">1,435</p>
                <p className="text-xs text-green-600 mt-1">+24.1% this month</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Avg. Growth
                </p>
                <p className="text-2xl">15.8%</p>
                <p className="text-xs text-green-600 mt-1">Overall platform</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement (Weekly)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="logins"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="posts"
                  stackId="1"
                  stroke="#c084fc"
                  fill="#c084fc"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stackId="1"
                  stroke="#e9d5ff"
                  fill="#e9d5ff"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue & Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Orders (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{ fill: "#ec4899", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCourses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="name" stroke="#6b7280" width={120} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSellers.map((seller, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {seller.sales} sales
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-green-600">
                    ${seller.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
