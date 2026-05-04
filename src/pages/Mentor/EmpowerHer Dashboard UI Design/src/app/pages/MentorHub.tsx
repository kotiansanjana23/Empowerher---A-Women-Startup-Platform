import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Target,
  StickyNote,
  FileText,
  CheckCircle2,
} from "lucide-react";

export default function MentorHub() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [founder, setFounder] = useState<any>(null);

  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingScheduled, setMeetingScheduled] = useState(false);

  const [agenda, setAgenda] = useState("");
  const [notes, setNotes] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [pdfLink, setPdfLink] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myFounders") || "[]");
    const selected = stored.find((f: any) => f.id == id);

    if (selected) {
      setFounder(selected);

      if (selected.mentorHub) {
        setMeetingDate(selected.mentorHub.meetingDate || "");
        setMeetingTime(selected.mentorHub.meetingTime || "");
        setAgenda(selected.mentorHub.agenda || "");
        setNotes(selected.mentorHub.notes || "");
        setYoutubeLink(selected.mentorHub.youtubeLink || "");
        setPdfLink(selected.mentorHub.pdfLink || "");
        if (selected.mentorHub.meetingDate) {
          setMeetingScheduled(true);
        }
      }
    }
  }, [id]);

  const handleSchedule = () => {
    if (!meetingDate || !meetingTime) {
      alert("Please select date and time");
      return;
    }
    setMeetingScheduled(true);
    setShowScheduler(false);
  };

  const handleSave = () => {
    // const stored = JSON.parse(localStorage.getItem("myFounders") || "[]");

    // const updated = stored.map((f: any) => {
    //   if (f.id == id) {
    //     return {
    //       ...f,
    //       mentorHub: {
    //         meetingDate,
    //         meetingTime,
    //         agenda,
    //         notes,
    //         youtubeLink,
    //         pdfLink,
    //       },
    //     };
    //   }
    //   return f;
    // });

    // localStorage.setItem("myFounders", JSON.stringify(updated));
    // alert("Mentor Strategy Saved!");

    const handleSave = () => {
  const stored = JSON.parse(localStorage.getItem("myFounders") || "[]");

  const updated = stored.map((f: any) => {
    if (f.id == id) {

      const existingMilestones = f.mentorHub?.milestones || {
        product: 40,
        traction: 30,
        revenue: 20,
        branding: 35,
        pitch: 30,
      };

      const newMilestones = {
        product: agenda ? Math.min(existingMilestones.product + 5, 100) : existingMilestones.product,
        traction: notes ? Math.min(existingMilestones.traction + 5, 100) : existingMilestones.traction,
        pitch: youtubeLink || pdfLink ? Math.min(existingMilestones.pitch + 5, 100) : existingMilestones.pitch,
        revenue: existingMilestones.revenue,
        branding: existingMilestones.branding,
      };

      return {
        ...f,
        mentorHub: {
          meetingDate,
          meetingTime,
          agenda,
          notes,
          youtubeLink,
          pdfLink,
          milestones: newMilestones,
        },
      };
    }
    return f;
  });

  localStorage.setItem("myFounders", JSON.stringify(updated));
  alert("Mentor Strategy Saved!");
};
  };

  if (!founder) return <div className="p-6">Founder not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-600 text-white rounded-3xl p-10 shadow-2xl">
          <h1 className="text-4xl font-bold">
            Mentor Strategy Dashboard
          </h1>
          <p className="mt-3 text-lg opacity-90">
            Guiding {founder.founder} — {founder.startup}
          </p>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">

          <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"></div>

          <h2 className="text-2xl font-semibold mb-6">
            Strategy Session Planner
          </h2>

          {!meetingScheduled && !showScheduler && (
            <button
              onClick={() => setShowScheduler(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-lg font-medium hover:scale-[1.02] transition"
            >
              Plan Next Strategy Session
            </button>
          )}

          {showScheduler && (
            <div className="space-y-5">
              <div className="flex gap-4">
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="border rounded-xl p-4 w-full focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="border rounded-xl p-4 w-full focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleSchedule}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-medium hover:scale-[1.02] transition"
              >
                Confirm Strategy Session
              </button>
            </div>
          )}

          {meetingScheduled && (
            <div className="mt-6 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 border border-emerald-300 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                  <CheckCircle2 size={22} />
                </div>

                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    Strategy Session Confirmed
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {meetingDate} • {meetingTime}
                  </p>
                </div>

                <span className="ml-auto px-4 py-2 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                  Upcoming
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Agenda */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Target size={20} />
            Session Goals
          </h2>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            rows={4}
            className="w-full border rounded-xl p-4 focus:ring-2 focus:ring-purple-500"
            placeholder="Define growth targets..."
          />
        </div>

        {/* Resources */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6">
            Strategic Resources
          </h2>

          <input
            type="text"
            placeholder="YouTube link..."
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            className="w-full border rounded-xl p-4 mb-4"
          />

          <input
            type="text"
            placeholder="PDF link..."
            value={pdfLink}
            onChange={(e) => setPdfLink(e.target.value)}
            className="w-full border rounded-xl p-4"
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <StickyNote size={20} />
            Private Mentor Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full border rounded-xl p-4 focus:ring-2 focus:ring-purple-500"
            placeholder="Confidential strategy observations..."
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
        >
          Save Mentor Strategy
        </button>

      </div>
    </div>
  );
}