// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Login from "./pages/Auth/SignIn";
// import SignUp from "./pages/Auth/SignUp";
// import AdminDashboard from "./pages/Admin/AdminDashboard";
// import FounderApp from "./pages/Founder/UI_UX Templates for Visionista (1)/src/App";
// import MentorApp from "./pages/Mentor/EmpowerHer Dashboard UI Design/src/app/MentorApp";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Auth */}
//         <Route path="/" element={<Login />} />
//         <Route path="/signup" element={<SignUp />} />

//         {/* Admin - all sub pages */}
//         <Route path="/admin/*" element={<AdminDashboard />} />

//         {/* Founder */}
//         <Route path="/founder/*" element={<FounderApp />} />

//         {/* Mentor */}
//         <Route path="/mentor/*" element={<MentorApp />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import FounderApp from "./pages/Founder/UI_UX Templates for Visionista (1)/src/App";
import MentorApp from "./pages/Mentor/EmpowerHer Dashboard UI Design/src/app/MentorApp";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/signin" element={<Login />} /> {/* 🔥 ADD THIS */}
        <Route path="/signup" element={<SignUp />} />

        {/* Admin */}
        <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

        {/* Founder */}
        <Route path="/founder/*" element={<ProtectedRoute><FounderApp /></ProtectedRoute>} />

        {/* Mentor */}
        <Route path="/mentor/*" element={<ProtectedRoute><MentorApp /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;