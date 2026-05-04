import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  Bell, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign, 
  BookOpen, 
  MessageSquare,
  Star,
  ArrowUpRight,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Search
} from "lucide-react";

export function Dashboard() {
  const mentorSuggestions = [
    {
      name: "Dr. Sarah Johnson",
      role: "Former VP Engineering, Google",
      expertise: "Tech Scaling, Product Development",
      matchScore: 95,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b047?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Maria Gonzalez",
      role: "CEO, FinTech Innovations",
      expertise: "Fundraising, Financial Strategy",
      matchScore: 88,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Jennifer Kim",
      role: "Serial Entrepreneur",
      expertise: "Business Development, Marketing",
      matchScore: 82,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const fundingOpportunities = [
    {
      title: "Women in Tech Grant",
      organization: "TechFoundation",
      amount: "$50,000",
      deadline: "Feb 15, 2025",
      matchScore: 92,
      type: "Grant"
    },
    {
      title: "Early Stage Seed Fund",
      organization: "VentureCapital Corp",
      amount: "$100,000 - $500,000",
      deadline: "Mar 1, 2025",
      matchScore: 85,
      type: "Investment"
    },
    {
      title: "Innovation Challenge",
      organization: "Government Initiative",
      amount: "$25,000",
      deadline: "Jan 30, 2025",
      matchScore: 78,
      type: "Competition"
    }
  ];

  const recentActivities = [
    {
      type: "mentor",
      message: "New mentor match: Dr. Sarah Johnson",
      time: "2 hours ago",
      icon: <Users className="h-4 w-4 text-purple-600" />
    },
    {
      type: "funding",
      message: "Funding opportunity: Women in Tech Grant",
      time: "5 hours ago",
      icon: <DollarSign className="h-4 w-4 text-green-600" />
    },
    {
      type: "training",
      message: "Course completed: Pitch Deck Fundamentals",
      time: "1 day ago",
      icon: <BookOpen className="h-4 w-4 text-blue-600" />
    },
    {
      type: "pitch",
      message: "Pitch feedback received from mentor",
      time: "2 days ago",
      icon: <MessageSquare className="h-4 w-4 text-orange-600" />
    }
  ];

  const upcomingTasks = [
    {
      title: "Schedule mentor call with Dr. Johnson",
      priority: "high",
      dueDate: "Today"
    },
    {
      title: "Submit funding application",
      priority: "medium",
      dueDate: "Tomorrow"
    },
    {
      title: "Complete market research module",
      priority: "low",
      dueDate: "This week"
    },
    {
      title: "Update business plan",
      priority: "medium",
      dueDate: "Next week"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, Alexandra!</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b047?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Mentors</p>
                  <p className="text-3xl font-bold text-gray-900">3</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +2 this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Funding Applied</p>
                  <p className="text-3xl font-bold text-gray-900">$75K</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600">
                <Target className="h-4 w-4 mr-1" />
                3 applications
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Training Progress</p>
                  <p className="text-3xl font-bold text-gray-900">68%</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <Progress value={68} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pitch Score</p>
                  <p className="text-3xl font-bold text-gray-900">8.5</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +1.2 improvement
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mentor Recommendations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>AI Mentor Recommendations</CardTitle>
                  <CardDescription>Personalized matches based on your startup profile</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentorSuggestions.map((mentor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mentor.avatar} />
                        <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">{mentor.name}</h4>
                        <p className="text-sm text-gray-600">{mentor.role}</p>
                        <p className="text-sm text-purple-600">{mentor.expertise}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {mentor.matchScore}% match
                      </Badge>
                      <Button size="sm">Connect</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Mentors
                </Button>
              </CardContent>
            </Card>

            {/* Funding Opportunities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Funding Opportunities</CardTitle>
                  <CardDescription>Tailored funding matches for your startup</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alert
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fundingOpportunities.map((opportunity, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{opportunity.title}</h4>
                        <p className="text-sm text-gray-600">{opportunity.organization}</p>
                      </div>
                      <Badge 
                        variant={opportunity.type === 'Grant' ? 'default' : opportunity.type === 'Investment' ? 'secondary' : 'outline'}
                      >
                        {opportunity.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-medium text-green-600">{opportunity.amount}</span>
                        <span className="text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {opportunity.deadline}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.matchScore}% match
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">Apply</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Browse All Opportunities
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit New Pitch
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Mentor Call
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Continue Training
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Explore Funding
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Stay on track with your goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.dueDate}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full">
                  View All Tasks
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="mt-1">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full">
                  View All Activity
                </Button>
              </CardContent>
            </Card>

            {/* Progress Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Startup Journey</CardTitle>
                <CardDescription>Track your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Profile completed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">First mentor connected</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">Pitch submission</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">First funding application</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">MVP development</span>
                  </div>
                </div>
                <Progress value={40} className="h-2" />
                <p className="text-xs text-gray-500 text-center">40% complete</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}