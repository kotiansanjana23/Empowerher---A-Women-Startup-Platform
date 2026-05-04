// import { useState } from "react";
// import { TrendingUp, AlertCircle } from "lucide-react";

// export default function ReadinessEvaluation() {
//   const [scores, setScores] = useState({
//     businessModel: 15,
//     marketValidation: 14,
//     financialPlanning: 16,
//     teamStrength: 18,
//     pitchQuality: 17,
//   });

//   const [comments, setComments] = useState("");
//   const [showRecommendModal, setShowRecommendModal] = useState(false);

//   const handleScoreChange = (field: string, value: number) => {
//     setScores((prev) => ({ ...prev, [field]: value }));
//   };

//   const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
//   const percentage = totalScore;

//   // 🔥 Always Green Status
//   const getStatus = () => {
//     if (percentage >= 80) return { label: "Funding Ready", color: "green" };
//     if (percentage >= 60) return { label: "Improving", color: "green" };
//     return { label: "Early Stage", color: "green" };
//   };

//   const status = getStatus();

//   const handleSave = () => {
//     alert("Evaluation saved successfully!");
//   };

//   const handleRecommend = () => {
//     setShowRecommendModal(true);
//   };

//   const confirmRecommendation = () => {
//     alert("Funding recommendation submitted to admin!");
//     setShowRecommendModal(false);
//   };

//   const criteria = [
//     { key: "businessModel", label: "Business Model", description: "Viability, scalability, and revenue model clarity" },
//     { key: "marketValidation", label: "Market Validation", description: "Customer traction, market size, and demand proof" },
//     { key: "financialPlanning", label: "Financial Planning", description: "Projections, unit economics, and financial health" },
//     { key: "teamStrength", label: "Team Strength", description: "Expertise, completeness, and execution capability" },
//     { key: "pitchQuality", label: "Pitch Quality", description: "Clarity, persuasiveness, and presentation skills" },
//   ];

//   return (
//     <div className="p-6 space-y-6">
//       <div>
//         <h1 className="text-3xl">Startup Readiness Evaluation</h1>
//         <p className="text-gray-500 mt-1">
//           Assess founder readiness across key criteria (0-20 points each).
//         </p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//         {/* LEFT COLUMN */}
//         <div className="lg:col-span-2 space-y-6">

//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
//             <label className="block text-sm font-medium mb-2">Select Founder</label>
//             <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
//               <option>Emma Chen - EcoBox</option>
//               <option>Priya Sharma - HealthSync</option>
//               <option>Sofia Rodriguez - TechBridge Academy</option>
//               <option>Lisa Anderson - FoodChain</option>
//               <option>Maya Johnson - CleanEnergy Solutions</option>
//             </select>
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
//             <h2 className="text-xl">Evaluation Criteria</h2>

//             {criteria.map((criterion) => (
//               <div key={criterion.key} className="space-y-3">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <h3 className="font-medium">{criterion.label}</h3>
//                     <p className="text-sm text-gray-600">{criterion.description}</p>
//                   </div>
//                   <div className="text-right ml-4">
//                     <span className="text-2xl font-medium text-purple-600">
//                       {scores[criterion.key as keyof typeof scores]}
//                     </span>
//                     <span className="text-sm text-gray-500"> / 20</span>
//                   </div>
//                 </div>

//                 <input
//                   type="range"
//                   min="0"
//                   max="20"
//                   value={scores[criterion.key as keyof typeof scores]}
//                   onChange={(e) => handleScoreChange(criterion.key, parseInt(e.target.value))}
//                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
//                 />
//               </div>
//             ))}
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
//             <h2 className="text-xl mb-4">Mentor Comments</h2>
//             <textarea
//               value={comments}
//               onChange={(e) => setComments(e.target.value)}
//               className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//               rows={6}
//               placeholder="Provide detailed feedback..."
//             />
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={handleSave}
//               className="flex-1 px-6 py-3 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
//             >
//               Save Evaluation
//             </button>

//             <button
//               onClick={handleRecommend}
//               className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2"
//             >
//               <TrendingUp size={20} />
//               Recommend for Funding
//             </button>
//           </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="space-y-6">

//           {/* 🔥 Total Score Card (Progress Bar Green) */}
//           <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
//             <h2 className="text-lg mb-4 opacity-90">Total Score</h2>

//             <div className="text-center mb-4">
//               <p className="text-6xl font-medium">{totalScore}</p>
//               <p className="text-lg opacity-90">out of 100</p>
//             </div>

//             <div>
//               <div
                
//                 style={{ width: `${percentage}%` }}
//               ></div>
//             </div>

//             <div className="text-center">
//               <span className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full backdrop-blur-sm text-black font-medium">
//                 {percentage}% Ready
//               </span>
//             </div>
//           </div>

//           {/* 🔥 Readiness Status Always Green */}
//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
//             <h3 className="font-medium mb-3">Readiness Status</h3>

//             <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200 text-center">
//               <p className="text-xl font-medium text-green-700">
//                 {status.label}
//               </p>
//             </div>
//           </div>

//           {/* Info Box */}
//           <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
//             <div className="flex gap-3">
//               <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
//               <div>
//                 <p className="text-sm text-blue-900 font-medium mb-1">
//                   Funding Recommendation
//                 </p>
//                 <p className="text-xs text-blue-700 leading-relaxed">
//                   Scores above 80 are typically recommended for funding consideration.
//                 </p>
//               </div>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertCircle, ArrowLeft } from "lucide-react";


export default function ReadinessEvaluation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scores, setScores] = useState({
    businessModel: 15,
    marketValidation: 14,
    financialPlanning: 16,
    teamStrength: 18,
    pitchQuality: 17,
  });

  const [comments, setComments] = useState("");

  const handleScoreChange = (field: string, value: number) => {
    setScores((prev) => ({ ...prev, [field]: value }));
  };

  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0
  );

  const percentage = totalScore;

  const getStatus = () => {
    if (percentage >= 80)
      return { label: "Funding Ready", color: "green" };
    if (percentage >= 60)
      return { label: "Improving", color: "yellow" };
    return { label: "Early Stage", color: "red" };
  };

  const status = getStatus();

  const handleSave = () => {
    const stored = JSON.parse(localStorage.getItem("myFounders") || "[]");

    const updated = stored.map((f: any) => {
      if (f.id == id) {
        return {
          ...f,
          evaluation: {
            scores,
            percentage,
            status: status.label,
            comments,
          },
        };
      }
      return f;
    });

    localStorage.setItem("myFounders", JSON.stringify(updated));

    alert("Evaluation saved successfully!");

    navigate(`/review-pitch/${id}`);
  };

  const criteria = [
    {
      key: "businessModel",
      label: "Business Model",
      description: "Scalability and revenue clarity",
    },
    {
      key: "marketValidation",
      label: "Market Validation",
      description: "Customer traction & demand",
    },
    {
      key: "financialPlanning",
      label: "Financial Planning",
      description: "Unit economics & projections",
    },
    {
      key: "teamStrength",
      label: "Team Strength",
      description: "Execution capability",
    },
    {
      key: "pitchQuality",
      label: "Pitch Quality",
      description: "Clarity & persuasiveness",
    },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-semibold">
          Startup Readiness Evaluation
        </h1>
        <p className="text-gray-500 mt-1">
          Assess founder readiness across key criteria (0-20 points each).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-xl font-semibold">
              Evaluation Criteria
            </h2>

            {criteria.map((criterion) => (
              <div key={criterion.key} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">
                      {criterion.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {criterion.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-semibold text-purple-600">
                      {scores[criterion.key as keyof typeof scores]}
                    </span>
                    <span className="text-sm text-gray-500"> / 20</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scores[criterion.key as keyof typeof scores]}
                  onChange={(e) =>
                    handleScoreChange(
                      criterion.key,
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full accent-purple-600"
                />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl mb-4">
              Mentor Comments
            </h2>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={6}
              placeholder="Provide detailed feedback..."
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
          >
            Save Evaluation
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* Score Card */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-lg mb-4 opacity-90">
              Total Score
            </h2>

            <div className="text-center mb-4">
              <p className="text-6xl font-bold">
                {totalScore}
              </p>
              <p className="text-lg opacity-90">
                out of 100
              </p>
            </div>

            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-black font-medium">
                {percentage}% Ready
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl p-6 shadow border">
            <h3 className="font-medium mb-3">
              Readiness Status
            </h3>

            <div
              className={`p-4 rounded-xl text-center font-semibold ${
                status.color === "green"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : status.color === "yellow"
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.label}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex gap-3">
              <AlertCircle
                className="text-blue-600"
                size={20}
              />
              <p className="text-sm text-blue-700">
                Scores above 80 are typically recommended
                for funding consideration.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}