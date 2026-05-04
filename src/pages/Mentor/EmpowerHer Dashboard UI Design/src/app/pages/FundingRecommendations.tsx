import { CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";

const recommendations = [
  {
    id: 1,
    startup: "TechBridge Academy",
    founder: "Sofia Rodriguez",
    score: 90,
    status: "Approved",
    statusColor: "green",
    mentorNotes:
      "Exceptional team with proven traction. Strong business model and clear path to profitability. Highly recommend for Series A consideration.",
    dateRecommended: "Feb 10, 2026",
    industry: "EdTech",
  },
  {
    id: 2,
    startup: "EcoBox",
    founder: "Emma Chen",
    score: 85,
    status: "Under Review",
    statusColor: "yellow",
    mentorNotes:
      "Innovative sustainable packaging solution with strong market validation. Team is executing well. Good candidate for seed funding.",
    dateRecommended: "Feb 12, 2026",
    industry: "Sustainable Packaging",
  },
  {
    id: 3,
    startup: "CleanEnergy Solutions",
    founder: "Maya Johnson",
    score: 78,
    status: "Sent to Admin",
    statusColor: "blue",
    mentorNotes:
      "Solid clean tech startup with promising technology. Needs more customer traction but shows potential for early-stage funding.",
    dateRecommended: "Feb 14, 2026",
    industry: "CleanTech",
  },
  {
    id: 4,
    startup: "FinanceFirst",
    founder: "Aisha Patel",
    score: 82,
    status: "Approved",
    statusColor: "green",
    mentorNotes:
      "Strong fintech platform with regulatory compliance in place. Experienced founder with previous exit. Recommend for pre-seed to seed round.",
    dateRecommended: "Feb 8, 2026",
    industry: "FinTech",
  },
  {
    id: 5,
    startup: "HealthSync",
    founder: "Priya Sharma",
    score: 72,
    status: "Under Review",
    statusColor: "yellow",
    mentorNotes:
      "Healthcare technology with good potential. Team needs strengthening and clearer go-to-market strategy. Monitor for 3 months before funding consideration.",
    dateRecommended: "Feb 5, 2026",
    industry: "HealthTech",
  },
];

const stats = {
  total: 18,
  approved: 12,
  underReview: 4,
  pending: 2,
};

export default function FundingRecommendations() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl">Funding Recommendations</h1>
        <p className="text-gray-500 mt-1">
          Track your funding recommendations and their status.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Recommended</p>
              <p className="text-3xl mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-3xl mt-2">{stats.approved}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Under Review</p>
              <p className="text-3xl mt-2">{stats.underReview}</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-100">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-3xl mt-2">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-medium">{rec.startup}</h3>
                <p className="text-gray-600">Founder: {rec.founder}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Recommended on {rec.dateRecommended}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Readiness Score</p>
                <p className="text-3xl font-medium text-purple-600">
                  {rec.score}
                </p>
                <p className="text-xs text-gray-500">/ 100</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${rec.score}%` }}
                ></div>
              </div>
            </div>

            {/* Mentor Notes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Mentor Notes:
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {rec.mentorNotes}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}