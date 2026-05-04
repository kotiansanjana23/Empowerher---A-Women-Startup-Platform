import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { 
  BookOpen, 
  Play, 
  Users, 
  Award, 
  Clock, 
  Target,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Star
} from "lucide-react";

export function Training() {
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);

  const courses = [
    {
      id: "1",
      title: "Startup Fundamentals for Women Entrepreneurs",
      description: "Learn the basics of starting and running a successful business",
      duration: "6 weeks",
      level: "Beginner",
      instructor: "Sarah Chen",
      rating: 4.8,
      students: 2847,
      progress: 0,
      modules: 12,
      category: "Business Basics"
    },
    {
      id: "2", 
      title: "Pitch Perfect: Mastering Investor Presentations",
      description: "Create compelling pitches that attract investors and secure funding",
      duration: "4 weeks",
      level: "Intermediate",
      instructor: "Maria Rodriguez",
      rating: 4.9,
      students: 1562,
      progress: 45,
      modules: 8,
      category: "Fundraising"
    },
    {
      id: "3",
      title: "Digital Marketing for Startups",
      description: "Build your online presence and reach your target audience effectively",
      duration: "5 weeks", 
      level: "Beginner",
      instructor: "Jessica Taylor",
      rating: 4.7,
      students: 3291,
      progress: 0,
      modules: 10,
      category: "Marketing"
    },
    {
      id: "4",
      title: "Financial Planning & Management",
      description: "Master the financial aspects of running a successful startup",
      duration: "8 weeks",
      level: "Intermediate",
      instructor: "Amanda Foster",
      rating: 4.9,
      students: 1834,
      progress: 75,
      modules: 16,
      category: "Finance"
    }
  ];

  const webinars = [
    {
      title: "Breaking Barriers: Women in Tech Leadership",
      date: "Oct 15, 2025",
      time: "2:00 PM EST",
      speaker: "Elena Rodriguez, CEO TechNova",
      registered: 1247
    },
    {
      title: "Scaling Your Startup: From MVP to Market Leader",
      date: "Oct 22, 2025", 
      time: "1:00 PM EST",
      speaker: "Dr. Priya Patel, Venture Capitalist",
      registered: 892
    },
    {
      title: "Building Resilient Teams in Uncertain Times",
      date: "Oct 29, 2025",
      time: "3:00 PM EST", 
      speaker: "Rachel Kim, Leadership Coach",
      registered: 634
    }
  ];

  const achievements = [
    { title: "Course Completion", description: "Completed 3 courses", icon: Award, earned: true },
    { title: "Quick Learner", description: "Finished course in record time", icon: Clock, earned: true },
    { title: "Community Helper", description: "Helped 10+ fellow entrepreneurs", icon: Users, earned: false },
    { title: "Innovation Award", description: "Top pitch in monthly competition", icon: Lightbulb, earned: false }
  ];

  const enrollInCourse = (courseId: string) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Training Hub</h1>
                <p className="text-purple-100 text-lg">
                  Develop skills, gain knowledge, and accelerate your entrepreneurial journey
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-sm text-purple-100 mb-1">Your Progress</div>
                  <div className="text-2xl font-bold">67%</div>
                  <div className="text-sm text-purple-100">4 of 6 courses completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="webinars">Live Sessions</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {course.description}
                        </CardDescription>
                      </div>
                      <Badge variant={course.level === "Beginner" ? "secondary" : "default"}>
                        {course.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {course.progress > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.modules} modules</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{course.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Instructor: {course.instructor}</span>
                        <span>{course.students.toLocaleString()} students</span>
                      </div>

                      <div className="flex space-x-2">
                        {course.progress > 0 ? (
                          <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            <Play className="h-4 w-4 mr-2" />
                            Continue Learning
                          </Button>
                        ) : enrolledCourses.includes(course.id) ? (
                          <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            <Play className="h-4 w-4 mr-2" />
                            Start Course
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => enrollInCourse(course.id)}
                          >
                            Enroll Now
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Webinars Tab */}
          <TabsContent value="webinars" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webinars.map((webinar, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{webinar.title}</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{webinar.date} at {webinar.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{webinar.registered} registered</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-gray-900">Speaker</p>
                        <p className="text-sm text-gray-600">{webinar.speaker}</p>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Register for Free
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <Card key={index} className={`${achievement.earned ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' : 'bg-gray-50'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${achievement.earned ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-300'}`}>
                        <achievement.icon className={`h-6 w-6 ${achievement.earned ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <span>E-Books & Guides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Women in Business: Success Stories</h4>
                      <p className="text-sm text-gray-600">120 pages • PDF</p>
                    </div>
                    <div className="border-l-4 border-pink-600 pl-4">
                      <h4 className="font-medium">Startup Funding Guide</h4>
                      <p className="text-sm text-gray-600">85 pages • PDF</p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Marketing Playbook</h4>
                      <p className="text-sm text-gray-600">64 pages • PDF</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Browse All Resources
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Industry Reports</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Women Entrepreneurs 2025</h4>
                      <p className="text-sm text-gray-600">Market trends & insights</p>
                    </div>
                    <div className="border-l-4 border-pink-600 pl-4">
                      <h4 className="font-medium">Startup Ecosystem Report</h4>
                      <p className="text-sm text-gray-600">Global startup landscape</p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Funding Trends Q3 2025</h4>
                      <p className="text-sm text-gray-600">Investment patterns</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Reports
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span>Templates & Tools</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Business Plan Template</h4>
                      <p className="text-sm text-gray-600">Professional format</p>
                    </div>
                    <div className="border-l-4 border-pink-600 pl-4">
                      <h4 className="font-medium">Pitch Deck Template</h4>
                      <p className="text-sm text-gray-600">Investor-ready design</p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Financial Model</h4>
                      <p className="text-sm text-gray-600">Excel spreadsheet</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Download Templates
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}