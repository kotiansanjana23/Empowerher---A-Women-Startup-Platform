
// import { useState } from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

type DealStatus =
  | "Not Contacted"
  | "Recommended"
  | "Pitch Sent"
  | "Funded";

type Investor = {
  id: number;
  name: string;
  logo: string;
  banner: string;
  industry: string;
  category: string;
  location: string;
  founded: string;
  followers: number;
  size: string;
  headquarters: string;
  website: string;
  email: string;
  specialties: string[];
  overview: string;
  status: DealStatus;
};

export default function FundingMatch() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [founders, setFounders] = useState<any[]>([]);
  useEffect(() => {
  const stored = JSON.parse(localStorage.getItem("myFounders") || "[]");

  const recommended = stored.filter(
    (f: any) => f.status === "recommended"
  );

  setFounders(recommended);
}, []);

  // const founders = [
  //   "Priya Sharma – FinFlow",
  //   "Anita Desai – HealthHub",
  //   "Emma Chen – EcoBox",
  // ];

  const [investors, setInvestors] = useState<Investor[]>([
    {
      id: 1,
      name: "MindShift Capital",
      logo: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=200",
      banner:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200",
      industry: "Venture Capital",
      category: "FinTech Investment Firm",
      location: "San Francisco, USA",
      founded: "2014",
      followers: 12450,
      size: "51–200 employees",
      headquarters: "San Francisco, CA",
      website: "https://mindshiftcapital.com",
      email: "contact@mindshiftcapital.com",
      specialties: ["AI", "SaaS", "Climate Tech"],
      overview:
        "MindShift Capital invests in high-growth AI and SaaS startups, helping founders scale globally.",
      status: "Not Contacted",
    },
    {
      id: 2,
      name: "Astia Angels",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
      banner:
        "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
      industry: "Angel Network",
      category: "Women-Led Startup Network",
      location: "New York, USA",
      founded: "2012",
      followers: 18700,
      size: "1000+ Members",
      headquarters: "New York, NY",
      website: "https://astia.org",
      email: "info@astia.org",
      specialties: ["Women-led", "FinTech", "HealthTech"],
      overview:
        "Astia Angels backs women-led ventures with global angel support and strategic mentorship.",
      status: "Not Contacted",
    },
    {
      id: 3,
      name: "FutureScale Ventures",
      logo: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200",
      banner:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
      industry: "Private Equity",
      category: "Enterprise SaaS Growth Fund",
      location: "London, UK",
      founded: "2010",
      followers: 9800,
      size: "200–500 employees",
      headquarters: "London, UK",
      website: "https://futurescale.vc",
      email: "hello@futurescale.vc",
      specialties: ["Enterprise SaaS", "Cloud", "AI"],
      overview:
        "FutureScale Ventures partners with enterprise SaaS founders to scale internationally.",
      status: "Not Contacted",
    },
    {
      id: 4,
      name: "GreenEdge Impact Fund",
      logo: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=200",
      banner:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
      industry: "Impact Investing",
      category: "Climate Impact Fund",
      location: "Berlin, Germany",
      founded: "2016",
      followers: 7600,
      size: "25–50 employees",
      headquarters: "Berlin, Germany",
      website: "https://greenedgeimpact.com",
      email: "team@greenedgeimpact.com",
      specialties: ["Climate", "Sustainability"],
      overview:
        "GreenEdge invests in climate startups focused on measurable environmental impact.",
      status: "Not Contacted",
    },
    {
      id: 5,
      name: "ElevateHer Capital",
      logo: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200",
      banner:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200",
      industry: "Venture Capital",
      category: "Women Entrepreneur Fund",
      location: "Toronto, Canada",
      founded: "2018",
      followers: 15400,
      size: "10–50 employees",
      headquarters: "Toronto, Canada",
      website: "https://elevatehercapital.com",
      email: "connect@elevatehercapital.com",
      specialties: ["Women-led", "EdTech", "SaaS"],
      overview:
        "ElevateHer Capital funds and mentors early-stage women entrepreneurs building scalable digital products.",
      status: "Not Contacted",
    },
  ]);

  const [selectedFounder, setSelectedFounder] = useState("");
  const [mentorReview, setMentorReview] = useState("");
  const [savedReview, setSavedReview] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingMsg, setMeetingMsg] = useState("");
  const [pitchMsg, setPitchMsg] = useState("");
const [reviewMsg, setReviewMsg] = useState("");

  const updateStatus = (id: number, newStatus: DealStatus) => {
    setInvestors((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: newStatus } : inv
      )
    );
  };

  const countByStatus = (status: DealStatus) =>
    investors.filter((i) => i.status === status).length;

  // ================= PROFILE =================
  if (id) {
    const investor = investors.find((i) => i.id === Number(id));
    if (!investor) return <div className="p-10">Not Found</div>;

    return (
      <div className="p-6 space-y-8 text-black">
        <button
          onClick={() => navigate("/mentor/funding-match")}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-600 transition"
        >
          ← Back to Funding Match
        </button>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div
            className="h-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${investor.banner})` }}
          />
          <div className="p-6 -mt-10">
            <img
              src={investor.logo}
              className="w-20 h-20 rounded-full border-4 border-white object-cover"
            />
            <h1 className="text-3xl font-semibold mt-3 text-black">
              {investor.name}
            </h1>
            <p className="text-gray-500">
              {investor.industry} • {investor.location}
            </p>
            <p className="text-sm text-gray-500">
              {investor.followers.toLocaleString()} followers
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-lg mb-2 text-black">Overview</h2>
              <p className="text-gray-600">{investor.overview}</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 space-y-2">
              <p><strong>Industry:</strong> {investor.industry}</p>
              <p><strong>Company Size:</strong> {investor.size}</p>
              <p><strong>Headquarters:</strong> {investor.headquarters}</p>
              <p><strong>Category:</strong> {investor.category}</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-lg mb-3 text-black">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {investor.specialties.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow p-6 space-y-4">
              <h2 className="font-semibold text-lg text-black">Mentor Actions</h2>

              <button
                onClick={() => updateStatus(investor.id, "Recommended")}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Recommend Founder
              </button>

              {investor.status === "Recommended" && (
                <>
                  <select
  value={selectedFounder}
  onChange={(e) => setSelectedFounder(e.target.value)}
  className="w-full border p-2 rounded"
>
  <option value="">Select Founder</option>

  {founders.map((f) => (
    <option key={f.id} value={`${f.founder} – ${f.startup}`}>
      {f.founder} – {f.startup}
    </option>
  ))}

</select>

                  <button
                    // onClick={() => {
                    //   if (selectedFounder) {
                    //     updateStatus(investor.id, "Pitch Sent");
                    //     alert("Pitch submitted successfully");
                    //   }
                    // }}
                    onClick={() => {
  if (selectedFounder) {
    updateStatus(investor.id, "Pitch Sent");
    alert("Pitch submitted successfully");
  }
}}

                 
  className="w-full bg-purple-700 text-white py-2 rounded-lg"
>
  Send Pitch
</button>
  
                </>
              )}

              <textarea
                placeholder="Write mentor review..."
                value={mentorReview}
                onChange={(e) => setMentorReview(e.target.value)}
                className="w-full border border-gray-300 bg-white text-black p-2 rounded"
              />

              <button
                // onClick={() => {
                //   setSavedReview(mentorReview);
                //   alert("Review submitted successfully");
                // }}
                onClick={() => {
  if (mentorReview.trim() !== "") {
    setSavedReview(mentorReview);
    setReviewMsg("Review submitted successfully");
  }
}}
                className="w-full bg-gray-800 text-white py-2 rounded-lg"
              >
                Save Review
              </button>
              {reviewMsg && (
  <p className="text-sm text-green-600">
    {reviewMsg}
  </p>
)}

              <div className="space-y-2">
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-black p-2 rounded"
                />
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-black p-2 rounded"
                />
                <button
                  onClick={() => {
                    if (meetingDate && meetingTime) {
                      setMeetingMsg(
                        `Meeting scheduled for ${meetingDate} at ${meetingTime}`
                      );
                    }
                  }}
                  className="w-full bg-purple-800 text-white py-2 rounded-lg"
                >
                  Confirm Meeting
                </button>
              </div>

              {meetingMsg && (
                <p className="text-sm text-green-600">
                  {meetingMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-semibold text-black">Funding Match</h1>

      <div className="grid grid-cols-3 gap-6 text-black">
        {(["Recommended", "Pitch Sent", "Funded"] as DealStatus[]).map(
          (status) => (
            <div
              key={status}
              className="bg-white rounded-2xl shadow p-6 text-center
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:border hover:border-purple-400"
            >
              <p className="text-gray-500">{status}</p>
              <p className="text-2xl font-semibold text-black">
                {countByStatus(status)}
              </p>
            </div>
          )
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {investors.map((inv) => (
          <div
            key={inv.id}
            className="group bg-white rounded-2xl shadow-md p-6 
            transition-all duration-300 
            hover:-translate-y-2 hover:shadow-2xl 
            hover:border hover:border-purple-300"
          >
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <img
                  src={inv.logo}
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div>
                  <h3 className="font-semibold text-lg text-black group-hover:text-purple-700 transition">
                    {inv.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {inv.industry} • {inv.location}
                  </p>
                  <p className="text-sm text-gray-600">
                    {inv.category}
                  </p>
                  <p className="text-sm text-gray-400">
                    {inv.followers.toLocaleString()} followers
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(`/mentor/funding-match/${inv.id}`)
                }
                className="w-full px-4 py-2 text-sm border border-purple-600 text-purple-600 rounded-lg transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white"
              >
                View Page
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}