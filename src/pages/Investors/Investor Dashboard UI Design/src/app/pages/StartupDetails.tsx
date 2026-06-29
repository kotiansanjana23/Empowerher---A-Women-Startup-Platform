
import { useInvestorNav } from "../context/NavigationContext";
import { ArrowLeft, TrendingUp, Users, MapPin, DollarSign, Calendar, Download, Mail, Video } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { startups } from "../data/mockData";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StartupDetails() {
  const { startupId: id, navigate, goBack } = useInvestorNav();
  
  const startup = startups.find(s => s.id === Number(id));

  if (!startup) {
    return <div>Startup not found</div>;
  }

  const monthlyData = startup.monthlyGrowth.map((value, index) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index],
    revenue: value * 10000
  }));

  const teamMembers = [
    { name: startup.founder, role: "Founder & CEO", image: startup.founderImage },
    { name: "Sofia Martinez", role: "CTO", image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop" },
    { name: "Hannah Lee", role: "Head of Product", image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop" },
    { name: "Jessica Brown", role: "Head of Marketing", image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=200&h=200&fit=crop" }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2 text-purple-700 hover:bg-purple-50"
        onClick={() => goBack()}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </Button>

      {/* Hero Section */}
      <Card className="overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 border-none">
        <div className="p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <img 
                src={startup.logo} 
                alt={startup.name} 
                className="w-24 h-24 rounded-2xl border-4 border-white/30 bg-white"
              />
              <div>
                <h1 className="text-4xl font-bold mb-2">{startup.name}</h1>
                <p className="text-purple-100 text-lg mb-4">{startup.description}</p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {startup.industry}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {startup.fundingStage}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{startup.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
             
             
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-white/70 backdrop-blur-sm border border-purple-100">
              <p className="text-sm text-gray-500 mb-1">Funding Needed</p>
              <p className="text-2xl font-bold text-purple-700">
                ${(startup.fundingNeeded / 1000).toFixed(0)}K
              </p>
            </Card>
            <Card className="p-4 bg-white/70 backdrop-blur-sm border border-purple-100">
              <p className="text-sm text-gray-500 mb-1">Growth Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {startup.growthRate}%
              </p>
            </Card>
            <Card className="p-4 bg-white/70 backdrop-blur-sm border border-purple-100">
              <p className="text-sm text-gray-500 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(startup.revenue / 1000).toFixed(0)}K
              </p>
            </Card>
            <Card className="p-4 bg-white/70 backdrop-blur-sm border border-purple-100">
              <p className="text-sm text-gray-500 mb-1">Team Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {startup.teamSize}
              </p>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="p-6 bg-white/70 backdrop-blur-sm border border-purple-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Revenue Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E9D5FF',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="revenue" fill="#7B61FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pitch Summary */}
          <Card className="p-6 bg-white/70 backdrop-blur-sm border border-purple-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Pitch Summary</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Problem:</strong> The beauty industry has historically underserved women with 
                melanin-rich skin tones, offering limited product options that don't address their unique skincare needs.
              </p>
              <p>
                <strong>Solution:</strong> {startup.name} leverages AI and dermatological research to provide 
                personalized skincare recommendations and products specifically formulated for diverse skin tones.
              </p>
              <p>
                <strong>Market Opportunity:</strong> The global skincare market is valued at $145B, with the 
                multicultural beauty segment growing at 2x the rate of the overall market.
              </p>
              <p>
                <strong>Traction:</strong> We've achieved {startup.growthRate}% growth rate with ${(startup.revenue / 1000).toFixed(0)}K 
                in annual revenue. Our customer retention rate is 87%, significantly above industry average.
              </p>
            </div>
          </Card>

          {/* Business Model */}
          <Card className="p-6 bg-white/70 backdrop-blur-sm border border-purple-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Business Model</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">Subscription</h4>
                <p className="text-sm text-gray-600">Monthly personalized skincare boxes</p>
                <p className="text-xl font-bold text-purple-700 mt-2">60%</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">E-commerce</h4>
                <p className="text-sm text-gray-600">Direct product sales</p>
                <p className="text-xl font-bold text-purple-700 mt-2">30%</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">Consultation</h4>
                <p className="text-sm text-gray-600">Expert skincare advice</p>
                <p className="text-xl font-bold text-purple-700 mt-2">10%</p>
              </div>
            </div>
          </Card>

          {/* Team Members */}
          <Card className="p-6 bg-white/70 backdrop-blur-sm border border-purple-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Meet the Team</h3>
            <div className="grid grid-cols-2 gap-4">
              {teamMembers.map((member, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100"
                >
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-16 h-16 rounded-full border-2 border-purple-200"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Founder Profile */}
          <Card className="p-6 bg-white/70 backdrop-blur-sm border border-purple-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Founder</h3>
            <div className="text-center">
              <img 
                src={startup.founderImage} 
                alt={startup.founder} 
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-purple-100"
              />
              <h4 className="font-semibold text-xl text-gray-900">{startup.founder}</h4>
              <p className="text-purple-600 text-sm mb-4">Founder & CEO</p>
              <p className="text-sm text-gray-600 mb-4">
                Serial entrepreneur with 10+ years experience in beauty and tech. 
                Previously led product at a Fortune 500 cosmetics company.
              </p>
             
            </div>
          </Card>

          {/* Investment Details */}
         
        </div>
      </div>
    </div>
  );
}