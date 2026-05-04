// import { BrowserRouter, Routes, Route } from "react-router";
// import { Sidebar } from "./components/Sidebar";
// import { TopNav } from "./components/TopNav";
// import { Dashboard } from "./pages/Dashboard";
// import { Users } from "./pages/Users";
// import { Mentors } from "./pages/Mentors";
// import { Courses } from "./pages/Courses";
// import { Marketplace } from "./pages/Marketplace";
// import { Orders } from "./pages/Orders";
// import { Community } from "./pages/Community";
// import { Reports } from "./pages/Reports";
// import { Messages } from "./pages/Messages";
// import { Settings } from "./pages/Settings";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <div className="flex h-screen bg-background">
//         <Sidebar />
//         <div className="flex-1 flex flex-col overflow-hidden">
//           <TopNav />
//           <main className="flex-1 overflow-y-auto">
//             <Routes>
//               <Route path="/" element={<Dashboard />} />
//               <Route path="/users" element={<Users />} />
//               <Route path="/mentors" element={<Mentors />} />
//               <Route path="/courses" element={<Courses />} />
//               <Route path="/marketplace" element={<Marketplace />} />
//               <Route path="/orders" element={<Orders />} />
//               <Route path="/community" element={<Community />} />
//               <Route path="/reports" element={<Reports />} />
//               <Route path="/messages" element={<Messages />} />
//               <Route path="/settings" element={<Settings />} />
//             </Routes>
//           </main>
//         </div>
//       </div>
//     </BrowserRouter>
//   );
// }
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Mentors } from "./pages/Mentors";
import { Courses } from "./pages/Courses";
import { Marketplace } from "./pages/Marketplace";
import { Orders } from "./pages/Orders";
import { Community } from "./pages/Community";
import { Reports } from "./pages/Reports";
import { Messages } from "./pages/Messages";
import { Settings } from "./pages/Settings";

export default function AdminUI() {
  return (
  <div className="flex h-screen bg-background">
    <h1 style={{ color: "red" }}>ADMIN WORKING</h1>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
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