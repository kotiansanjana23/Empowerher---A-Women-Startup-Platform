import { useState, useEffect, useRef } from "react";
import {
  Upload, Link2, Globe, Award, DollarSign, Save, Check, Loader2
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { db, auth } from "../../../../../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
// import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// const storage = getStorage();

const daysOfWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const timeSlots = [
  "9:00 AM - 10:00 AM","10:00 AM - 11:00 AM","11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM","1:00 PM - 2:00 PM","2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM","4:00 PM - 5:00 PM","5:00 PM - 6:00 PM",
];

export default function Profile() {
  const [activeTab, setActiveTab]   = useState<"profile" | "availability">("profile");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [savedMsg, setSavedMsg]     = useState("");
  const photoInputRef               = useRef<HTMLInputElement>(null);

  /* ── Profile fields ── */
  const [fullName,    setFullName]    = useState("");
  const [title,       setTitle]       = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [bio,         setBio]         = useState("");
  const [linkedin,    setLinkedin]    = useState("");
  const [website,     setWebsite]     = useState("");
  const [yearsExp,    setYearsExp]    = useState("15");
  const [hourlyRate,  setHourlyRate]  = useState("150");
  const [photoURL,    setPhotoURL]    = useState("");
  const [industry,    setIndustry]    = useState("Technology");
  const [skills,      setSkills]      = useState<string[]>(["Business Strategy","Fundraising","Pitch Development"]);
  const [newSkill,    setNewSkill]    = useState("");

  /* ── Availability fields ── */
  const [selectedDays,      setSelectedDays]      = useState<string[]>(["Monday","Tuesday","Wednesday","Thursday"]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(["10:00 AM - 11:00 AM","2:00 PM - 3:00 PM"]);
  const [blockedDates,      setBlockedDates]      = useState<string[]>([]);
  const [newBlockDate,      setNewBlockDate]      = useState("");

  const uid = auth.currentUser?.uid;

  /* ── Load from Firestore on mount ── */
  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    async function load() {
      try {
        const snap = await getDoc(doc(db, "mentors", uid as string));
        if (snap.exists()) {
          const d = snap.data();
          setFullName(d.fullName || "");
          setTitle(d.title || "");
          setEmail(d.email || auth.currentUser?.email || "");
          setPhone(d.phone || "");
          setBio(d.bio || "");
          setLinkedin(d.linkedin || "");
          setWebsite(d.website || "");
          setYearsExp(String(d.yearsExp || "15"));
          setHourlyRate(String(d.hourlyRate || "150"));
          setPhotoURL(d.photoURL || "");
          setIndustry(d.industry || "Technology");
          setSkills(d.skills || ["Business Strategy","Fundraising","Pitch Development"]);
          setSelectedDays(d.availableDays || ["Monday","Tuesday","Wednesday","Thursday"]);
          setSelectedTimeSlots(d.availableTimeSlots || ["10:00 AM - 11:00 AM","2:00 PM - 3:00 PM"]);
          setBlockedDates(d.blockedDates || []);
        } else {
          // Pre-fill email from auth
          setEmail(auth.currentUser?.email || "");
          setFullName(auth.currentUser?.displayName || "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [uid]);

  /* ── Upload photo to Firebase Storage ── */
  // const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file || !uid) return;

  //   setPhotoUploading(true);
  //   try {
  //     const storageRef = ref(storage, `mentorPhotos/${uid}/${Date.now()}_${file.name}`);
  //     const task = uploadBytesResumable(storageRef, file);
  //     await new Promise<void>((resolve, reject) => task.on("state_changed", undefined, reject, resolve));
  //     const url = await getDownloadURL(task.snapshot.ref);
  //     setPhotoURL(url);
  //     // Save immediately to Firestore so it persists
  //     await setDoc(doc(db, "mentors", uid), { photoURL: url }, { merge: true });
  //   } catch (err) {
  //     console.error("Photo upload failed:", err);
  //     alert("Photo upload failed. Check Firebase Storage rules.");
  //   } finally {
  //     setPhotoUploading(false);
  //   }
  // };
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !uid) return;
  setPhotoUploading(true);
  try {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoURL(base64);
      await setDoc(doc(db, "mentors", uid), { photoURL: base64 }, { merge: true });
      setPhotoUploading(false);
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error("Photo upload failed:", err);
    setPhotoUploading(false);
  }
};

  /* ── Save profile to Firestore ── */
  const handleSaveProfile = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "mentors", uid), {
        uid,
        fullName,
        title,
        email,
        phone,
        bio,
        linkedin,
        website,
        yearsExp: Number(yearsExp),
        hourlyRate: Number(hourlyRate),
        photoURL,
        industry,
        skills,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSavedMsg("Profile saved successfully!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Save availability to Firestore ── */
  const handleSaveAvailability = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "mentors", uid), {
        availableDays:      selectedDays,
        availableTimeSlots: selectedTimeSlots,
        blockedDates,
        updatedAt:          serverTimestamp(),
      }, { merge: true });

      setSavedMsg("Availability saved!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save availability.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay      = (d: string) => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleTimeSlot = (s: string) => setSelectedTimeSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addSkill       = () => { if (newSkill.trim() && !skills.includes(newSkill.trim())) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); }};
  const removeSkill    = (s: string) => setSkills(skills.filter(x => x !== s));
  const addBlock       = () => { if (newBlockDate && !blockedDates.includes(newBlockDate)) { setBlockedDates([...blockedDates, newBlockDate]); setNewBlockDate(""); }};
  const removeBlock    = (d: string) => setBlockedDates(blockedDates.filter(x => x !== d));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-gray-500">
        <Loader2 className="animate-spin" size={24} /> Loading profile...
      </div>
    );
  }
const handleSaveAll = async () => {
  if (!uid) return;
  setSaving(true);
  try {
    await setDoc(doc(db, "mentors", uid), {
      uid,
      fullName,
      title,
      email,
      phone,
      bio,
      linkedin,
      website,
      yearsExp: Number(yearsExp),
      hourlyRate: Number(hourlyRate),
      photoURL,
      industry,
      skills,
      availableDays: selectedDays,
      availableTimeSlots: selectedTimeSlots,
      blockedDates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setSavedMsg("Profile & Availability saved successfully!");
    setTimeout(() => setSavedMsg(""), 3000);
  } catch (err) {
    console.error("Save failed:", err);
    alert("Failed to save.");
  } finally {
    setSaving(false);
  }
};
  return (
    <div className="p-6 space-y-6">

      {/* Success banner */}
      {savedMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <Check size={16} /> {savedMsg}
        </div>
      )}

      <div>
        <h1 className="text-3xl text-black">Profile & Availability</h1>
        <p className="text-gray-500 mt-1">Manage your profile information and mentorship availability.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["profile","availability"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 border-b-2 capitalize transition-colors ${
              activeTab === tab ? "border-purple-600 text-purple-600" : "border-transparent text-gray-600 hover:text-gray-800"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════ PROFILE TAB ═══════════ */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Basic Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-6 text-black">Basic Information</h2>

                {/* Photo */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    {photoURL ? (
                      <img src={photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-purple-200" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
                        {fullName?.[0] || "M"}
                      </div>
                    )}
                    {photoUploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                        <Loader2 size={20} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors mb-2 disabled:opacity-50"
                    >
                      <Upload size={18} />
                      {photoUploading ? "Uploading..." : "Upload New Photo"}
                    </button>
                    <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB.</p>
                    <input type="file" ref={photoInputRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Full Name",  value: fullName,   set: setFullName,   type: "text"  },
                    { label: "Company Name",      value: title,      set: setTitle,      type: "text"  },
                    { label: "Email",      value: email,      set: setEmail,      type: "email" },
                    { label: "Phone",      value: phone,      set: setPhone,      type: "tel"   },
                  ].map(({ label, value, set, type }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium mb-2 text-black">{label}</label>
                      <input type={type} value={value} onChange={e => set(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-black">Bio</label>
                  <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-purple-900">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addSkill()}
                    placeholder="Add a skill..."
                    className="flex-1 px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <button onClick={addSkill} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Add</button>
                </div>
              </div>

              {/* Links */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Professional Links</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Link2 className="text-purple-600" size={20} />
                    <input type="url" placeholder="LinkedIn Profile URL" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="text-purple-600" size={20} />
                    <input type="url" placeholder="Personal Website" value={website} onChange={e => setWebsite(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Experience */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Experience</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">Years of Experience</label>
                    <input type="number" value={yearsExp} onChange={e => setYearsExp(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">Primary Industry</label>
                    <select value={industry} onChange={e => setIndustry(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {["Technology","Healthcare","Education","Finance","Fintech","E-commerce","SaaS"].map(i => (
                        <option key={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Session Charges */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl mb-4 text-black">Session Charges</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">Hourly Rate (INR)</label>
                    <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
  ₹
</span>
                      <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-700">
Platform takes 15% commission. You'll receive ₹{(Number(hourlyRate) * 0.85).toFixed(2)} per session.                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end">
            {/* <button onClick={handleSaveProfile} disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={20} />}
              {saving ? "Saving..." : "Save Profile"}
            </button> */}
          </div>
        </div>
      )}

      {/* ═══════════ AVAILABILITY TAB ═══════════ */}
      {activeTab === "availability" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl mb-6 text-black">Weekly Availability</h2>

            {/* Days */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-black">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button key={day} onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedDays.includes(day) ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-black">Available Time Slots</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {timeSlots.map(slot => (
                  <button key={slot} onClick={() => toggleTimeSlot(slot)}
                    className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                      selectedTimeSlots.includes(slot) ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Block dates */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-black">Block Specific Dates</label>
              <div className="flex gap-3">
                <input type="date" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button onClick={addBlock} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Add Block</button>
              </div>
              {blockedDates.length > 0 && (
                <div className="mt-3 space-y-2">
                  {blockedDates.map(d => (
                    <div key={d} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-black">{d}</span>
                      <button onClick={() => removeBlock(d)} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <Check className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1">Current Availability Summary</p>
                  <p className="text-sm text-purple-700">
                    You're available {selectedDays.length} days per week with {selectedTimeSlots.length} time slots per day.
                    This gives you approximately {selectedDays.length * selectedTimeSlots.length} session slots weekly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
          <button onClick={handleSaveAll} disabled={saving}
  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-60">
  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={20} />}
  {saving ? "Saving..." : "Save Profile & Availability"}
</button>
          </div>
        </div>
      )}
    </div>
  );
}
