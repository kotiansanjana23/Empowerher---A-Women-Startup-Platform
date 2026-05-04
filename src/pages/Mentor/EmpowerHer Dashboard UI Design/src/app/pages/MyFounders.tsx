import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { DollarSign, Trash2 } from "lucide-react";

export default function MyFounders() {
  const navigate = useNavigate();
  const [founders, setFounders] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myFounders") || "[]");
    setFounders(stored);
  }, []);

  const getStatusStyle = (percentage: number) => {
    if (percentage >= 80)
      return "bg-green-100 text-green-700";
    if (percentage >= 60)
      return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // ✅ REMOVE FOUNDER FUNCTION
  const handleRemoveFounder = (id: number) => {
    const updated = founders.filter((f) => f.id !== id);

    // Update state
    setFounders(updated);

    // Update localStorage
    localStorage.setItem("myFounders", JSON.stringify(updated));

    // Navigate back to session requests page
    navigate("/mentor/session-requests");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-semibold text-black">My Founders</h1>
        <p className="text-gray-500 mt-1">
          You're currently mentoring {founders.length} founders
        </p>
      </div>

      {founders.length === 0 ? (
        <p className="text-gray-500">No accepted founders yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {founders.map((founder) => {
            const evaluation = founder.evaluation;

            return (
              <div
                key={founder.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Founder Header */}
                <div className="flex items-start gap-4 mb-4">
                  <ImageWithFallback
                    src={founder.photo}
                    alt={founder.founder}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-lg text-black">
                      {founder.founder}
                    </h3>
                    <p className="text-purple-600 text-sm">
                      {founder.startup}
                    </p>
                  </div>
                </div>

                {/* Industry */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {founder.industry}
                  </span>
                </div>

                {/* Funding Status */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-gray-600" />
                    <p className="text-xs text-gray-600">
                      Funding Status
                    </p>
                  </div>
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {founder.fundingStatus || "Early Stage"}
                  </span>
                </div>

                {/* Evaluation Info */}
                {evaluation && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">
                        Readiness Score
                      </span>
                      <span className="text-sm font-medium text-purple-600">
                        {evaluation.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{
                          width: `${evaluation.percentage}%`,
                        }}
                      ></div>
                    </div>

                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        evaluation.percentage
                      )}`}
                    >
                      {evaluation.status}
                    </span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 flex-wrap">

                  {/* Review Pitch */}
                  <button
                    onClick={() =>
                      navigate(`/mentor/review-pitch/${founder.id}`)
                    }
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm hover:from-purple-700 hover:to-pink-700 transition-colors"
                  >
                    📥 Review Pitch
                  </button>

                  {/* Mentor Hub */}
                  <button
                    onClick={() =>
                      navigate(`/mentor/mentor-hub/${founder.id}`)
                    }
                    className="flex-1 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                  >
                    🧠 Mentor Hub
                  </button>

                  {/* ✅ Remove Button */}
                  <button
                    onClick={() =>
                      handleRemoveFounder(founder.id)
                    }
                    className="w-full mt-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-orange-200 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    End Mentorship
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}