import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { MentorMatching } from "./components/MentorMatching";
import { PitchSubmission } from "./components/PitchSubmission";
import { Training } from "./components/Training";
import { Funding } from "./components/Funding";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

export default function App() {
  const [currentView, setCurrentView] = useState("landing");

  const renderCurrentView = () => {
    switch (currentView) {
      case "landing":
        return (
          <LandingPage
            onSignIn={() => setCurrentView("dashboard")}
            onGetStarted={() => setCurrentView("dashboard")}
            onNavigate={setCurrentView}
          />
        );
      case "dashboard":
        return <Dashboard />;
      case "mentors":
        return <MentorMatching />;
      case "pitch":
        return <PitchSubmission />;
      case "training":
        return <Training />;
      case "funding":
        return <Funding />;
      default:
        return (
          <LandingPage
            onSignIn={() => setCurrentView("dashboard")}
            onGetStarted={() => setCurrentView("dashboard")}
            onNavigate={setCurrentView}
          />
        );
    }
  };

  // If not on landing page, show navigation
  if (currentView !== "landing") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setCurrentView("landing")}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">E</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900">
                    EmpowerHer
                  </span>
                </div>

                <div className="hidden md:flex items-center space-x-1">
                  <Button
                    variant={currentView === "dashboard" ? "default" : "ghost"}
                    onClick={() => setCurrentView("dashboard")}
                    className="text-sm"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant={currentView === "mentors" ? "default" : "ghost"}
                    onClick={() => setCurrentView("mentors")}
                    className="text-sm"
                  >
                    Find Mentors
                  </Button>
                  <Button
                    variant={currentView === "pitch" ? "default" : "ghost"}
                    onClick={() => setCurrentView("pitch")}
                    className="text-sm"
                  >
                    Pitch Center
                  </Button>
                  <Button
                    variant={currentView === "training" ? "default" : "ghost"}
                    onClick={() => setCurrentView("training")}
                    className="text-sm"
                  >
                    Training
                  </Button>
                  <Button
                    variant={currentView === "funding" ? "default" : "ghost"}
                    onClick={() => setCurrentView("funding")}
                    className="text-sm"
                  >
                    Funding
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {renderCurrentView()}
      </div>
    );
  }

 return (
  <div>
    <div className="relative">
      <LandingPage
        onSignIn={() => setCurrentView("dashboard")}
        onGetStarted={() => setCurrentView("dashboard")}
        onNavigate={setCurrentView}
      />
    </div>
  </div>
);
}
