import { createContext, useContext } from "react";

export type InvestorPage =
  | "dashboard"
  | "explore"
  | "interested"
  | "mentor-recommendations"
  | "funding-requests"
  | "meetings"
  | "analytics"
  | "messages"
  | "startup-details"
  | "deal-room";

export interface NavigationContextType {
  activePage: InvestorPage;
  setActivePage: (page: InvestorPage) => void;
  startupId: string | null;
  setStartupId: (id: string | null) => void;
  navigate: (page: InvestorPage, params?: { startupId?: string }) => void;
  goBack: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  activePage: "dashboard",
  setActivePage: () => {},
  startupId: null,
  setStartupId: () => {},
  navigate: () => {},
  goBack: () => {},
});

export const useInvestorNav = () => useContext(NavigationContext);