// import { useParams, useNavigate } from "react-router-dom";
// import { ArrowLeft, FileText, Play } from "lucide-react";
// import { ReactNode } from "react";
// import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// /* ============================
//    TYPE DEFINITIONS
// ============================ */

// type Competition = {
//   name: string;
//   strength: string;
//   weakness: string;
// };

// type FounderData = {
//   id: string | undefined;
//   name: string;
//   photo: string;
//   startup: string;
//   industry: string;
//   stage: string;
//   location: string;
//   founderType: string;
//   elevatorPitch: string;
//   problem: string;
//   solution: string;
//   market: {
//     tam: string;
//     target: string;
//     growth: string;
//   };
//   businessModel: {
//     revenueModel: string;
//     avgOrderValue: string;
//     grossMargin: string;
//   };
//   traction: {
//     mrr: string;
//     growth: string;
//     customers: string;
//     retention: string;
//     runway: string;
//   };
//   competition: Competition[];
//   team: {
//     size: number;
//     keyRoles: string[];
//     missing: string[];
//   };
//   productStatus: string;
//   fundingAsk: {
//     raising: string;
//     useOfFunds: string;
//   };
//   risks: string[];
//   impact: {
//     plasticReduced: string;
//     carbonSaved: string;
//   };
//   readiness: {
//     product: number;
//     market: number;
//     financial: number;
//     compliance: number;
//     total: number;
//   };
// };

// /* ============================
//    COMPONENT
// ============================ */

// export default function FounderDetail() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const founder: FounderData = {
//     id,
//     name: "Emma Chen",
//     photo:
//       "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "EcoBox",
//     industry: "Sustainable Packaging",
//     stage: "Seed Round",
//     location: "San Francisco, CA",
//     founderType: "Second-Time Founder",

//     elevatorPitch:
//       "EcoBox replaces plastic e-commerce packaging with biodegradable alternatives that decompose within 90 days at 20% lower cost.",

//     problem:
//       "E-commerce packaging contributes to over 40% of plastic waste globally.",

//     solution:
//       "EcoBox provides biodegradable packaging that decomposes within 90 days while maintaining durability and cost efficiency.",

//     market: {
//       tam: "$120B Global Packaging Market",
//       target: "Mid-size e-commerce brands",
//       growth: "12% YoY industry growth",
//     },

//     businessModel: {
//       revenueModel: "B2B Bulk Orders + Subscription Contracts",
//       avgOrderValue: "$2,400",
//       grossMargin: "62%",
//     },

//     traction: {
//       mrr: "$42,000",
//       growth: "+18% MoM",
//       customers: "120 Paying Clients",
//       retention: "87%",
//       runway: "14 Months",
//     },

//     competition: [
//       {
//         name: "EcoPack Inc",
//         strength: "Premium branding",
//         weakness: "High cost",
//       },
//       {
//         name: "GreenWrap",
//         strength: "Large distribution",
//         weakness: "Slow decomposition",
//       },
//     ],

//     team: {
//       size: 12,
//       keyRoles: ["Founder & CEO", "CTO", "Operations Head"],
//       missing: ["Growth Marketing Lead"],
//     },

//     productStatus: "Live Product - Version 2.1",

//     fundingAsk: {
//       raising: "$750K for 10% equity",
//       useOfFunds: "Manufacturing scale-up, marketing, and hiring.",
//     },

//     risks: [
//       "Manufacturing dependency on single supplier",
//       "Scaling logistics complexity",
//     ],

//     impact: {
//       plasticReduced: "18 Tons",
//       carbonSaved: "32% reduction vs traditional packaging",
//     },

//     readiness: {
//       product: 8,
//       market: 7,
//       financial: 6,
//       compliance: 9,
//       total: 82,
//     },
//   };

//   return (
//     <div className="p-6 max-w-6xl mx-auto space-y-8">

//       {/* Back */}
//       <button
//         onClick={() => navigate("/my-founders")}
//         className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
//       >
//         <ArrowLeft size={18} />
//         Back
//       </button>

//       {/* HEADER */}
//       <div className="bg-white rounded-2xl p-6 shadow-sm border flex justify-between">
//         <div className="flex gap-6">
//           <ImageWithFallback
//             src={founder.photo}
//             alt={founder.name}
//             className="w-24 h-24 rounded-full object-cover"
//           />
//           <div>
//             <h1 className="text-3xl font-semibold">{founder.name}</h1>
//             <p className="text-purple-600 text-lg">{founder.startup}</p>
//             <p className="text-sm text-gray-600 mt-1">
//               {founder.industry} • {founder.stage} • {founder.location}
//             </p>
//             <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
//               {founder.founderType}
//             </span>
//           </div>
//         </div>

//         <div className="flex gap-3">
          
//         </div>
//       </div>

//       <Section title="Elevator Pitch">
//         {founder.elevatorPitch}
//       </Section>

//       <Section title="Problem & Solution">
//         <p><strong>Problem:</strong> {founder.problem}</p>
//         <p className="mt-2"><strong>Solution:</strong> {founder.solution}</p>
//       </Section>

//       <Section title="Market Opportunity">
//         <p><strong>TAM:</strong> {founder.market.tam}</p>
//         <p><strong>Target:</strong> {founder.market.target}</p>
//         <p><strong>Growth:</strong> {founder.market.growth}</p>
//       </Section>

//       <Section title="Business Model">
//         <p><strong>Revenue Model:</strong> {founder.businessModel.revenueModel}</p>
//         <p><strong>Avg Order Value:</strong> {founder.businessModel.avgOrderValue}</p>
//         <p><strong>Gross Margin:</strong> {founder.businessModel.grossMargin}</p>
//       </Section>

//       <Section title="Traction & Metrics">
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//           <Metric label="MRR" value={founder.traction.mrr} />
//           <Metric label="Growth" value={founder.traction.growth} />
//           <Metric label="Customers" value={founder.traction.customers} />
//           <Metric label="Retention" value={founder.traction.retention} />
//           <Metric label="Runway" value={founder.traction.runway} />
//         </div>
//       </Section>

//       <Section title="Competitive Landscape">
//         {founder.competition.map((comp, index) => (
//           <div key={index} className="mb-3">
//             <p className="font-semibold">{comp.name}</p>
//             <p>Strength: {comp.strength}</p>
//             <p>Weakness: {comp.weakness}</p>
//           </div>
//         ))}
//       </Section>

//       <Section title="Team">
//         <p><strong>Team Size:</strong> {founder.team.size}</p>
//         <p><strong>Key Roles:</strong> {founder.team.keyRoles.join(", ")}</p>
//         <p><strong>Missing Roles:</strong> {founder.team.missing.join(", ")}</p>
//       </Section>

//       <Section title="Funding Ask">
//         <p><strong>Raising:</strong> {founder.fundingAsk.raising}</p>
//         <p><strong>Use of Funds:</strong> {founder.fundingAsk.useOfFunds}</p>
//       </Section>

//       <Section title="Risk Factors">
//         <ul className="list-disc list-inside">
//           {founder.risks.map((risk, i) => (
//             <li key={i}>{risk}</li>
//           ))}
//         </ul>
//       </Section>

//       <Section title="Impact Metrics">
//         <p><strong>Plastic Reduced:</strong> {founder.impact.plasticReduced}</p>
//         <p><strong>Carbon Saved:</strong> {founder.impact.carbonSaved}</p>
//       </Section>

//       <Section title="Readiness Score">
//         <p>Total Score: <strong>{founder.readiness.total}/100</strong></p>
//         <p>Product: {founder.readiness.product}/10</p>
//         <p>Market: {founder.readiness.market}/10</p>
//         <p>Financial: {founder.readiness.financial}/10</p>
//         <p>Compliance: {founder.readiness.compliance}/10</p>
//       </Section>

//       <Section title="Pitch Materials">
//         <div className="flex gap-4 text-purple-600">
//           <button className="flex items-center gap-2">
//             <FileText size={16} /> Pitch Deck
//           </button>
//           <button className="flex items-center gap-2">
//             <Play size={16} /> Demo Video
//           </button>
//         </div>
//       </Section>

//     </div>
//   );
// }

// /* ============================
//    REUSABLE COMPONENTS
// ============================ */

// type SectionProps = {
//   title: string;
//   children: ReactNode;
// };

// function Section({ title, children }: SectionProps) {
//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-sm border">
//       <h2 className="text-xl font-semibold mb-4">{title}</h2>
//       <div className="text-sm text-gray-700">{children}</div>
//     </div>
//   );
// }

// type MetricProps = {
//   label: string;
//   value: string;
// };

// function Metric({ label, value }: MetricProps) {
//   return (
//     <div>
//       <p className="text-gray-500 text-xs">{label}</p>
//       <p className="font-semibold">{value}</p>
//     </div>
//   );
// }


// import { useParams, useNavigate } from "react-router-dom";
// import { ArrowLeft, FileText, Play } from "lucide-react";
// import { ReactNode } from "react";
// import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// /* ============================
//    FULL FOUNDERS DATA
// ============================ */

// const foundersData = [
//   {
//     id: "1",
//     name: "Emma Chen",
//     photo:
//       "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "EcoBox",
//     industry: "Sustainable Packaging",
//     stage: "Seed Round",
//     location: "San Francisco, CA",
//     founderType: "Second-Time Founder",
//     elevatorPitch:
//       "EcoBox replaces plastic e-commerce packaging with biodegradable alternatives.",
//     problem:
//       "E-commerce packaging contributes to over 40% of plastic waste globally.",
//     solution:
//       "Biodegradable packaging that decomposes within 90 days.",
//     market: {
//       tam: "$120B Global Packaging Market",
//       target: "Mid-size e-commerce brands",
//       growth: "12% YoY industry growth",
//     },
//     businessModel: {
//       revenueModel: "B2B Bulk Orders",
//       avgOrderValue: "$2,400",
//       grossMargin: "62%",
//     },
//     traction: {
//       mrr: "$42,000",
//       growth: "+18% MoM",
//       customers: "120 Clients",
//       retention: "87%",
//       runway: "14 Months",
//     },
//     competition: [
//       { name: "EcoPack", strength: "Premium branding", weakness: "High cost" },
//       { name: "GreenWrap", strength: "Distribution", weakness: "Slow decomposition" },
//     ],
//     team: {
//       size: 12,
//       keyRoles: ["CEO", "CTO"],
//       missing: ["Marketing Head"],
//     },
//     productStatus: "Live Product",
//     fundingAsk: {
//       raising: "$750K",
//       useOfFunds: "Manufacturing & marketing",
//     },
//     risks: ["Supplier dependency", "Logistics complexity"],
//     impact: {
//       plasticReduced: "18 Tons",
//       carbonSaved: "32% reduction",
//     },
//     readiness: {
//       product: 8,
//       market: 7,
//       financial: 6,
//       compliance: 9,
//       total: 82,
//     },
//   },

//   {
//     id: "2",
//     name: "Priya Sharma",
//     photo:
//       "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     startup: "HealthSync",
//     industry: "HealthTech",
//     stage: "Pre-Seed",
//     location: "Bangalore, India",
//     founderType: "First-Time Founder",
//     elevatorPitch:
//       "AI-powered patient monitoring platform for hospitals.",
//     problem:
//       "Hospitals struggle with real-time patient monitoring inefficiencies.",
//     solution:
//       "AI-based system to track and predict patient deterioration.",
//     market: {
//       tam: "$80B Healthcare Tech Market",
//       target: "Private Hospitals",
//       growth: "15% annual growth",
//     },
//     businessModel: {
//       revenueModel: "SaaS subscription",
//       avgOrderValue: "$1,800",
//       grossMargin: "70%",
//     },
//     traction: {
//       mrr: "$25,000",
//       growth: "+22% MoM",
//       customers: "40 Hospitals",
//       retention: "90%",
//       runway: "12 Months",
//     },
//     competition: [
//       { name: "MediTrack", strength: "Strong brand", weakness: "Expensive" },
//       { name: "CareAI", strength: "Fast deployment", weakness: "Limited features" },
//     ],
//     team: {
//       size: 8,
//       keyRoles: ["CEO", "CTO", "Medical Advisor"],
//       missing: ["Sales Lead"],
//     },
//     productStatus: "Beta Launch",
//     fundingAsk: {
//       raising: "$500K",
//       useOfFunds: "Product & sales expansion",
//     },
//     risks: ["Regulatory approvals", "Hospital adoption cycles"],
//     impact: {
//       plasticReduced: "N/A",
//       carbonSaved: "N/A",
//     },
//     readiness: {
//       product: 7,
//       market: 8,
//       financial: 6,
//       compliance: 8,
//       total: 78,
//     },
//   },

//   // You can continue similarly for Sofia, Lisa, Maya, Aisha
// ];

// /* ============================
//    COMPONENT
// ============================ */

// export default function FounderDetail() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const founder = foundersData.find((f) => f.id === id);

//   if (!founder) {
//     return <div className="p-6">Founder not found</div>;
//   }

//   return (
//     <div className="p-6 max-w-6xl mx-auto space-y-8">

//       <button
//         onClick={() => navigate(-1)}
//         className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
//       >
//         <ArrowLeft size={18} />
//         Back
//       </button>

//       <div className="bg-white rounded-2xl p-6 shadow-sm border flex gap-6">
//         <ImageWithFallback
//           src={founder.photo}
//           alt={founder.name}
//           className="w-24 h-24 rounded-full object-cover"
//         />
//         <div>
//           <h1 className="text-3xl font-semibold">{founder.name}</h1>
//           <p className="text-purple-600 text-lg">{founder.startup}</p>
//           <p className="text-sm text-gray-600 mt-1">
//             {founder.industry} • {founder.stage} • {founder.location}
//           </p>
//         </div>
//       </div>

//       <Section title="Elevator Pitch">{founder.elevatorPitch}</Section>

//       <Section title="Problem & Solution">
//         <p><strong>Problem:</strong> {founder.problem}</p>
//         <p className="mt-2"><strong>Solution:</strong> {founder.solution}</p>
//       </Section>

//       <Section title="Market Opportunity">
//         <p><strong>TAM:</strong> {founder.market.tam}</p>
//         <p><strong>Target:</strong> {founder.market.target}</p>
//         <p><strong>Growth:</strong> {founder.market.growth}</p>
//       </Section>

//       <Section title="Business Model">
//         <p><strong>Revenue Model:</strong> {founder.businessModel.revenueModel}</p>
//         <p><strong>Avg Order Value:</strong> {founder.businessModel.avgOrderValue}</p>
//         <p><strong>Gross Margin:</strong> {founder.businessModel.grossMargin}</p>
//       </Section>

//     </div>
//   );
// }

// /* ============================
//    REUSABLE COMPONENT
// ============================ */

// function Section({ title, children }: { title: string; children: ReactNode }) {
//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-sm border">
//       <h2 className="text-xl font-semibold mb-4">{title}</h2>
//       <div className="text-sm text-gray-700">{children}</div>
//     </div>
//   );
// }


import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Play } from "lucide-react";
import type { ReactNode } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import profpic from "../../assets/profpic.jpg";
import hp from "../../assets/hp.jpeg";
import sw from "../../assets/sw.png";
const foundersData = [
  {
    id: "1",
    name: "Sanjana Kotian",
    photo: profpic,
    startup: "Emcure",
    industry: "HealthTech",
    stage: "Seed Round",
    location: "Mumbai, India",
    founderType: "Second-Time Founder",
    elevatorPitch:
      "Emcure builds digital healthcare infrastructure to improve hospital operations and patient outcomes.",
    problem:
      "Hospitals struggle with fragmented digital systems and inefficient patient management.",
    solution:
      "Unified healthcare platform integrating patient records, hospital systems, and analytics.",
    market: {
      tam: "$150B Global HealthTech Market",
      target: "Hospitals & Healthcare Providers",
      growth: "14% annual growth",
    },
    businessModel: {
      revenueModel: "Enterprise SaaS",
      avgOrderValue: "$3,200",
      grossMargin: "65%",
    },
    traction: {
      mrr: "$48,000",
      growth: "+20% MoM",
      customers: "60 Hospitals",
      retention: "89%",
      runway: "16 Months",
    },
    competition: [
      { name: "MediSoft", strength: "Large enterprise clients", weakness: "Slow innovation" },
      { name: "HealthStack", strength: "Affordable", weakness: "Limited analytics" },
    ],
    team: {
      size: 14,
      keyRoles: ["CEO", "CTO", "Medical Advisor"],
      missing: ["Growth Lead"],
    },
    fundingAsk: {
      raising: "$800K",
      useOfFunds: "Product scaling & hospital partnerships",
    },
    risks: ["Healthcare regulations", "Integration complexity"],
    impact: {
      plasticReduced: "N/A",
      carbonSaved: "N/A",
    },
    readiness: {
      product: 8,
      market: 7,
      financial: 7,
      compliance: 8,
      total: 83,
    },
  },

  {
    id: "2",
    name: "Priya Sharma",
    photo:
      "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "HealthSync",
    industry: "HealthTech",
    stage: "Pre-Seed",
    location: "Bangalore, India",
    founderType: "First-Time Founder",
    elevatorPitch:
      "AI-powered patient monitoring platform for hospitals.",
    problem:
      "Hospitals struggle with real-time patient monitoring inefficiencies.",
    solution:
      "AI-based system to track and predict patient deterioration.",
    market: {
      tam: "$80B Healthcare Tech Market",
      target: "Private Hospitals",
      growth: "15% annual growth",
    },
    businessModel: {
      revenueModel: "SaaS subscription",
      avgOrderValue: "$1,800",
      grossMargin: "70%",
    },
    traction: {
      mrr: "$25,000",
      growth: "+22% MoM",
      customers: "40 Hospitals",
      retention: "90%",
      runway: "12 Months",
    },
    competition: [
      { name: "MediTrack", strength: "Strong brand", weakness: "Expensive" },
      { name: "CareAI", strength: "Fast deployment", weakness: "Limited features" },
    ],
    team: {
      size: 8,
      keyRoles: ["CEO", "CTO", "Medical Advisor"],
      missing: ["Sales Lead"],
    },
    fundingAsk: {
      raising: "$500K",
      useOfFunds: "Product & sales expansion",
    },
    risks: ["Regulatory approvals", "Hospital adoption cycles"],
    impact: {
      plasticReduced: "N/A",
      carbonSaved: "N/A",
    },
    readiness: {
      product: 7,
      market: 8,
      financial: 6,
      compliance: 8,
      total: 78,
    },
  },

  {
    id: "3",
    name: "Hemangi Purkar",
    photo: hp,
    startup: "TechBridge Academy",
    industry: "EdTech",
    stage: "Seed Round",
    location: "Austin, Texas",
    founderType: "First-Time Founder",
    elevatorPitch:
      "TechBridge Academy helps underrepresented communities access high-quality tech education.",
    problem:
      "Many aspiring developers lack access to affordable and practical tech education.",
    solution:
      "Industry-aligned coding bootcamps with mentorship and job placement support.",
    market: {
      tam: "$60B Global EdTech Market",
      target: "Students & career switchers",
      growth: "16% YoY growth",
    },
    businessModel: {
      revenueModel: "Course fees & corporate training",
      avgOrderValue: "$900",
      grossMargin: "58%",
    },
    traction: {
      mrr: "$30,000",
      growth: "+15% MoM",
      customers: "800 students",
      retention: "85%",
      runway: "15 Months",
    },
    competition: [
      { name: "CodeAcademy", strength: "Brand recognition", weakness: "Generic courses" },
      { name: "SkillForge", strength: "Corporate training", weakness: "High price" },
    ],
    team: {
      size: 10,
      keyRoles: ["CEO", "Curriculum Head"],
      missing: ["Marketing Lead"],
    },
    fundingAsk: {
      raising: "$600K",
      useOfFunds: "Platform scaling & partnerships",
    },
    risks: ["Student acquisition cost", "Course completion rates"],
    impact: {
      plasticReduced: "N/A",
      carbonSaved: "N/A",
    },
    readiness: {
      product: 8,
      market: 7,
      financial: 6,
      compliance: 7,
      total: 80,
    },
  },

  {
    id: "4",
    name: "Swapnali Kadam",
    photo:
      sw,
    startup: "FoodChain",
    industry: "AgriTech",
    stage: "Seed Round",
    location: "Chicago, USA",
    founderType: "Second-Time Founder",
    elevatorPitch:
      "FoodChain uses data analytics to optimize global food supply chains.",
    problem:
      "Food waste and inefficient logistics cost billions annually.",
    solution:
      "AI-powered supply chain optimization for food producers and retailers.",
    market: {
      tam: "$200B Food Logistics Market",
      target: "Food producers & distributors",
      growth: "10% YoY growth",
    },
    businessModel: {
      revenueModel: "Enterprise SaaS",
      avgOrderValue: "$3,000",
      grossMargin: "68%",
    },
    traction: {
      mrr: "$38,000",
      growth: "+17% MoM",
      customers: "55 Companies",
      retention: "88%",
      runway: "13 Months",
    },
    competition: [
      { name: "AgriFlow", strength: "Strong network", weakness: "Limited analytics" },
      { name: "FarmLink", strength: "Low cost", weakness: "Less scalable" },
    ],
    team: {
      size: 11,
      keyRoles: ["CEO", "CTO"],
      missing: ["Operations Lead"],
    },
    fundingAsk: {
      raising: "$700K",
      useOfFunds: "Product development & expansion",
    },
    risks: ["Supply chain volatility", "Seasonal demand"],
    impact: {
      plasticReduced: "N/A",
      carbonSaved: "N/A",
    },
    readiness: {
      product: 8,
      market: 7,
      financial: 7,
      compliance: 7,
      total: 81,
    },
  },

  {
    id: "5",
    name: "Emma Chen",
    photo:
      "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "EcoBox",
    industry: "Sustainable Packaging",
    stage: "Seed Round",
    location: "San Francisco, CA",
    founderType: "Second-Time Founder",
    elevatorPitch:
      "EcoBox replaces plastic e-commerce packaging with biodegradable alternatives.",
    problem:
      "E-commerce packaging contributes to over 40% of plastic waste globally.",
    solution:
      "Biodegradable packaging that decomposes within 90 days.",
    market: {
      tam: "$120B Global Packaging Market",
      target: "Mid-size e-commerce brands",
      growth: "12% YoY industry growth",
    },
    businessModel: {
      revenueModel: "B2B Bulk Orders",
      avgOrderValue: "$2,400",
      grossMargin: "62%",
    },
    traction: {
      mrr: "$42,000",
      growth: "+18% MoM",
      customers: "120 Clients",
      retention: "87%",
      runway: "14 Months",
    },
    competition: [
      { name: "EcoPack", strength: "Premium branding", weakness: "High cost" },
      { name: "GreenWrap", strength: "Distribution", weakness: "Slow decomposition" },
    ],
    team: {
      size: 12,
      keyRoles: ["CEO", "CTO"],
      missing: ["Marketing Head"],
    },
    fundingAsk: {
      raising: "$750K",
      useOfFunds: "Manufacturing & marketing",
    },
    risks: ["Supplier dependency", "Logistics complexity"],
    impact: {
      plasticReduced: "18 Tons",
      carbonSaved: "32% reduction",
    },
    readiness: {
      product: 8,
      market: 7,
      financial: 6,
      compliance: 9,
      total: 82,
    },
  },
];

/* ============================
   COMPONENT
============================ */

export default function FounderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const founder = foundersData.find((f) => f.id === id);

  if (!founder) {
    return <div className="p-6">Founder not found</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border flex gap-6">
        <ImageWithFallback
          src={founder.photo}
          alt={founder.name}
          className="w-24 h-24 rounded-full object-cover"
        />
        <div>
          <h1 className="text-3xl font-semibold">{founder.name}</h1>
          <p className="text-purple-600 text-lg">{founder.startup}</p>
          <p className="text-sm text-gray-600 mt-1">
            {founder.industry} • {founder.stage} • {founder.location}
          </p>
        </div>
      </div>

      <Section title="Elevator Pitch">{founder.elevatorPitch}</Section>

      <Section title="Problem & Solution">
        <p><strong>Problem:</strong> {founder.problem}</p>
        <p className="mt-2"><strong>Solution:</strong> {founder.solution}</p>
      </Section>

      <Section title="Market Opportunity">
        <p><strong>TAM:</strong> {founder.market.tam}</p>
        <p><strong>Target:</strong> {founder.market.target}</p>
        <p><strong>Growth:</strong> {founder.market.growth}</p>
      </Section>

      <Section title="Business Model">
        <p><strong>Revenue Model:</strong> {founder.businessModel.revenueModel}</p>
        <p><strong>Avg Order Value:</strong> {founder.businessModel.avgOrderValue}</p>
        <p><strong>Gross Margin:</strong> {founder.businessModel.grossMargin}</p>
      </Section>

      <Section title="Traction & Metrics">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Metric label="MRR" value={founder.traction.mrr} />
          <Metric label="Growth" value={founder.traction.growth} />
          <Metric label="Customers" value={founder.traction.customers} />
          <Metric label="Retention" value={founder.traction.retention} />
          <Metric label="Runway" value={founder.traction.runway} />
        </div>
      </Section>

      <Section title="Competitive Landscape">
        {founder.competition.map((comp, index) => (
          <div key={index} className="mb-3">
            <p className="font-semibold">{comp.name}</p>
            <p>Strength: {comp.strength}</p>
            <p>Weakness: {comp.weakness}</p>
          </div>
        ))}
      </Section>

      <Section title="Team">
        <p><strong>Team Size:</strong> {founder.team.size}</p>
        <p><strong>Key Roles:</strong> {founder.team.keyRoles.join(", ")}</p>
        <p><strong>Missing Roles:</strong> {founder.team.missing.join(", ")}</p>
      </Section>

      <Section title="Funding Ask">
        <p><strong>Raising:</strong> {founder.fundingAsk.raising}</p>
        <p><strong>Use of Funds:</strong> {founder.fundingAsk.useOfFunds}</p>
      </Section>

      <Section title="Risk Factors">
        <ul className="list-disc list-inside">
          {founder.risks.map((risk, i) => (
            <li key={i}>{risk}</li>
          ))}
        </ul>
      </Section>

      <Section title="Impact Metrics">
        <p><strong>Plastic Reduced:</strong> {founder.impact.plasticReduced}</p>
        <p><strong>Carbon Saved:</strong> {founder.impact.carbonSaved}</p>
      </Section>

      <Section title="Readiness Score">
        <p>Total Score: <strong>{founder.readiness.total}/100</strong></p>
        <p>Product: {founder.readiness.product}/10</p>
        <p>Market: {founder.readiness.market}/10</p>
        <p>Financial: {founder.readiness.financial}/10</p>
        <p>Compliance: {founder.readiness.compliance}/10</p>
      </Section>

      <Section title="Pitch Materials">
        <div className="flex gap-4 text-purple-600">
          <button className="flex items-center gap-2">
            <FileText size={16} /> Pitch Deck
          </button>
          <button className="flex items-center gap-2">
            <Play size={16} /> Demo Video
          </button>
        </div>
      </Section>

    </div>
  );
}

/* ============================
   REUSABLE COMPONENTS
============================ */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}