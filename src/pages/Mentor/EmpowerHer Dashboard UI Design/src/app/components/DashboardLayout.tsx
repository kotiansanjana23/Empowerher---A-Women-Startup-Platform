// import { Outlet } from "react-router";
// import { Sidebar } from "./Sidebar";
// import { Header } from "./Header";

// export function DashboardLayout() {
//   return (
//     <div className="flex h-screen bg-gray-50">
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
//         <main className="flex-1 overflow-y-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

// import { Outlet } from "react-router-dom";
// import { Sidebar } from "./Sidebar";
// import { Header } from "./Header";

// export default function DashboardLayout() {
//   return (
//     <div className="flex h-screen bg-gray-50">
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
//         <main className="flex-1 overflow-y-auto p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-white"> {/* ✅ changed */}
      <Sidebar />

      <div className="flex-1 flex flex-col"> {/* ✅ removed overflow-hidden */}
        <Header />

        <main className="flex-1 p-6"> {/* ✅ removed overflow-y-auto */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}