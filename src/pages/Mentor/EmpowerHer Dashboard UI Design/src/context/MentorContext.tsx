import { createContext, useContext, useState } from "react";

export interface FounderType {
  id: number;
  founder: string;
  photo: string;
  startup: string;
  industry: string;
  problem: string;
  requestedDate: string;
  requestedTime: string;
  fundingStatus: string;
  fundingColor: string;
  readinessScore: number;
  lastSession: string;
}
interface MentorContextType {
  pendingRequests: FounderType[];
  myFounders: FounderType[];
  setMyFounders: React.Dispatch<React.SetStateAction<FounderType[]>>;
  acceptRequest: (id: number) => void;
  rejectRequest: (id: number) => void;
}
// interface MentorContextType {
//   pendingRequests: FounderType[];
//   myFounders: FounderType[];
//   acceptRequest: (id: number) => void;
//   rejectRequest: (id: number) => void;
// }

const MentorContext = createContext<MentorContextType | null>(null);

export const useMentor = () => {
  const context = useContext(MentorContext);
  if (!context) throw new Error("useMentor must be inside MentorProvider");
  return context;
};

export const MentorProvider = ({ children }: { children: React.ReactNode }) => {
  const initialRequests: FounderType[] = [
    {
      id: 1,
      founder: "Emma Chen",
      photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      startup: "EcoBox",
      industry: "Sustainable Packaging",
      problem: "Scaling B2B distribution & Series A funding.",
      requestedDate: "Feb 18, 2026",
      requestedTime: "2:00 PM - 3:00 PM",
      fundingStatus: "Seed Round",
      fundingColor: "blue",
      readinessScore: 85,
      lastSession: "Feb 12, 2026",
    },
    {
      id: 2,
      founder: "Priya Sharma",
      photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      startup: "HealthSync",
      industry: "HealthTech",
      problem: "FDA compliance & hospital partnerships.",
      requestedDate: "Feb 19, 2026",
      requestedTime: "10:00 AM - 11:00 AM",
      fundingStatus: "Pre-Seed",
      fundingColor: "purple",
      readinessScore: 72,
      lastSession: "Feb 10, 2026",
    },
    {
      id: 3,
      founder: "Sofia Rodriguez",
      photo: "https://images.unsplash.com/photo-1758369636875-60b3dcb76366?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      startup: "TechBridge Academy",
      industry: "EdTech",
      problem: "Go-to-market strategy.",
      requestedDate: "Feb 20, 2026",
      requestedTime: "3:00 PM - 4:00 PM",
      fundingStatus: "Series A",
      fundingColor: "green",
      readinessScore: 90,
      lastSession: "Feb 14, 2026",
    },
    {
      id: 4,
      founder: "Lisa Anderson",
      photo: "https://images.unsplash.com/photo-1754298949882-216a1c92dbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      startup: "FoodChain",
      industry: "AgriTech",
      problem: "Supply chain scaling.",
      requestedDate: "Feb 21, 2026",
      requestedTime: "11:00 AM - 12:00 PM",
      fundingStatus: "Bootstrapped",
      fundingColor: "yellow",
      readinessScore: 68,
      lastSession: "Feb 8, 2026",
    },
    {
      id: 5,
      founder: "Maya Johnson",
      photo: "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      startup: "CleanEnergy Solutions",
      industry: "CleanTech",
      problem: "Investor pitch refinement.",
      requestedDate: "Feb 22, 2026",
      requestedTime: "1:00 PM - 2:00 PM",
      fundingStatus: "Seed Round",
      fundingColor: "blue",
      readinessScore: 78,
      lastSession: "Feb 13, 2026",
    },
    {
      id: 6,
      founder: "Aisha Patel",
      photo: "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      startup: "FinanceFirst",
      industry: "FinTech",
      problem: "Scaling acquisition strategy.",
      requestedDate: "Feb 23, 2026",
      requestedTime: "4:00 PM - 5:00 PM",
      fundingStatus: "Pre-Seed",
      fundingColor: "purple",
      readinessScore: 75,
      lastSession: "Feb 11, 2026",
    },
  ];

  const [pendingRequests, setPendingRequests] = useState(initialRequests);
  const [myFounders, setMyFounders] = useState<FounderType[]>([]);

  const acceptRequest = (id: number) => {
    const founder = pendingRequests.find((f) => f.id === id);
    if (!founder) return;

    setMyFounders((prev) => [...prev, founder]);
    setPendingRequests((prev) => prev.filter((f) => f.id !== id));
  };

  const rejectRequest = (id: number) => {
    setPendingRequests((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    // <MentorContext.Provider
    //   value={{ pendingRequests, myFounders, acceptRequest, rejectRequest }}
    // >
    <MentorContext.Provider
  value={{
    pendingRequests,
    myFounders,
    setMyFounders, // ✅ ADD THIS
    acceptRequest,
    rejectRequest
  }}
>
      {children}
    </MentorContext.Provider>
  );
};