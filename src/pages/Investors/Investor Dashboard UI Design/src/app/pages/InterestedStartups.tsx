
import { useState } from "react";
import { Heart, TrendingUp, MapPin, DollarSign, ExternalLink, Search } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { startups } from "../data/mockData";
import { useInvestorNav } from "../context/NavigationContext";

export default function InterestedStartups() {
  const { navigate } = useInvestorNav();
  const [search, setSearch] = useState("");
  const [interested, setInterested] = useState<number[]>(
    startups.slice(0, 4).map((s) => s.id)
  );

  const interestedList = startups.filter((s) => interested.includes(s.id));
  const filtered = interestedList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase())
  );

  const removeInterest = (id: number) =>
    setInterested((prev) => prev.filter((i) => i !== id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interested Startups</h1>
          <p className="text-gray-500 mt-1">
            Startups you've expressed interest in — {filtered.length} saved
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved startups..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-purple-200 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No saved startups yet</h3>
          <p className="text-gray-400 mt-1 mb-6">
            Browse startups and save ones you're interested in
          </p>
          <Button
            onClick={() => navigate("explore")}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"
          >
            Explore Startups
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((startup) => (
            <Card key={startup.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={startup.logo}
                    alt={startup.name}
                    className="w-12 h-12 rounded-xl object-cover border border-purple-100"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{startup.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {startup.location}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeInterest(startup.id)}
                  className="p-1.5 rounded-lg text-pink-500 hover:bg-pink-50 transition-all"
                  title="Remove from interested"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{startup.description}</p>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                  {startup.industry}
                </Badge>
                <Badge variant="outline" className="text-pink-700 border-pink-200 bg-pink-50">
                  {startup.fundingStage}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>{startup.growthRate}% growth</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 text-purple-500" />
                  <span>${(startup.fundingNeeded / 1000).toFixed(0)}K needed</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => navigate("startup-details", { startupId: String(startup.id) })}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}