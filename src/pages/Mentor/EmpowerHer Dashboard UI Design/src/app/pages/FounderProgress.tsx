// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { ArrowLeft, Rocket, TrendingUp } from "lucide-react";

// export default function FounderProgress() {
//   const navigate = useNavigate();
//   const [founders, setFounders] = useState<any[]>([]);
//   const [selectedId, setSelectedId] = useState<string>("");

//   useEffect(() => {
//     const stored = JSON.parse(
//       localStorage.getItem("myFounders") || "[]"
//     );
//     setFounders(stored);
//     if (stored.length > 0) {
//       setSelectedId(String(stored[0].id));
//     }
//   }, []);

//   const founder = founders.find(
//     (f) => String(f.id) === String(selectedId)
//   );

//   if (!founder) {
//     return (
//       <div className="p-6 text-gray-500">
//         No founders available.
//       </div>
//     );
//   }

//   /* ========================
//      CALCULATIONS
//   ======================== */

//   const readiness =
//     Number(founder?.evaluation?.percentage) || 0;

//   const milestones =
//     founder?.mentorHub?.milestones || {
//       product: 65,
//       traction: 55,
//       revenue: 40,
//       branding: 75,
//       pitch: 80,
//     };

//   const handleRecommend = () => {
//     const updated = founders.map((f) =>
//       String(f.id) === String(selectedId)
//         ? { ...f, status: "recommended" }
//         : f
//     );

//     localStorage.setItem(
//       "myFounders",
//       JSON.stringify(updated)
//     );

//     alert("Founder Recommended!");
//     navigate("/funding-match");
//   };

//   const handleImprove = () => {
//     navigate(`/mentor-hub/${selectedId}`);
//   };

//   /* ========================
//      UI
//   ======================== */

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
//       <div className="max-w-7xl mx-auto space-y-10">

//         {/* HEADER */}
//         <div className="flex justify-between items-center">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
//           >
//             <ArrowLeft size={18} />
//             Back
//           </button>

//           <select
//             value={selectedId}
//             onChange={(e) =>
//               setSelectedId(e.target.value)
//             }
//             className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500"
//           >
//             {founders.map((f) => (
//               <option key={f.id} value={f.id}>
//                 {f.founder} – {f.startup}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* HERO CARD */}
//         <div className="bg-white rounded-3xl p-10 shadow-xl border">
//           <h1 className="text-3xl font-bold text-purple-700">
//             Founder Performance Overview
//           </h1>
//           <p className="text-gray-500 mt-2">
//             {founder.founder} — {founder.startup}
//           </p>
//         </div>

//         {/* CHART GRID */}
//         <div className="grid md:grid-cols-2 gap-10">

//           {/* READINESS RING */}
//           <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
//             <h2 className="text-xl font-semibold mb-6">
//               Readiness Progress
//             </h2>

//             <div className="relative w-52 h-52 mx-auto">
//               <div
//                 className="w-full h-full rounded-full"
//                 style={{
//                   background: `conic-gradient(
//                     #7c3aed ${readiness * 3.6}deg,
//                     #e5e7eb 0deg
//                   )`,
//                 }}
//               ></div>

//               <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center shadow-inner">
//                 <span className="text-3xl font-bold text-purple-600">
//                   {readiness}%
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* BAR GRAPH */}
//           <div className="bg-white rounded-3xl p-8 shadow-lg">
//             <h2 className="text-xl font-semibold mb-6">
//               Milestone Progress
//             </h2>

//             {Object.entries(milestones).map(
//               ([key, value]: any) => (
//                 <div key={key} className="mb-4">
//                   <div className="flex justify-between mb-1">
//                     <span className="capitalize">
//                       {key}
//                     </span>
//                     <span>{value}%</span>
//                   </div>

//                   <div className="w-full bg-gray-200 rounded-full h-3">
//                     <div
//                       className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
//                       style={{ width: `${value}%` }}
//                     ></div>
//                   </div>
//                 </div>
//               )
//             )}
//           </div>

//         </div>

//         {/* RADAR STYLE VISUAL */}
//         <div className="bg-white rounded-3xl p-10 shadow-lg">
//           <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
//             <TrendingUp size={20} />
//             Capability Radar
//           </h2>

//           <div className="grid grid-cols-5 gap-6 text-center">
//             {Object.entries(milestones).map(
//               ([key, value]: any) => (
//                 <div key={key}>
//                   <div
//                     className="mx-auto rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-semibold"
//                     style={{
//                       width: `${value / 1.5}px`,
//                       height: `${value / 1.5}px`,
//                       minWidth: "40px",
//                       minHeight: "40px",
//                     }}
//                   >
//                     {value}
//                   </div>
//                   <p className="mt-2 text-sm capitalize">
//                     {key}
//                   </p>
//                 </div>
//               )
//             )}
//           </div>
//         </div>

        

//         {/* ACTION BUTTONS */}
//         <div className="flex justify-center gap-6">

//           <button
//             onClick={handleImprove}
//             className="px-6 py-3 border border-purple-600 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition"
//           >
//             Improve Strategy
//           </button>

//           <button
//             onClick={handleRecommend}
//             className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition"
//           >
//             Recommend for Funding
//           </button>

//         </div>

//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Sparkles } from "lucide-react";

export default function FounderProgress() {
  const navigate = useNavigate();
  const [founders, setFounders] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("myFounders") || "[]"
    );
    setFounders(stored);
    if (stored.length > 0) {
      setSelectedId(String(stored[0].id));
    }
  }, []);

  const founder = founders.find(
    (f) => String(f.id) === String(selectedId)
  );

  if (!founder) {
    return (
      <div className="p-6 text-gray-500">
        No founders available.
      </div>
    );
  }

  /* ========================
     READINESS
  ======================== */

  const readiness =
    Number(founder?.evaluation?.percentage) || 0;

  /* ========================
     DYNAMIC MILESTONES
  ======================== */

  const milestones = {
    product: Math.min(readiness + 5, 100),
    traction: Math.max(readiness - 5, 0),
    revenue: Math.max(readiness - 15, 0),
    branding: Math.min(readiness + 10, 100),
    pitch: Math.min(readiness + 8, 100),
  };

  /* ========================
     GROWTH MOMENTUM
  ======================== */

  const avgMomentum =
    Math.round(
      Object.values(milestones).reduce(
        (a: any, b: any) => a + b,
        0
      ) / Object.values(milestones).length
    ) || 0;

  const strongest =
    Object.entries(milestones).sort(
      (a: any, b: any) => b[1] - a[1]
    )[0][0];

  const weakest =
    Object.entries(milestones).sort(
      (a: any, b: any) => a[1] - b[1]
    )[0][0];

  /* ========================
     PERFORMANCE LOGIC
  ======================== */

  let performanceLabel = "";
  let performanceColor = "";
  let aiMessage = "";

  if (readiness >= 80) {
    performanceLabel = "Strong Investment Signal 🚀";
    performanceColor = "text-green-600";
    aiMessage =
      "This founder is highly funding-ready with strong execution across milestones. Recommended for investor pitch.";
  } else if (readiness >= 65) {
    performanceLabel = "Improving & Scaling 📈";
    performanceColor = "text-yellow-600";
    aiMessage =
      "Founder shows consistent growth. Focus on strengthening revenue and traction before pitching.";
  } else {
    performanceLabel = "Needs Strategic Improvement ⚠";
    performanceColor = "text-red-600";
    aiMessage =
      "Founder requires milestone improvement before funding recommendation. Prioritize traction and revenue.";
  }

  /* ========================
     ACTIONS
  ======================== */

  const handleRecommend = () => {
    const updated = founders.map((f) =>
      String(f.id) === String(selectedId)
        ? { ...f, status: "recommended" }
        : f
    );

    localStorage.setItem(
      "myFounders",
      JSON.stringify(updated)
    );

    alert("Founder Recommended!");
    navigate("/mentor/funding-match");
  };

  const handleImprove = () => {
    navigate(`/mentor/mentor-hub/${selectedId}`);
  };

  /* ========================
     UI
  ======================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <select
            value={selectedId}
            onChange={(e) =>
              setSelectedId(e.target.value)
            }
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            {founders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.founder} – {f.startup}
              </option>
            ))}
          </select>
        </div>

        {/* HERO */}
        <div className="bg-white rounded-3xl p-10 shadow-xl border">
          <h1 className="text-3xl font-bold text-purple-700">
            Founder Performance Overview
          </h1>
          <p className="text-gray-500 mt-2">
            {founder.founder} — {founder.startup}
          </p>
        </div>

        {/* CHART GRID */}
        <div className="grid md:grid-cols-2 gap-10">

          {/* READINESS RING */}
          <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
            <h2 className="text-xl font-semibold mb-6 text-black">
              Readiness Progress
            </h2>

            <div className="relative w-52 h-52 mx-auto">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: `conic-gradient(
                    #7c3aed ${readiness * 3.6}deg,
                    #e5e7eb 0deg
                  )`,
                }}
              ></div>

              <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center shadow-inner">
                <span className="text-3xl font-bold text-purple-600">
                  {readiness}%
                </span>
              </div>
            </div>
          </div>

          {/* BAR GRAPH */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-xl font-semibold mb-6 text-black">
              Milestone Progress
            </h2>

            {Object.entries(milestones).map(
              ([key, value]: any) => (
                <div key={key} className="mb-4">
                  <div className="flex justify-between mb-1 text-black">
                    <span className="capitalize">
                      {key}
                    </span>
                    <span>{value}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* GROWTH INTELLIGENCE PANEL */}
        <div className="bg-white rounded-3xl p-10 shadow-lg space-y-8">

          <h2 className="text-2xl font-semibold flex items-center gap-2 text-black">
            <Sparkles size={20} />
            Growth Intelligence Panel
          </h2>

          <p className={`text-lg font-semibold ${performanceColor}`}>
            {performanceLabel}
          </p>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 text-center">
              <h3 className="text-sm text-gray-500">
                Growth Momentum
              </h3>
              <p className="text-4xl font-bold text-purple-700 mt-2">
                {avgMomentum}%
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-green-50 text-center border border-green-200">
              <h3 className="text-sm text-gray-500">
                Strongest Area
              </h3>
              <p className="text-xl font-semibold text-green-600 mt-2 capitalize">
                {strongest}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-red-50 text-center border border-red-200">
              <h3 className="text-sm text-gray-500">
                Needs Attention
              </h3>
              <p className="text-xl font-semibold text-red-500 mt-2 capitalize">
                {weakest}
              </p>
            </div>

          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6">
            <h3 className="font-semibold mb-2">
              AI Mentor Insight
            </h3>
            <p className="text-sm opacity-90">
              {aiMessage}
            </p>
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-6">

          <button
            onClick={handleImprove}
            className="px-6 py-3 border border-purple-600 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition"
          >
            Improve Strategy
          </button>

          <button
            onClick={handleRecommend}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Recommend for Funding
          </button>

        </div>

      </div>
    </div>
  );
}