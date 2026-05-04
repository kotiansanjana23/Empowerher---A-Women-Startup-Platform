import { Star } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const reviews = [
  {
    id: 1,
    founder: "Emma Chen",
    photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "EcoBox",
    rating: 5,
    comment: "Sarah has been instrumental in helping me refine our pitch and business model. Her insights on sustainable packaging markets were invaluable. Highly recommend!",
    date: "Feb 12, 2026",
  },
  {
    id: 2,
    founder: "Priya Sharma",
    photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "HealthSync",
    rating: 5,
    comment: "Incredible mentor! Sarah's expertise in healthcare regulations and her network of hospital contacts helped us navigate complex compliance issues. Very grateful for her guidance.",
    date: "Feb 10, 2026",
  },
  {
    id: 3,
    founder: "Sofia Rodriguez",
    photo: "https://images.unsplash.com/photo-1758369636875-60b3dcb76366?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "TechBridge Academy",
    rating: 5,
    comment: "Sarah's mentorship transformed our approach to B2B education sales. Her strategic advice on university partnerships and curriculum development was spot-on. Thank you!",
    date: "Feb 8, 2026",
  },
  {
    id: 4,
    founder: "Lisa Anderson",
    photo: "https://images.unsplash.com/photo-1754298949882-216a1c92dbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "FoodChain",
    rating: 5,
    comment: "Working with Sarah has been amazing. She helped us optimize our supply chain and introduced us to potential investors. Her practical experience in AgriTech is unmatched.",
    date: "Feb 5, 2026",
  },
  {
    id: 5,
    founder: "Maya Johnson",
    photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "CleanEnergy Solutions",
    rating: 4,
    comment: "Sarah provided excellent guidance on our financial projections and investor deck. Her feedback was direct and actionable. Would love to continue working with her.",
    date: "Jan 30, 2026",
  },
  {
    id: 6,
    founder: "Aisha Patel",
    photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "FinanceFirst",
    rating: 5,
    comment: "Sarah's mentorship was exactly what we needed. Her experience in FinTech fundraising and regulatory compliance saved us months of trial and error. Highly professional!",
    date: "Jan 28, 2026",
  },
];

const ratingDistribution = [
  { stars: 5, count: 16, percentage: 89 },
  { stars: 4, count: 2, percentage: 11 },
  { stars: 3, count: 0, percentage: 0 },
  { stars: 2, count: 0, percentage: 0 },
  { stars: 1, count: 0, percentage: 0 },
];

const averageRating = 4.9;
const totalReviews = 18;

export default function Reviews() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl">Reviews & Ratings</h1>
        <p className="text-gray-500 mt-1">See what founders are saying about your mentorship.</p>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Rating Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg text-center">
          <p className="text-sm opacity-90 mb-2">Average Rating</p>
          <p className="text-6xl font-medium mb-3">{averageRating}</p>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={star <= Math.floor(averageRating) ? "fill-white" : "fill-white opacity-30"}
              />
            ))}
          </div>
          <p className="text-sm opacity-90">Based on {totalReviews} reviews</p>
        </div>

        {/* Rating Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {ratingDistribution.map((rating) => (
              <div key={rating.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating.stars}</span>
                  <Star size={14} className="fill-yellow-500 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                      style={{ width: `${rating.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{rating.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option>All Ratings</option>
          <option>5 Stars</option>
          <option>4 Stars</option>
          <option>3 Stars</option>
          <option>2 Stars</option>
          <option>1 Star</option>
        </select>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option>Most Recent</option>
          <option>Highest Rating</option>
          <option>Lowest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <ImageWithFallback
                src={review.photo}
                alt={review.founder}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{review.founder}</h3>
                    <p className="text-sm text-purple-600">{review.startup}</p>
                  </div>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>

                {/* Star Rating */}
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}
                    />
                  ))}
                </div>

                {/* Review Comment */}
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="text-sm text-purple-600 hover:text-purple-700">
                    Reply
                  </button>
                  <span className="text-gray-300">•</span>
                  <button className="text-sm text-gray-600 hover:text-gray-700">
                    Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="px-6 py-3 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
          Load More Reviews
        </button>
      </div>
    </div>
  );
}
