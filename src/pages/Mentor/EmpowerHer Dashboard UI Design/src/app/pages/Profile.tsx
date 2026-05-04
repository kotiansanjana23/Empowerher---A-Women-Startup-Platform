import { useState, useEffect } from "react";
import {
  Upload,
  Link2,
  Globe,
  Award,
  DollarSign,
  Save,
  Check,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeSlots = [
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"profile" | "availability">(
    "profile",
  );
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
  ]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([
    "10:00 AM - 11:00 AM",
    "2:00 PM - 3:00 PM",
  ]);
  const [skills, setSkills] = useState<string[]>([
    "Business Strategy",
    "Fundraising",
    "Pitch Development",
    "Market Analysis",
  ]);
  const [newSkill, setNewSkill] = useState("");

  // Check if URL has #availability hash
  useEffect(() => {
    if (window.location.hash === "#availability") {
      setActiveTab("availability");
    }
  }, []);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleTimeSlot = (slot: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSaveProfile = () => {
    alert("Profile updated successfully!");
  };

  const handleSaveAvailability = () => {
    alert("Availability settings saved!");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl text-black">Profile & Availability</h1>
        <p className="text-gray-500 mt-1">
          Manage your profile information and mentorship availability.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("availability")}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === "availability"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          Availability
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-6 text-black">Basic Information</h2>

                {/* Profile Photo */}
                <div className="flex items-center gap-6 mb-6">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1754298949882-216a1c92dbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors mb-2">
                      <Upload size={18} />
                      Upload New Photo
                    </button>
                    <p className="text-xs text-gray-500">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Sarah Martinez"
                      className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Title
                    </label>
                    <input
                      type="text"
                      defaultValue="Business Mentor"
                      className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="sarah.martinez@empowerher.com"
className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 987-6543"
className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-black">Bio</label>
                  <textarea
                     className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={4}
                    defaultValue="Experienced business mentor with 15+ years in tech startups and venture capital. Passionate about helping women entrepreneurs build sustainable, scalable businesses."
                  ></textarea>
                </div>
              </div>

              {/* Skills & Expertise */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2 mb-4 text-black">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-purple-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add a skill..."
className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Professional Links */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Professional Links</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Link2 className="text-purple-600" size={20} />
                    <input
                      type="url"
                      placeholder="LinkedIn Profile URL"
                      defaultValue="linkedin.com/in/sarahmartinez"
className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="text-purple-600" size={20} />
                    <input
                      type="url"
                      placeholder="Personal Website"
                      defaultValue="sarahmartinez.com"
className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Experience */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Experience</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      defaultValue="15"
className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Industries
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2">
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Finance</option>
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        Technology
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        Healthcare
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        SaaS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Certifications</h2>
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                    <Award className="text-purple-600" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">
                        MBA - Harvard Business School
                      </p>
                      <p className="text-xs text-gray-500 text-black">2008</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                    <Award className="text-purple-600" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">
                        Certified Business Coach
                      </p>
                      <p className="text-xs text-gray-500 text-black">2015</p>
                    </div>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                  <Upload size={18} />
                  Upload Certification
                </button>
              </div>

              {/* Session Charges */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Session Charges</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Hourly Rate (USD)
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-black"
                        size={18}
                      />
                      <input
  type="number"
  defaultValue="150"
  className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
/>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-700">
                      Platform takes 15% commission. You'll receive $127.50 per
                      session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              <Save size={20} />
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === "availability" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl mb-6 text-black">Weekly Availability</h2>

            {/* Day Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                Available Days
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedDays.includes(day)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                Available Time Slots
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => toggleTimeSlot(slot)}
                    className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                      selectedTimeSlots.includes(slot)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Block Dates */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-black">
                Block Specific Dates
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
className="w-full px-4 py-2 border border-gray-300 !bg-white !text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"                />
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Add Block
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-black">Feb 25, 2026 - Vacation</span>
                  <button className="text-red-600 hover:text-red-700 text-sm">
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-black">Mar 5, 2026 - Conference</span>
                  <button className="text-red-600 hover:text-red-700 text-sm">
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <Check
                  className="text-purple-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1 text-black">
                    Current Availability Summary
                  </p>
                  <p className="text-sm text-purple-700">
                    You're available {selectedDays.length} days per week with{" "}
                    {selectedTimeSlots.length} time slots per day. This gives
                    you approximately{" "}
                    {selectedDays.length * selectedTimeSlots.length} session
                    slots weekly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveAvailability}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              <Save size={20} />
              Save Availability
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
