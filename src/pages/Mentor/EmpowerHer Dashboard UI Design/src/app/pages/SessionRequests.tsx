// import { useState } from "react";
// import { Calendar, Download, Check, X, Clock } from "lucide-react";
// import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// const requests = [
//   {
//     id: 1,
//     founder: "Emma Chen",
//     photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "EcoBox",
//     industry: "Sustainable Packaging",
//     problem: "Need guidance on scaling our B2B distribution model and securing Series A funding. Looking for mentor expertise in supply chain optimization and investor relations.",
//     requestedDate: "Feb 18, 2026",
//     requestedTime: "2:00 PM - 3:00 PM",
//     pitchDeck: true,
//   },
//   {
//     id: 2,
//     founder: "Priya Sharma",
//     photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "HealthSync",
//     industry: "HealthTech",
//     problem: "Seeking advice on regulatory compliance for healthcare technology platform. Need help navigating FDA approval process and building relationships with hospital systems.",
//     requestedDate: "Feb 19, 2026",
//     requestedTime: "10:00 AM - 11:00 AM",
//     pitchDeck: true,
//   },
//   {
//     id: 3,
//     founder: "Sofia Rodriguez",
//     photo: "https://images.unsplash.com/photo-1758369636875-60b3dcb76366?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "TechBridge Academy",
//     industry: "EdTech",
//     problem: "Looking for mentorship on curriculum development and strategic partnerships with universities. Need support in building go-to-market strategy for B2B education platform.",
//     requestedDate: "Feb 20, 2026",
//     requestedTime: "3:00 PM - 4:00 PM",
//     pitchDeck: true,
//   },
// ];

// export default function SessionRequests() {
//   const [showAcceptModal, setShowAcceptModal] = useState(false);
//   const [showRejectModal, setShowRejectModal] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

//   const handleAccept = (id: number) => {
//     setSelectedRequest(id);
//     setShowAcceptModal(true);
//   };

//   const handleReject = (id: number) => {
//     setSelectedRequest(id);
//     setShowRejectModal(true);
//   };

//   const confirmAccept = () => {
//     alert(`Session request #${selectedRequest} accepted!`);
//     setShowAcceptModal(false);
//     setSelectedRequest(null);
//   };

//   const confirmReject = () => {
//     alert(`Session request #${selectedRequest} rejected.`);
//     setShowRejectModal(false);
//     setSelectedRequest(null);
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Page Title */}
//       <div>
//         <h1 className="text-3xl">Session Requests</h1>
//         <p className="text-gray-500 mt-1">Review and manage incoming mentorship session requests.</p>
//       </div>

//       {/* Requests Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {requests.map((request) => (
//           <div
//             key={request.id}
//             className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
//           >
//             {/* Founder Info */}
//             <div className="flex items-start gap-4 mb-4">
//               <ImageWithFallback
//                 src={request.photo}
//                 alt={request.founder}
//                 className="w-16 h-16 rounded-full object-cover"
//               />
//               <div className="flex-1">
//                 <h3 className="font-medium text-lg">{request.founder}</h3>
//                 <p className="text-purple-600">{request.startup}</p>
//                 <span className="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
//                   {request.industry}
//                 </span>
//               </div>
//             </div>

//             {/* Problem Description */}
//             <div className="mb-4">
//               <h4 className="text-sm font-medium text-gray-700 mb-2">Session Focus:</h4>
//               <p className="text-sm text-gray-600 leading-relaxed">{request.problem}</p>
//             </div>

//             {/* Requested Time */}
//             <div className="flex items-center gap-2 mb-4 p-3 bg-purple-50 rounded-lg">
//               <Calendar size={18} className="text-purple-600" />
//               <div>
//                 <p className="text-sm font-medium text-gray-700">{request.requestedDate}</p>
//                 <p className="text-xs text-gray-600">{request.requestedTime}</p>
//               </div>
//             </div>

//             {/* Actions */}
//             <div className="flex flex-wrap gap-2">
//               <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
//                 <Download size={16} />
//                 Download Pitch Deck
//               </button>
//               <button
//                 onClick={() => handleAccept(request.id)}
//                 className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm hover:from-purple-700 hover:to-pink-700 transition-colors"
//               >
//                 <Check size={16} />
//                 Accept
//               </button>
//               <button
//                 onClick={() => handleReject(request.id)}
//                 className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
//               >
//                 <X size={16} />
//                 Reject
//               </button>
//               <button className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg text-sm hover:bg-purple-50 transition-colors">
//                 <Clock size={16} />
//                 Suggest Alternate Time
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Accept Modal */}
//       {showAcceptModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
//             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
//               <Check className="text-green-600" size={24} />
//             </div>
//             <h2 className="text-2xl mb-2">Accept Session Request</h2>
//             <p className="text-gray-600 mb-6">
//               Are you sure you want to accept this session request? A confirmation will be sent to the
//               founder.
//             </p>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowAcceptModal(false)}
//                 className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmAccept}
//                 className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
//               >
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Reject Modal */}
//       {showRejectModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
//             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
//               <X className="text-red-600" size={24} />
//             </div>
//             <h2 className="text-2xl mb-2">Reject Session Request</h2>
//             <p className="text-gray-600 mb-4">
//               Please provide a brief reason for declining this session request:
//             </p>
//             <textarea
//               className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
//               rows={4}
//               placeholder="Optional: Share why you're unable to accept this session..."
//             ></textarea>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowRejectModal(false)}
//                 className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmReject}
//                 className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//               >
//                 Confirm Rejection
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// import { useState, useEffect } from "react";
// import { Calendar, Download, Check, X, Clock } from "lucide-react";
// import { ImageWithFallback } from "../components/figma/ImageWithFallback";
// import { useNavigate } from "react-router-dom";

// const initialRequests = [
//   {
//     id: 1,
//     founder: "Emma Chen",
//     photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "EcoBox",
//     industry: "Sustainable Packaging",
//     problem:
//       "Need guidance on scaling B2B distribution & securing Series A funding.",
//     requestedDate: "Feb 18, 2026",
//     requestedTime: "2:00 PM - 3:00 PM",
//   },
//   {
//     id: 2,
//     founder: "Priya Sharma",
//     photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "HealthSync",
//     industry: "HealthTech",
//     problem: "Seeking advice on regulatory compliance & hospital partnerships.",
//     requestedDate: "Feb 19, 2026",
//     requestedTime: "10:00 AM - 11:00 AM",
//   },
  // {
  //   id: 3,
  //   founder: "Sofia Rodriguez",
  //   photo: "https://images.unsplash.com/photo-1758369636875-60b3dcb76366?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  //   startup: "TechBridge Academy",
  //   industry: "EdTech",
  //   problem: "Looking for mentorship on curriculum development.",
  //   requestedDate: "Feb 20, 2026",
  //   requestedTime: "3:00 PM - 4:00 PM",
  // },
  // {
  //   id: 4,
  //   founder: "Lisa Anderson",
  //   photo: "https://images.unsplash.com/photo-1754298949882-216a1c92dbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  //   startup: "FoodChain",
  //   industry: "AgriTech",
  //   problem: "Need help scaling supply chain operations.",
  //   requestedDate: "Feb 21, 2026",
  //   requestedTime: "11:00 AM - 12:00 PM",
  // },
  // {
  //   id: 5,
  //   founder: "Maya Johnson",
  //   photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  //   startup: "CleanEnergy Solutions",
  //   industry: "CleanTech",
  //   problem: "Investor pitch deck optimization guidance.",
  //   requestedDate: "Feb 22, 2026",
  //   requestedTime: "1:00 PM - 2:00 PM",
  // },
  // {
  //   id: 6,
  //   founder: "Aisha Patel",
  //   photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  //   startup: "FinanceFirst",
  //   industry: "FinTech",
  //   problem: "User acquisition strategy & scaling.",
  //   requestedDate: "Feb 23, 2026",
  //   requestedTime: "4:00 PM - 5:00 PM",
  // },
// ];

// export default function SessionRequests() {
//   const [requests, setRequests] = useState(initialRequests);
//   const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
//   const [showAcceptModal, setShowAcceptModal] = useState(false);
//   const [showRejectModal, setShowRejectModal] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const accepted = JSON.parse(localStorage.getItem("myFounders") || "[]");
//     const remaining = initialRequests.filter(
//       (req) => !accepted.some((f: any) => f.id === req.id)
//     );
//     setRequests(remaining);
//   }, []);

//   const confirmAccept = () => {
//     if (!selectedRequest) return;

//     const acceptedFounder = requests.find(
//       (req) => req.id === selectedRequest
//     );

//     if (acceptedFounder) {
//       const existing =
//         JSON.parse(localStorage.getItem("myFounders") || "[]");

//       localStorage.setItem(
//         "myFounders",
//         JSON.stringify([...existing, acceptedFounder])
//       );

//       setRequests((prev) =>
//         prev.filter((req) => req.id !== selectedRequest)
//       );
//     }

//     setShowAcceptModal(false);
//     setSelectedRequest(null);
//   };

//   const confirmReject = () => {
//     if (!selectedRequest) return;

//     setRequests((prev) =>
//       prev.filter((req) => req.id !== selectedRequest)
//     );

//     setShowRejectModal(false);
//     setSelectedRequest(null);
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-3xl">Session Requests</h1>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {requests.map((request) => (
//           <div
//             key={request.id}
//             className="bg-white rounded-2xl p-6 shadow-sm border"
//           >
//             <div className="flex items-start gap-4 mb-4">
//               <ImageWithFallback
//                 src={request.photo}
//                 alt={request.founder}
//                 className="w-16 h-16 rounded-full object-cover"
//               />
//               <div>
//                 <h3 className="text-lg font-medium">
//                   {request.founder}
//                 </h3>
//                 <p className="text-purple-600">
//                   {request.startup}
//                 </p>
//               </div>
//             </div>

//             <p className="text-sm text-gray-600 mb-4">
//               {request.problem}
//             </p>

//             <div className="flex gap-2 flex-wrap">
//               <button
//                 onClick={() =>
//                   navigate(`/my-founders/${request.id}`)
//                 }
//                 className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg text-sm"
//               >
//                 View Details
//               </button>

//               <button
//                 onClick={() => {
//                   setSelectedRequest(request.id);
//                   setShowAcceptModal(true);
//                 }}
//                 className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
//               >
//                 Accept
//               </button>

//               <button
//                 onClick={() => {
//                   setSelectedRequest(request.id);
//                   setShowRejectModal(true);
//                 }}
//                 className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm"
//               >
//                 Reject
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {showAcceptModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-xl">
//             <h2 className="text-xl mb-4">
//               Confirm Accept?
//             </h2>
//             <button
//               onClick={confirmAccept}
//               className="bg-purple-600 text-white px-4 py-2 rounded-lg mr-3"
//             >
//               Confirm
//             </button>
//             <button
//               onClick={() => setShowAcceptModal(false)}
//               className="border px-4 py-2 rounded-lg"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}

//       {showRejectModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-xl">
//             <h2 className="text-xl mb-4">
//               Confirm Reject?
//             </h2>
//             <button
//               onClick={confirmReject}
//               className="bg-red-600 text-white px-4 py-2 rounded-lg mr-3"
//             >
//               Confirm
//             </button>
//             <button
//               onClick={() => setShowRejectModal(false)}
//               className="border px-4 py-2 rounded-lg"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useNavigate } from "react-router-dom";

// const initialRequests = [
//   {
//     id: 1,
//     founder: "Emma Chen",
//     photo:
//       "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "EcoBox",
//     industry: "Sustainable Packaging",
//     problem:
//       "Need guidance on scaling B2B distribution & securing Series A funding.",
//     requestedDate: "Feb 18, 2026",
//     requestedTime: "2:00 PM - 3:00 PM",
//   },
//   {
//     id: 2,
//     founder: "Priya Sharma",
//     photo:
//       "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "HealthSync",
//     industry: "HealthTech",
//     problem:
//       "Seeking advice on regulatory compliance & hospital partnerships.",
//     requestedDate: "Feb 19, 2026",
//     requestedTime: "10:00 AM - 11:00 AM",
//   },
//   {
//     id: 3,
//     founder: "Sofia Rodriguez",
//     photo: "https://images.unsplash.com/photo-1758369636875-60b3dcb76366?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "TechBridge Academy",
//     industry: "EdTech",
//     problem: "Looking for mentorship on curriculum development.",
//     requestedDate: "Feb 20, 2026",
//     requestedTime: "3:00 PM - 4:00 PM",
//   },
//   {
//     id: 4,
//     founder: "Lisa Anderson",
//     photo: "https://images.unsplash.com/photo-1754298949882-216a1c92dbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "FoodChain",
//     industry: "AgriTech",
//     problem: "Need help scaling supply chain operations.",
//     requestedDate: "Feb 21, 2026",
//     requestedTime: "11:00 AM - 12:00 PM",
//   },
//   {
//     id: 5,
//     founder: "Maya Johnson",
//     photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "CleanEnergy Solutions",
//     industry: "CleanTech",
//     problem: "Investor pitch deck optimization guidance.",
//     requestedDate: "Feb 22, 2026",
//     requestedTime: "1:00 PM - 2:00 PM",
//   },
//   {
//     id: 6,
//     founder: "Aisha Patel",
//     photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "FinanceFirst",
//     industry: "FinTech",
//     problem: "User acquisition strategy & scaling.",
//     requestedDate: "Feb 23, 2026",
//     requestedTime: "4:00 PM - 5:00 PM",
//   },
// ];

const initialRequests = [
  {
    id: 1,
    founder: "Sanjana Kotian",
    photo: "src/assets/profpic.jpg",
    startup: "Emcure",
    industry: "HealthTech",
    problem:
      "Seeking mentorship on scaling digital healthcare infrastructure and expanding partnerships with hospitals.",
    requestedDate: "Feb 18, 2026",
    requestedTime: "2:00 PM - 3:00 PM",
  },
  {
    id: 2,
    founder: "Priya Sharma",
    photo:
      "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "HealthSync",
    industry: "HealthTech",
    problem:
      "Seeking advice on regulatory compliance & hospital partnerships.",
    requestedDate: "Feb 19, 2026",
    requestedTime: "10:00 AM - 11:00 AM",
  },
  {
    id: 3,
    founder: "Hemangi Purkar",
    photo:
      "src/assets/hp.jpeg",
    startup: "TechBridge Academy",
    industry: "EdTech",
    problem:
      "Looking for mentorship on scaling tech education programs and improving curriculum delivery.",
    requestedDate: "Feb 20, 2026",
    requestedTime: "3:00 PM - 4:00 PM",
  },
  {
    id: 4,
    founder: "Swapnali Kadam",
    photo:
      "src/assets/sw.png",
    startup: "FoodChain",
    industry: "AgriTech",
    problem:
      "Need help optimizing food supply chain logistics and scaling operations.",
    requestedDate: "Feb 21, 2026",
    requestedTime: "11:00 AM - 12:00 PM",
  },
  {
    id: 5,
    founder: "Emma Chen",
    photo:
      "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "EcoBox",
    industry: "Sustainable Packaging",
    problem:
      "Need guidance on scaling B2B distribution & securing Series A funding.",
    requestedDate: "Feb 22, 2026",
    requestedTime: "1:00 PM - 2:00 PM",
  },
];

export default function SessionRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"accept" | "reject" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accepted = JSON.parse(localStorage.getItem("myFounders") || "[]");
    const remaining = initialRequests.filter(
      (req) => !accepted.some((f: any) => f.id === req.id)
    );
    setRequests(remaining);
  }, []);

  const confirmAction = () => {
    if (!selectedRequest || !modalType) return;

    if (modalType === "accept") {
      const acceptedFounder = requests.find(
        (req) => req.id === selectedRequest
      );

      if (acceptedFounder) {
        const existing =
          JSON.parse(localStorage.getItem("myFounders") || "[]");

        localStorage.setItem(
          "myFounders",
          JSON.stringify([...existing, acceptedFounder])
        );

        setRequests((prev) =>
          prev.filter((req) => req.id !== selectedRequest)
        );
      }
    }

    if (modalType === "reject") {
      setRequests((prev) =>
        prev.filter((req) => req.id !== selectedRequest)
      );
    }

    setModalType(null);
    setSelectedRequest(null);
  };

  return (
    <div className="p-6 space-y-6 relative">
      <h1 className="text-3xl font-semibold text-black">Session Requests</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition"
          >
            <div className="flex items-start gap-4 mb-4">
              <ImageWithFallback
                src={request.photo}
                alt={request.founder}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-medium text-black">
                  {request.founder}
                </h3>
                <p className="text-purple-600 text-sm">
                  {request.startup}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {request.problem}
            </p>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() =>
                  navigate(`/mentor/my-founders/${request.id}`)
                }
                className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg text-sm hover:bg-purple-50 transition"
              >
                View Details
              </button>

              <button
                onClick={() => {
                  setSelectedRequest(request.id);
                  setModalType("accept");
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
              >
                Accept
              </button>

              <button
                onClick={() => {
                  setSelectedRequest(request.id);
                  setModalType("reject");
                }}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Small Confirmation Modal */}
      {modalType && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white shadow-xl rounded-xl p-6 w-80 border pointer-events-auto animate-fade-in">
            <h2 className="text-lg font-semibold mb-2">
              {modalType === "accept"
                ? "Accept this session?"
                : "Reject this session?"}
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              {modalType === "accept"
                ? "The founder will move to My Founders."
                : "This request will be removed."}
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 text-sm border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={confirmAction}
                className={`px-3 py-1.5 text-sm text-white rounded-lg ${
                  modalType === "accept"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-red-600 hover:bg-red-700"
                } transition`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}