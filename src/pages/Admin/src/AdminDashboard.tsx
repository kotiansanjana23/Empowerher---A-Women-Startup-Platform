import { Sidebar } from "./components/ui/Sidebar1";
import { TopNav } from "./components/ui/TopNav";
import { ReviewPitch } from "./pages/ReviewPitch";
import { Dashboard } from "./pages/Dashboard";
import { Founders } from "./pages/Founders";
import { Mentors } from "./pages/Mentors";
import { Investors } from "./pages/Investors";
import { Revenue } from "./pages/Revenue";
import { Applications } from "./pages/Applications";
import { Community } from "./pages/Community";
import { Reports } from "./pages/Reports";
import { Messages } from "./pages/Messages";
import { Settings } from "./pages/Settings";

import { Routes, Route } from "react-router-dom";

export default function AdminDashboard() {
  return (
<div className="flex h-screen bg-[#080611]">
        <Sidebar />

<div className="flex-1 flex flex-col overflow-hidden bg-[#080611]">
          <TopNav />

<main className="flex-1 overflow-y-auto p-0 bg-[#080611]">
            <Routes>
            <Route index element={<Dashboard />} />

            <Route path="founders" element={<Founders />} />

            <Route path="mentors" element={<Mentors />} />

            <Route path="investors" element={<Investors />} />

            <Route path="revenue" element={<Revenue />} />

            <Route path="applications" element={<Applications />} />

            <Route path="community" element={<Community />} />

            <Route path="reports" element={<Reports />} />

            <Route path="messages" element={<Messages />} />

            <Route path="review-pitch/:id" element={<ReviewPitch />} />

            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
