

import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import AdminDashboard from "./pages/Admin/src/AdminDashboard";
import FounderApp from "./pages/Founder/UI_UX Templates for Visionista (1)/src/App";
import MentorApp from "./pages/Mentor/EmpowerHer Dashboard UI Design/src/app/MentorApp";
import InvestorApp from "./pages/Investors/Investor Dashboard UI Design/src/app/App";
import ProtectedRoute from "./components/ProtectedRoute";
import { LandingPage } from "./pages/Founder/UI_UX Templates for Visionista (1)/src/components/LandingPage";

// Wrapper needed because useNavigate must be inside <BrowserRouter>
function LandingWrapper() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onSignIn={() => navigate("/signin")}
      onGetStarted={() => navigate("/signup")}
      onNavigate={(view) => {
        if (view === "signin") navigate("/signin");
        else if (view === "signup") navigate("/signup");
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingWrapper />} />

        {/* Auth */}
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected role-based routes */}
        <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/founder/*" element={<ProtectedRoute><FounderApp /></ProtectedRoute>} />
        <Route path="/mentor/*" element={<ProtectedRoute><MentorApp /></ProtectedRoute>} />
        <Route path="/investor/*" element={<ProtectedRoute><InvestorApp /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;