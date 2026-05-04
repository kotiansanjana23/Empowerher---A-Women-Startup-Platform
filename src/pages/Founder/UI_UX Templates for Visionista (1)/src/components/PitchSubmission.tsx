import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Upload, 
  FileText, 
  Play, 
  Star, 
  MessageSquare, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Download,
  Share,
  Edit,
  Video,
  Image,
  BarChart3,
  Users,
  Target,
  Lightbulb,
  BookOpen
} from "lucide-react";

export function PitchSubmission() {
  const [activeTab, setActiveTab] = useState("submit");
  const [pitchForm, setPitchForm] = useState({
    title: "",
    industry: "",
    stage: "",
    fundingGoal: "",
    description: "",
    problem: "",
    solution: "",
    marketSize: "",
    businessModel: "",
    team: "",
    competition: "",
    financials: ""
  });

  const submissions = [
    {
      id: 1,
      title: "EcoTech Solutions - Sustainable Energy Platform",
      submittedDate: "2025-01-25",
      status: "Under Review",
      score: 8.5,
      feedback: "Strong market opportunity, need more details on go-to-market strategy",
      mentor: "Dr. Sarah Johnson",
      views: 12,
      type: "Video Pitch"
    },
    {
      id: 2,
      title: "HealthConnect - AI-Powered Patient Management",
      submittedDate: "2025-01-20",
      status: "Reviewed",
      score: 7.8,
      feedback: "Innovative solution, regulatory concerns need addressing",
      mentor: "Maria Gonzalez",
      views: 8,
      type: "Deck Presentation"
    },
    {
      id: 3,
      title: "FemTech Innovations - Women's Health App",
      submittedDate: "2025-01-15",
      status: "Accepted",
      score: 9.2,
      feedback: "Excellent execution, ready for investor meetings",
      mentor: "Jennifer Kim",
      views: 25,
      type: "Live Pitch"
    }
  ];

  const mentorFeedback = [
    {
      mentor: "Dr. Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b047?w=150&h=150&fit=crop&crop=face",
      rating: 8.5,
      feedback: "Your solution addresses a real market need. The technology is innovative, but I'd like to see more details on your customer acquisition strategy. Consider adding specific metrics about your pilot program results.",
      strengths: ["Strong technical foundation", "Clear problem definition", "Experienced team"],
      improvements: ["Go-to-market strategy", "Financial projections", "Competition analysis"],
      date: "2025-01-26"
    },
    {
      mentor: "Maria Gonzalez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 7.8,
      feedback: "The business model is solid and the market opportunity is significant. However, you need to address regulatory challenges more thoroughly. Your financial projections seem optimistic - provide more conservative scenarios.",
      strengths: ["Large market opportunity", "Solid business model", "Revenue potential"],
      improvements: ["Regulatory strategy", "Risk assessment", "Conservative projections"],
      date: "2025-01-22"
    }
  ];

  const pitchTips = [
    {
      icon: <Target className="h-5 w-5 text-blue-600" />,
      title: "Define the Problem Clearly",
      description: "Start with a compelling problem that resonates with your audience. Use data and real examples."
    },
    {
      icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
      title: "Present Your Unique Solution",
      description: "Explain how your solution is different and better than existing alternatives."
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-green-600" />,
      title: "Show Market Validation",
      description: "Include customer feedback, pilot results, or early traction metrics."
    },
    {
      icon: <Users className="h-5 w-5 text-purple-600" />,
      title: "Highlight Your Team",
      description: "Showcase relevant experience and expertise of key team members."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Pitch Center</h1>
              <p className="text-gray-600 mt-2">Submit, review, and refine your startup pitches</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-blue-100 text-blue-700">
                3 Active Submissions
              </Badge>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                New Pitch
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="submit">Submit Pitch</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="feedback">Mentor Feedback</TabsTrigger>
            <TabsTrigger value="tips">Pitch Tips</TabsTrigger>
          </TabsList>

          {/* Submit New Pitch */}
          <TabsContent value="submit" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Your Pitch</CardTitle>
                    <CardDescription>
                      Share your startup idea and get expert feedback from our mentor community
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Information</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Pitch Title</Label>
                          <Input
                            id="title"
                            placeholder="e.g., EcoTech Solutions"
                            value={pitchForm.title}
                            onChange={(e) => setPitchForm(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="industry">Industry</Label>
                          <Select value={pitchForm.industry} onValueChange={(value) => 
                            setPitchForm(prev => ({ ...prev, industry: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="fintech">Fintech</SelectItem>
                              <SelectItem value="ecommerce">E-commerce</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="sustainability">Sustainability</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="stage">Startup Stage</Label>
                          <Select value={pitchForm.stage} onValueChange={(value) => 
                            setPitchForm(prev => ({ ...prev, stage: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="idea">Idea Stage</SelectItem>
                              <SelectItem value="prototype">Prototype</SelectItem>
                              <SelectItem value="mvp">MVP</SelectItem>
                              <SelectItem value="early-traction">Early Traction</SelectItem>
                              <SelectItem value="growth">Growth Stage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="funding">Funding Goal</Label>
                          <Input
                            id="funding"
                            placeholder="e.g., $500,000"
                            value={pitchForm.fundingGoal}
                            onChange={(e) => setPitchForm(prev => ({ ...prev, fundingGoal: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pitch Content */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Pitch Content</h3>
                      
                      <div>
                        <Label htmlFor="problem">Problem Statement</Label>
                        <Textarea
                          id="problem"
                          placeholder="Describe the problem you're solving..."
                          className="min-h-[100px]"
                          value={pitchForm.problem}
                          onChange={(e) => setPitchForm(prev => ({ ...prev, problem: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="solution">Solution</Label>
                        <Textarea
                          id="solution"
                          placeholder="Explain your solution..."
                          className="min-h-[100px]"
                          value={pitchForm.solution}
                          onChange={(e) => setPitchForm(prev => ({ ...prev, solution: e.target.value }))}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="market">Market Size</Label>
                          <Textarea
                            id="market"
                            placeholder="Describe your target market..."
                            className="min-h-[80px]"
                            value={pitchForm.marketSize}
                            onChange={(e) => setPitchForm(prev => ({ ...prev, marketSize: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="business-model">Business Model</Label>
                          <Textarea
                            id="business-model"
                            placeholder="How will you make money..."
                            className="min-h-[80px]"
                            value={pitchForm.businessModel}
                            onChange={(e) => setPitchForm(prev => ({ ...prev, businessModel: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Supporting Materials</h3>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 cursor-pointer">
                          <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload Video Pitch</p>
                          <p className="text-xs text-gray-400 mt-1">Max 5 minutes</p>
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 cursor-pointer">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload Pitch Deck</p>
                          <p className="text-xs text-gray-400 mt-1">PDF, PPT</p>
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 cursor-pointer">
                          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Financial Model</p>
                          <p className="text-xs text-gray-400 mt-1">Excel, CSV</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <Button variant="outline">Save Draft</Button>
                      <Button>Submit for Review</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Basic Info</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} />
                      <div className="flex justify-between text-sm">
                        <span>Pitch Content</span>
                        <span>40%</span>
                      </div>
                      <Progress value={40} />
                      <div className="flex justify-between text-sm">
                        <span>Supporting Materials</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} />
                    </div>
                  </CardContent>
                </Card>

                {/* Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Be clear and concise in your explanations</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Include specific metrics and data where possible</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Video pitches should be 3-5 minutes</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Pitch decks should be 10-15 slides maximum</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Submissions */}
          <TabsContent value="submissions" className="space-y-6">
            <div className="grid gap-6">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{submission.title}</h3>
                          <Badge 
                            variant={submission.status === 'Accepted' ? 'default' : 
                                   submission.status === 'Under Review' ? 'secondary' : 'outline'}
                          >
                            {submission.status}
                          </Badge>
                          <Badge variant="outline">{submission.type}</Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{submission.feedback}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Submitted {submission.submittedDate}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {submission.views} views
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Reviewed by {submission.mentor}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{submission.score}</div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mentor Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="grid gap-6">
              {mentorFeedback.map((feedback, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={feedback.avatar} />
                        <AvatarFallback>{feedback.mentor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">{feedback.mentor}</h4>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="ml-1 font-medium">{feedback.rating}</span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-500">{feedback.date}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{feedback.feedback}</p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-green-600 mb-2">Strengths</h5>
                            <ul className="space-y-1">
                              {feedback.strengths.map((strength, i) => (
                                <li key={i} className="flex items-center text-sm text-gray-600">
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-orange-600 mb-2">Areas for Improvement</h5>
                            <ul className="space-y-1">
                              {feedback.improvements.map((improvement, i) => (
                                <li key={i} className="flex items-center text-sm text-gray-600">
                                  <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pitch Tips */}
          <TabsContent value="tips" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {pitchTips.map((tip, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {tip.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">{tip.title}</h4>
                        <p className="text-gray-600">{tip.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resources Section */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
                <CardDescription>Helpful materials to improve your pitch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <FileText className="h-8 w-8 text-blue-600 mb-3" />
                    <h5 className="font-medium mb-2">Pitch Deck Template</h5>
                    <p className="text-sm text-gray-600">Professional template with best practices</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Play className="h-8 w-8 text-red-600 mb-3" />
                    <h5 className="font-medium mb-2">Video Examples</h5>
                    <p className="text-sm text-gray-600">Watch successful pitch videos</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <BookOpen className="h-8 w-8 text-green-600 mb-3" />
                    <h5 className="font-medium mb-2">Pitch Training</h5>
                    <p className="text-sm text-gray-600">Complete course on effective pitching</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}