import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { 
  DollarSign,
  Building2,
  Users,
  Calendar,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export function Funding() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedGrants, setAppliedGrants] = useState<string[]>([]);

  const fundingOpportunities = [
    {
      id: "1",
      title: "Women Tech Innovators Grant",
      organization: "TechForward Foundation",
      amount: "$50,000 - $250,000",
      type: "Grant",
      deadline: "Dec 15, 2025",
      location: "Global",
      description: "Supporting women-led technology startups in early growth stages",
      requirements: ["Women-founded", "Tech focus", "Revenue < $1M"],
      stage: "Seed",
      status: "Open"
    },
    {
      id: "2", 
      title: "Female Founders Investment Program",
      organization: "Catalyst Ventures",
      amount: "$100,000 - $2M",
      type: "Investment",
      deadline: "Nov 30, 2025",
      location: "North America",
      description: "Series A funding for scalable women-led businesses",
      requirements: ["Proven traction", "Scalable model", "Strong team"],
      stage: "Series A",
      status: "Open"
    },
    {
      id: "3",
      title: "Small Business Innovation Grant",
      organization: "Government Innovation Fund",
      amount: "$25,000 - $100,000",
      type: "Government Grant",
      deadline: "Jan 20, 2026",
      location: "United States",
      description: "Supporting innovative small businesses with growth potential",
      requirements: ["US-based", "Innovative solution", "Job creation plan"],
      stage: "Early Stage",
      status: "Open"
    },
    {
      id: "4",
      title: "Impact Investment Challenge",
      organization: "Social Impact Partners",
      amount: "$75,000 - $500,000",
      type: "Impact Investment",
      deadline: "Feb 28, 2026",
      location: "Global",
      description: "Funding for startups solving social and environmental challenges",
      requirements: ["Social impact", "Measurable outcomes", "Sustainability focus"],
      stage: "Growth",
      status: "Opening Soon"
    }
  ];

  const applications = [
    {
      title: "Women Tech Innovators Grant",
      status: "Under Review",
      submittedDate: "Sep 15, 2025",
      amount: "$150,000",
      progress: 75
    },
    {
      title: "Female Founders Investment Program", 
      status: "Approved for Interview",
      submittedDate: "Aug 20, 2025",
      amount: "$500,000",
      progress: 90
    },
    {
      title: "Small Business Innovation Grant",
      status: "Document Review",
      submittedDate: "Oct 1, 2025",
      amount: "$75,000",
      progress: 60
    }
  ];

  const fundingTips = [
    {
      title: "Perfect Your Pitch Deck",
      description: "Create a compelling story that showcases your vision and potential",
      icon: TrendingUp
    },
    {
      title: "Know Your Numbers",
      description: "Have clear financial projections and understand your metrics",
      icon: DollarSign
    },
    {
      title: "Build Strong Relationships",
      description: "Network with investors and maintain ongoing communication",
      icon: Users
    },
    {
      title: "Understand the Process",
      description: "Research each funder's requirements and application timeline",
      icon: Clock
    }
  ];

  const successStories = [
    {
      founder: "Sarah Chen",
      company: "EcoTech Solutions",
      amount: "$2.5M",
      description: "Raised Series A for sustainable packaging technology"
    },
    {
      founder: "Maria Rodriguez", 
      company: "HealthAI",
      amount: "$1.8M",
      description: "Secured funding for AI-powered healthcare diagnostics"
    },
    {
      founder: "Jessica Taylor",
      company: "EduConnect",
      amount: "$3.2M",
      description: "Raised Series B for online education platform"
    }
  ];

  const applyToFunding = (fundingId: string) => {
    if (!appliedGrants.includes(fundingId)) {
      setAppliedGrants([...appliedGrants, fundingId]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-green-100 text-green-800";
      case "Opening Soon": return "bg-blue-100 text-blue-800";
      case "Closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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
                <h1 className="text-3xl font-bold mb-2">Funding Hub</h1>
                <p className="text-purple-100 text-lg">
                  Discover funding opportunities and accelerate your startup's growth
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-sm text-purple-100 mb-1">Total Applied</div>
                  <div className="text-2xl font-bold">$725K</div>
                  <div className="text-sm text-purple-100">3 active applications</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="tips">Funding Tips</TabsTrigger>
            <TabsTrigger value="success">Success Stories</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search funding opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="sm:w-auto w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Funding Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fundingOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{opportunity.title}</CardTitle>
                        <CardDescription className="flex items-center space-x-2 mb-2">
                          <Building2 className="h-4 w-4" />
                          <span>{opportunity.organization}</span>
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(opportunity.status)}>
                        {opportunity.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{opportunity.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{opportunity.amount}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>{opportunity.deadline}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-purple-600" />
                          <span>{opportunity.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{opportunity.type}</Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Requirements:</h4>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.requirements.map((req, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {appliedGrants.includes(opportunity.id) ? (
                          <Button 
                            disabled 
                            className="flex-1 bg-gray-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Applied
                          </Button>
                        ) : (
                          <Button 
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            onClick={() => applyToFunding(opportunity.id)}
                          >
                            Apply Now
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="space-y-4">
              {applications.map((application, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{application.title}</h3>
                        <p className="text-sm text-gray-600">
                          Applied on {application.submittedDate} • {application.amount}
                        </p>
                      </div>
                      <Badge 
                        className={
                          application.status === "Approved for Interview" 
                            ? "bg-green-100 text-green-800"
                            : application.status === "Under Review"
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Application Progress</span>
                        <span>{application.progress}%</span>
                      </div>
                      <Progress value={application.progress} className="h-2" />
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {application.status === "Approved for Interview" && (
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          Schedule Interview
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fundingTips.map((tip, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                        <tip.icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{tip.title}</h3>
                        <p className="text-gray-600">{tip.description}</p>
                        <Button variant="ghost" size="sm" className="mt-3 p-0 h-auto text-purple-600">
                          Learn more <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Funding Preparation Checklist</CardTitle>
                <CardDescription>
                  Essential steps to prepare for your funding applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Complete your business plan and financial projections",
                    "Prepare a compelling pitch deck (10-15 slides)",
                    "Gather legal documents and incorporation papers",
                    "Document your team's background and expertise",
                    "Compile customer testimonials and case studies",
                    "Research potential investors and their focus areas"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Success Stories Tab */}
          <TabsContent value="success" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {successStories.map((story, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{story.founder}</h3>
                        <p className="text-purple-600 font-medium">{story.company}</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">{story.amount}</p>
                      </div>
                      <p className="text-sm text-gray-600">{story.description}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        Read Full Story
                      </Button>
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
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span>Funding Calculators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Valuation Calculator</h4>
                      <p className="text-sm text-gray-600">Estimate your startup's value</p>
                    </div>
                    <div className="border-l-4 border-pink-600 pl-4">
                      <h4 className="font-medium">Equity Calculator</h4>
                      <p className="text-sm text-gray-600">Calculate equity distribution</p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Runway Calculator</h4>
                      <p className="text-sm text-gray-600">Plan your cash flow</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Access Tools
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <span>Investor Database</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Angel Investors</h4>
                      <p className="text-sm text-gray-600">2,500+ active angels</p>
                    </div>
                    <div className="border-l-4 border-pink-600 pl-4">
                      <h4 className="font-medium">VC Firms</h4>
                      <p className="text-sm text-gray-600">800+ venture capitals</p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Government Grants</h4>
                      <p className="text-sm text-gray-600">200+ programs</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Browse Database
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Market Intelligence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Industry Trends</h4>
                      <p className="text-sm text-gray-600">Latest market insights</p>
                    </div>
                    <div className="border-l-4 border-pink-600 pl-4">
                      <h4 className="font-medium">Funding Trends</h4>
                      <p className="text-sm text-gray-600">Investment patterns</p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-medium">Competitor Analysis</h4>
                      <p className="text-sm text-gray-600">Market positioning</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View Reports
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