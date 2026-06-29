import { Outlet } from "react-router";
import { Sidebar } from "../components/ui/Sidebar1";
import { TopNav } from "../components/ui/TopNav";

export function DashboardLayout() {
  return (
<div className="flex h-screen bg-[#080611]">
        <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
<main className="flex-1 overflow-y-auto p-0 bg-[#080611]">
            <Outlet />
        </main>
      </div>
    </div>
  );
}
