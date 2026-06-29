import { useState } from "react";
import { DashboardLayout } from "./components/DashboardLayout";
import { NavigationContext } from "./context/NavigationContext";
import type { InvestorPage } from "./context/NavigationContext";

export default function App() {
  const [activePage, setActivePage] = useState<InvestorPage>("dashboard");
  const [startupId, setStartupId] = useState<string | null>(null);
  const [history, setHistory] = useState<InvestorPage[]>([]);

  const navigate = (page: InvestorPage, params?: { startupId?: string }) => {
    setHistory((prev) => [...prev, activePage]);
    if (params?.startupId) setStartupId(params.startupId);
    setActivePage(page);
  };

  const goBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setActivePage(prev);
    } else {
      setActivePage("dashboard");
    }
  };

  return (
    <NavigationContext.Provider
      value={{ activePage, setActivePage, startupId, setStartupId, navigate, goBack }}
    >
      <DashboardLayout />
    </NavigationContext.Provider>
  );
}