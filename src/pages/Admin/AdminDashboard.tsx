// import AdminUI from "./Admin dashboard for EmpowerHer/src/app/App";

// export default function AdminDashboard() {
//     console.log("AdminDashboard mounted");
//   return <AdminUI />; // ✅ THIS is the fix
// }
// import AdminUI from "./Admin dashboard for EmpowerHer/src/app/App";

// export default function AdminDashboard() {
//   console.log("AdminDashboard loaded"); // 👈 debug

//   return (
//     <div>
//       <h1 style={{ color: "blue" }}>WRAPPER WORKING</h1>
//       <AdminUI />
//     </div>
//   );
// }


// export default function AdminDashboard() {
//   return <h1>ADMIN DASHBOARD WORKING</h1>;
// }

// import AdminUI from "./adminUI/App";

// export default function AdminDashboard() {
//   return <AdminUI />;
// }

import { Sidebar } from "./adminUI/components/Sidebar";
import { TopNav } from "./adminUI/components/TopNav";

import { Dashboard } from "./adminUI/pages/Dashboard";
import { Users } from "./adminUI/pages/Users";
import { Mentors } from "./adminUI/pages/Mentors";
import { Courses } from "./adminUI/pages/Courses";
import { Marketplace } from "./adminUI/pages/Marketplace";
import { Orders } from "./adminUI/pages/Orders";
import { Community } from "./adminUI/pages/Community";
import { Reports } from "./adminUI/pages/Reports";
import { Messages } from "./adminUI/pages/Messages";
import { Settings } from "./adminUI/pages/Settings";

import { Routes, Route } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="courses" element={<Courses />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="orders" element={<Orders />} />
            <Route path="community" element={<Community />} />
            <Route path="reports" element={<Reports />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}


// import AdminUI from "./adminUI/App";

// export default function AdminDashboard() {
//   return (
//     <div>
//       <h1 style={{ color: "red" }}>WRAPPER WORKING</h1>
//       <AdminUI />
//     </div>
//   );
// }