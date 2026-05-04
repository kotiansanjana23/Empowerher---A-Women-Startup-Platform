import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Search,
  Filter,
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  Video,
  Clock,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  Send,
  Briefcase,
  GraduationCap,
  Building2,
  Check,
  AlertCircle
} from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../../../../../firebase";

export function MentorMatching() {
  const [selectedFilters, setSelectedFilters] = useState({
    industry: null as string | null,
    expertise: null as string | null,
    experience: null as string | null,
    location: null as string | null
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMentorId, setLoadingMentorId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mentors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      title: "Former VP Engineering",
      company: "Google",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b047?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      reviews: 127,
      expertise: ["Tech Scaling", "Product Development", "Team Building"],
      industry: "Technology",
      experience: "15+ years",
      location: "San Francisco, CA",
      matchScore: 95,
      bio: "Experienced technology leader with a passion for mentoring women in tech. Helped scale engineering teams from 10 to 500+ people.",
      achievements: ["Led $50M Series B", "Built 3 unicorn products", "Mentored 50+ founders"],
      price: "Free",
      availability: "Available this week",
      languages: ["English", "Spanish"],
      sessions: 340,
      responseTime: "< 2 hours"
    },
    {
      id: 2,
      name: "Maria Gonzalez",
      title: "CEO & Founder",
      company: "FinTech Innovations",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4.8,
      reviews: 89,
      expertise: ["Fundraising", "Financial Strategy", "Startup Growth"],
      industry: "Fintech",
      experience: "12+ years",
      location: "New York, NY",
      matchScore: 88,
      bio: "Serial entrepreneur who raised $100M+ across 3 startups. Specializes in helping female founders navigate fundraising.",
      achievements: ["Raised $100M+ funding", "3x successful exits", "Forbes 40 Under 40"],
      price: "$150/session",
      availability: "Next week",
      languages: ["English", "Spanish", "Portuguese"],
      sessions: 220,
      responseTime: "< 4 hours"
    },
    {
      id: 3,
      name: "Jennifer Kim",
      title: "Serial Entrepreneur",
      company: "Multiple Ventures",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 4.7,
      reviews: 156,
      expertise: ["Business Development", "Marketing", "Customer Acquisition"],
      industry: "E-commerce",
      experience: "10+ years",
      location: "Austin, TX",
      matchScore: 82,
      bio: "Built and sold 2 e-commerce companies. Expert in customer acquisition and digital marketing strategies.",
      achievements: ["2 successful exits", "$20M+ revenue generated", "1M+ customers acquired"],
      price: "$100/session",
      availability: "Available today",
      languages: ["English", "Korean"],
      sessions: 450,
      responseTime: "< 1 hour"
    },
    {
      id: 4,
      name: "Dr. Priya Patel",
      title: "Chief Innovation Officer",
      company: "HealthTech Corp",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      reviews: 203,
      expertise: ["Healthcare Innovation", "Product Strategy", "Regulatory Affairs"],
      industry: "Healthcare",
      experience: "18+ years",
      location: "Boston, MA",
      matchScore: 76,
      bio: "Leading healthcare innovation with 20+ patents and experience bringing medical devices to market.",
      achievements: ["20+ patents", "FDA approvals", "Medical device expert"],
      price: "$200/session",
      availability: "Next month",
      languages: ["English", "Hindi", "French"],
      sessions: 180,
      responseTime: "< 6 hours"
    }
  ];

  const handleConnectMentor = async (mentor: typeof mentors[0]) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      setErrorMessage("Please log in to connect with mentors");
      return;
    }

    setLoadingMentorId(mentor.id);
    setErrorMessage("");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await addDoc(collection(db, "sessionRequests"), {
        founder: user.email,
        founderId: user.uid,
        mentorName: mentor.name,
        startup: "Your Startup", // TODO: Fetch this from user profile in Firestore
        status: "pending",
        requestedDate: today,
        createdAt: new Date(),
        mentorId: mentor.id
      });

      setSuccessMessage(`Session request sent to ${mentor.name}!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to send session request");
    } finally {
      setLoadingMentorId(null);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = searchQuery === "" ||
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mentor.industry.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry = !selectedFilters.industry || mentor.industry === selectedFilters.industry;
    const matchesExperience = !selectedFilters.experience || mentor.experience === selectedFilters.experience;

    return matchesSearch && matchesIndustry && matchesExperience;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">AI Mentor Matching</h1>
              <p className="text-gray-600 mt-2">Connect with industry experts who understand your journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-purple-100 text-purple-700">
                {filteredMentors.length} mentors available
              </Badge>
              <Button>
                <Heart className="h-4 w-4 mr-2" />
                Saved Mentors
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search mentors..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <Label>Industry</Label>
                  <Select value={selectedFilters.industry || "all"} onValueChange={(value) => 
                    setSelectedFilters(prev => ({ ...prev, industry: value === "all" ? null : value }))
                  }>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Fintech">Fintech</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div>
                  <Label>Experience Level</Label>
                  <Select value={selectedFilters.experience || "all"} onValueChange={(value) => 
                    setSelectedFilters(prev => ({ ...prev, experience: value === "all" ? null : value }))
                  }>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="5+ years">5+ years</SelectItem>
                      <SelectItem value="10+ years">10+ years</SelectItem>
                      <SelectItem value="15+ years">15+ years</SelectItem>
                      <SelectItem value="20+ years">20+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expertise Areas */}
                <div>
                  <Label>Expertise</Label>
                  <Select value={selectedFilters.expertise || "all"} onValueChange={(value) => 
                    setSelectedFilters(prev => ({ ...prev, expertise: value === "all" ? null : value }))
                  }>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select expertise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Expertise</SelectItem>
                      <SelectItem value="Fundraising">Fundraising</SelectItem>
                      <SelectItem value="Product Development">Product Development</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Tech Scaling">Tech Scaling</SelectItem>
                      <SelectItem value="Business Development">Business Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedFilters({ industry: null, expertise: null, experience: null, location: null })}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Mentors Grid */}
          <div className="lg:col-span-3">
            <div className="grid gap-6">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                      {/* Avatar and Basic Info */}
                      <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={mentor.avatar} />
                          <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {mentor.matchScore}% match
                            </Badge>
                          </div>
                          <p className="text-purple-600 font-medium">{mentor.title}</p>
                          <p className="text-gray-600 flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {mentor.company}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {mentor.location}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {mentor.responseTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 lg:max-w-md">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 font-medium">{mentor.rating}</span>
                            <span className="text-gray-500 ml-1">({mentor.reviews} reviews)</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{mentor.sessions} sessions</span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{mentor.bio}</p>

                        {/* Expertise Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {mentor.expertise.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {/* Price and Availability */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-medium text-green-600">{mentor.price}</span>
                          <span className="text-sm text-gray-600">{mentor.availability}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1">
                                View Profile
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center space-x-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={mentor.avatar} />
                                    <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-2xl font-bold">{mentor.name}</h3>
                                    <p className="text-purple-600">{mentor.title} at {mentor.company}</p>
                                  </div>
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-6">
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{mentor.rating}</div>
                                    <div className="text-sm text-gray-600">Rating</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{mentor.sessions}</div>
                                    <div className="text-sm text-gray-600">Sessions</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{mentor.matchScore}%</div>
                                    <div className="text-sm text-gray-600">Match</div>
                                  </div>
                                </div>

                                {/* Bio */}
                                <div>
                                  <h4 className="font-medium mb-2">About</h4>
                                  <p className="text-gray-600">{mentor.bio}</p>
                                </div>

                                {/* Achievements */}
                                <div>
                                  <h4 className="font-medium mb-2">Key Achievements</h4>
                                  <ul className="space-y-1">
                                    {mentor.achievements.map((achievement, index) => (
                                      <li key={index} className="flex items-center text-sm text-gray-600">
                                        <Award className="h-4 w-4 mr-2 text-yellow-500" />
                                        {achievement}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Expertise */}
                                <div>
                                  <h4 className="font-medium mb-2">Expertise</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {mentor.expertise.map((skill, index) => (
                                      <Badge key={index} variant="secondary">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Languages */}
                                <div>
                                  <h4 className="font-medium mb-2">Languages</h4>
                                  <p className="text-gray-600">{mentor.languages.join(', ')}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleConnectMentor(mentor)}
                            disabled={loadingMentorId === mentor.id}
                          >
                            {loadingMentorId === mentor.id ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Connect
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <Button variant="outline">
                Load More Mentors
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}