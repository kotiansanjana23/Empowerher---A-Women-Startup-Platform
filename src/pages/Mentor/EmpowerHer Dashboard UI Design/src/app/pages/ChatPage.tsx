import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Smile, Video } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const founder = {
    name: "Emma Chen",
    photo:
      "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    startup: "EcoBox",
    status: "Active now",
  };

  const messages = [
    {
      id: 1,
      sender: "founder",
      text: "Hi Sarah! Thank you so much for accepting my session request.",
      time: "10:23 AM",
    },
    {
      id: 2,
      sender: "mentor",
      text: "You're very welcome! Looking forward to our session.",
      time: "10:25 AM",
    },
    {
      id: 3,
      sender: "founder",
      text: "Can we schedule a strategy call tomorrow?",
      time: "10:28 AM",
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      alert(`Message sent: ${message}`);
      setMessage("");
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      alert(`File attached: ${file.name}`);
    }
  };

  const handleConfirmMeeting = () => {
    if (!meetingDate) {
      alert("Please select day, date and time");
      return;
    }

    const formattedDate = new Date(meetingDate).toLocaleString();
    setShowCalendar(false);

    alert(`📅 Zoom Meeting Scheduled on ${formattedDate}`);
  };

  const emojis = ["😊", "🚀", "👍", "🔥", "💡", "🎯"];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4">
        <button
          onClick={() => navigate("/my-founders")}
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <ImageWithFallback
          src={founder.photo}
          alt={founder.name}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex-1">
          <h2 className="font-medium">{founder.name}</h2>
          <p className="text-sm text-gray-600">{founder.startup}</p>

          {/* Active Now */}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-green-600">
              {founder.status}
            </span>
          </div>
        </div>

        {/* Schedule Meeting */}
        <div className="relative">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            <Video size={16} />
            Schedule Meeting
          </button>

          {showCalendar && (
            <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-md p-4 space-y-3 z-50 w-64">
              <input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full"
              />

              <button
                onClick={handleConfirmMeeting}
                className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700"
              >
                Confirm Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "mentor"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-md ${
                msg.sender === "mentor"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              } rounded-2xl px-4 py-3 shadow-sm`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs mt-1 opacity-70">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3 relative">
          {/* File Upload */}
          <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg">
            <Paperclip size={20} />
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Smile size={20} />
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-10 bg-white border shadow-md rounded-lg p-2 flex gap-2">
              {emojis.map((emoji, index) => (
                <span
                  key={index}
                  className="cursor-pointer text-xl"
                  onClick={() => {
                    setMessage(message + emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}

          {/* Message Input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSend()
            }
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={handleSend}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}