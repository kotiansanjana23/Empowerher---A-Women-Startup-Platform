// import { useState, useRef, useEffect } from "react";
// import { Send, Paperclip, Smile, Search, X, Phone } from "lucide-react";
// import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// /* ================= DATA ================= */

// const conversationsData = [
//   {
//     id: 1,
//     founder: "Emma Chen",
//     startup: "EcoBox",
//     photo:
//       "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     online: true,
//     bio: "Founder of EcoBox — building sustainable packaging solutions for D2C brands focused on circular economy innovation.",
//     linkedin: "https://linkedin.com",
//     email: "emma@ecobox.com",
//     messages: [
//       { sender: "founder", text: "Hi Sarah! Excited for tomorrow.", time: "10:10 AM" },
//       { sender: "mentor", text: "Looking forward to it too, Emma.", time: "10:12 AM" },
//       { sender: "founder", text: "I’ll share updated numbers.", time: "10:14 AM" },
//       { sender: "mentor", text: "Perfect. We’ll refine strategy.", time: "10:15 AM" },
//       { sender: "founder", text: "Thanks for the guidance!", time: "10:16 AM" },
//     ],
//   },
//   {
//     id: 2,
//     founder: "Priya Sharma",
//     startup: "HealthSync",
//     photo:
//       "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     online: false,
//     bio: "Founder of HealthSync — AI-powered preventive healthcare monitoring platform.",
//     linkedin: "https://linkedin.com",
//     email: "priya@healthsync.io",
//     messages: [
//       { sender: "founder", text: "Can we reschedule?", time: "9:00 AM" },
//       { sender: "mentor", text: "Yes, tomorrow works.", time: "9:02 AM" },
//       { sender: "founder", text: "Great, thank you!", time: "9:03 AM" },
//       { sender: "mentor", text: "Please share pitch before call.", time: "9:05 AM" },
//     ],
//   },
//   {
//     id: 3,
//     founder: "Sofia Rodriguez",
//     startup: "TechBridge Academy",
//     photo:
//       "https://images.unsplash.com/photo-1758369636875-60b3dcb76366?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     online: true,
//     bio: "Building inclusive tech education programs for underrepresented communities.",
//     linkedin: "https://linkedin.com",
//     email: "sofia@techbridge.com",
//     messages: [
//       { sender: "founder", text: "Curriculum updated!", time: "8:20 AM" },
//       { sender: "mentor", text: "Impressive progress.", time: "8:25 AM" },
//       { sender: "founder", text: "Need feedback on pricing.", time: "8:30 AM" },
//     ],
//   },
//   {
//     id: 4,
//     founder: "Lisa Anderson",
//     startup: "FoodChain",
//     photo:
//       "https://images.unsplash.com/photo-1754298949882-216a1c92dbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     online: false,
//     bio: "Optimizing food supply chains using data-driven sustainability models.",
//     linkedin: "https://linkedin.com",
//     email: "lisa@foodchain.io",
//     messages: [
//       { sender: "founder", text: "Financials updated.", time: "Yesterday" },
//       { sender: "mentor", text: "I’ll review tonight.", time: "Yesterday" },
//     ],
//   },
//   {
//     id: 5,
//     founder: "Maya Johnson",
//     startup: "CleanEnergy Solutions",
//     photo:
//       "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
//     online: false,
//     bio: "CleanEnergy Solutions focuses on scalable solar micro-grid systems.",
//     linkedin: "https://linkedin.com",
//     email: "maya@cleanenergy.com",
//     messages: [
//       { sender: "founder", text: "Investor meeting done!", time: "Today" },
//       { sender: "mentor", text: "Fantastic news!", time: "Today" },
//     ],
//   },
//   {
//     id: 6,
//     founder: "Sanjana Kotian",
//     startup: "Emcure",
//     photo: "src/assets/profpic.jpg",
//     online: true,
//     bio: "Founder of Emcure — focused on innovative healthcare solutions combining digital systems and patient-centered design.",
//     linkedin: "https://www.linkedin.com/in/sanjana-kotian-146982248/",
//     email: "kotiansanjana2@gmail.com",
//     messages: [
//       { sender: "founder", text: "Excited to scale Emcure globally.", time: "9:15 AM" },
//       { sender: "mentor", text: "Healthcare innovation needs strong infrastructure.", time: "9:18 AM" },
//       { sender: "founder", text: "Working on digital patient records integration.", time: "9:22 AM" },
//       { sender: "mentor", text: "Focus on compliance and scalability.", time: "9:25 AM" },
//       { sender: "founder", text: "Planning expansion roadmap next quarter.", time: "9:30 AM" }
//     ],
//   },
// ];

// /* ================= COMPONENT ================= */

// export default function Messages() {
//   const [search, setSearch] = useState("");
//   const [selected, setSelected] = useState(conversationsData[0]);
//   const [messages, setMessages] = useState(selected.messages);
//   const [message, setMessage] = useState("");
//   const [showProfile, setShowProfile] = useState(false);
//   const [showEmoji, setShowEmoji] = useState(false);
//   const [calling, setCalling] = useState(false);

//   const fileRef = useRef<HTMLInputElement>(null);
//   const bottomRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     setMessages(selected.messages);
//   }, [selected]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleSend = () => {
//     if (!message.trim()) return;
//     const newMsg = {
//       sender: "mentor",
//       text: message,
//       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//     };
//     setMessages([...messages, newMsg]);
//     setMessage("");
//   };

//   const handleFile = (e: any) => {
//     const file = e.target.files[0];
//     if (file) {
//       setMessages([...messages, { sender: "mentor", text: `📎 ${file.name}`, time: "Now" }]);
//     }
//   };

//   const emojis = ["😀","😂","😍","🔥","👍","🎉","❤️","😎","👏"];

//   const filtered = conversationsData.filter((c) =>
//     c.founder.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="h-[calc(100vh-4rem)] flex bg-white relative">

//       {/* LEFT PANEL */}
//       <div className="w-80 border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b">
//           <div className="relative">
//             <Search className="absolute left-3 top-3 text-gray-400" size={18} />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search conversations..."
//               className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
//             />
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {filtered.map((conv) => (
//             <button
//               key={conv.id}
//               onClick={() => setSelected(conv)}
//               className={`w-full p-4 flex gap-3 text-left hover:bg-gray-50 ${
//                 selected.id === conv.id ? "bg-purple-50" : ""
//               }`}
//             >
//               <div className="relative">
//                 <ImageWithFallback
//                   src={conv.photo}
//                   alt=""
//                   className="w-12 h-12 rounded-full"
//                 />
//                 {conv.online && (
//                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
//                 )}
//               </div>
//               <div>
//                 <p className="font-medium">{conv.founder}</p>
//                 <p className="text-sm text-gray-500">{conv.startup}</p>
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* CHAT PANEL */}
//       <div className="flex-1 flex flex-col">
//         <div className="p-4 border-b flex items-center gap-4">
//           <ImageWithFallback
//             src={selected.photo}
//             alt=""
//             className="w-12 h-12 rounded-full cursor-pointer"
//             onClick={() => setShowProfile(true)}
//           />
//           <div>
//             <h2 className="font-medium">{selected.founder}</h2>
//             <div className="flex items-center gap-2 text-sm text-gray-500">
//               {selected.online && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
//               {selected.online ? "Available" : "Offline"}
//             </div>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
//           {messages.map((msg, i) => (
//             <div key={i} className={`flex ${msg.sender === "mentor" ? "justify-end" : "justify-start"}`}>
//               <div className={`max-w-md px-4 py-3 rounded-2xl ${
//                 msg.sender === "mentor"
//                   ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
//                   : "bg-white border"
//               }`}>
//                 {msg.text}
//                 <div className="text-xs opacity-70 mt-1">{msg.time}</div>
//               </div>
//             </div>
//           ))}
//           <div ref={bottomRef}></div>
//         </div>

      //   {/* INPUT */}
      //   <div className="p-4 border-t bg-white relative">
      //     <div className="flex gap-3 items-center">
      //       <input type="file" ref={fileRef} onChange={handleFile} className="hidden" />
      //       <button onClick={() => fileRef.current?.click()}><Paperclip size={20} /></button>
      //       <button onClick={() => setShowEmoji(!showEmoji)}><Smile size={20} /></button>
      //       <input
      //         value={message}
      //         onChange={(e) => setMessage(e.target.value)}
      //         onKeyDown={(e) => e.key === "Enter" && handleSend()}
      //         placeholder="Type message..."
      //         className="flex-1 px-4 py-2 border rounded-lg"
      //       />
      //       <button
      //         onClick={handleSend}
      //         className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg"
      //       >
      //         <Send size={20} />
      //       </button>
      //     </div>

      //     {showEmoji && (
      //       <div className="absolute bottom-16 left-4 bg-white border rounded-xl p-3 shadow-lg grid grid-cols-5 gap-2">
      //         {emojis.map((e) => (
      //           <button key={e} onClick={() => setMessage((m) => m + e)}>
      //             {e}
      //           </button>
      //         ))}
      //       </div>
      //     )}
      //   </div>
      // </div>

//       {/* PROFILE PANEL */}
//       <div className={`absolute top-0 right-0 h-full w-80 bg-white border-l shadow-xl transform transition-transform duration-300 ${
//         showProfile ? "translate-x-0" : "translate-x-full"
//       }`}>
//         <div className="p-6 flex justify-between">
//           <h3 className="font-semibold">Contact Info</h3>
//           <button onClick={() => setShowProfile(false)}><X /></button>
//         </div>

//         <div className="flex flex-col items-center gap-3 p-6">
//           <ImageWithFallback src={selected.photo} alt="" className="w-28 h-28 rounded-full" />
//           <h2 className="text-lg font-semibold">{selected.founder}</h2>
//           <p className="text-gray-500">{selected.startup}</p>

//           <button
//             onClick={() => setCalling(true)}
//             className="mt-4 px-6 py-2 border rounded-lg flex items-center gap-2"
//           >
//             <Phone size={16} /> Call
//           </button>

//           <div className="mt-6 text-center">
//             <p className="font-medium mb-2">About</p>
//             <p className="text-sm text-gray-600">{selected.bio}</p>
//           </div>

//           <div className="mt-6 w-full text-sm space-y-2">
//             <p>
//               <strong>LinkedIn:</strong>{" "}
//               <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
//                 {selected.linkedin}
//               </a>
//             </p>
//             <p>
//               <strong>Email:</strong>{" "}
//               <a href={`mailto:${selected.email}`} className="text-purple-600 hover:underline">
//                 {selected.email}
//               </a>
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* CALL MODAL */}
//       {calling && (
//         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white p-8 rounded-2xl text-center">
//             <div className="w-20 h-20 rounded-full bg-purple-200 mx-auto animate-pulse mb-4"></div>
//             <h2 className="text-xl font-semibold">Calling {selected.founder}...</h2>
//             <p className="text-gray-500">Connecting...</p>
//             <button
//               onClick={() => setCalling(false)}
//               className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg"
//             >
//               End Call
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Search, X, Phone } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";


/* ================= DATA ================= */

const conversationsData = [
  {
    id: 1,
    founder: "Sanjana Kotian",
    startup: "Emcure",
    photo: "src/assets/profpic.jpg",
    online: true,
    bio: "Founder of Emcure — focused on innovative healthcare solutions combining digital systems and patient-centered design.",
    linkedin: "https://www.linkedin.com/in/sanjana-kotian-146982248/",
    email: "kotiansanjana2@gmail.com",
    messages: [
      { sender: "founder", text: "Excited to scale Emcure globally.", time: "9:15 AM" },
      { sender: "mentor", text: "Healthcare innovation needs strong infrastructure.", time: "9:18 AM" },
    ],
  },
  {
    id: 2,
    founder: "Priya Sharma",
    startup: "HealthSync",
    photo:
      "https://images.unsplash.com/photo-1573165706511-3ffde6ef1fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    online: false,
    bio: "Founder of HealthSync — AI-powered preventive healthcare monitoring platform.",
    linkedin: "https://linkedin.com",
    email: "priya@healthsync.io",
    messages: [
      { sender: "founder", text: "Can we reschedule?", time: "9:00 AM" },
      { sender: "mentor", text: "Yes, tomorrow works.", time: "9:02 AM" },
      { sender: "founder", text: "Great, thank you!", time: "9:03 AM" },
    ],
  },
  {
    id: 3,
    founder: "Hemangi Purkar",
    startup: "TechBridge Academy",
    photo:
      "src/assets/hp.jpeg",
    online: true,
    bio: "Building inclusive tech education programs for underrepresented communities.",
    linkedin: "https://linkedin.com",
    email: "sofia@techbridge.com",
    messages: [
      { sender: "founder", text: "Curriculum updated!", time: "8:20 AM" },
      { sender: "mentor", text: "Impressive progress.", time: "8:25 AM" },
    ],
  },
  {
    id: 4,
    founder: "Swapnali Kadam",
    startup: "FoodChain",
    photo:
      "src/assets/sw.png",
    online: false,
    bio: "Optimizing food supply chains using data-driven sustainability models.",
    linkedin: "https://linkedin.com",
    email: "lisa@foodchain.io",
    messages: [
      { sender: "founder", text: "Financials updated.", time: "Yesterday" },
      { sender: "mentor", text: "I’ll review tonight.", time: "Yesterday" },
    ],
  },
  {
    id: 5,
    founder: "Emma Chen",
    startup: "EcoBox",
    photo:
      "https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    online: true,
    bio: "Founder of EcoBox — building sustainable packaging solutions for D2C brands focused on circular economy innovation.",
    linkedin: "https://linkedin.com",
    email: "emma@ecobox.com",
    messages: [
      { sender: "founder", text: "Hi Sarah! Excited for tomorrow.", time: "10:10 AM" },
      { sender: "mentor", text: "Looking forward to it too, Emma.", time: "10:12 AM" },
      { sender: "founder", text: "I’ll share updated numbers.", time: "10:14 AM" },
      { sender: "mentor", text: "Perfect. We’ll refine strategy.", time: "10:15 AM" },
      { sender: "founder", text: "Thanks for the guidance!", time: "10:16 AM" },
    ],
  },
];

/* ================= COMPONENT ================= */

export default function Messages() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(conversationsData[0]);
  const [messages, setMessages] = useState(selected.messages);
  const [message, setMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [calling, setCalling] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showSchedule, setShowSchedule] = useState(false);
const [meetingDate, setMeetingDate] = useState("");

  useEffect(() => {
    setMessages(selected.messages);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      {
        sender: "mentor",
        text: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setMessage("");
  };

  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setMessages([
        ...messages,
        { sender: "mentor", text: `📎 ${file.name}`, time: "Now" },
      ]);
    }
  };

  const emojis = ["😀","😂","😍","🔥","👍","🎉","❤️","😎","👏"];

  const filtered = conversationsData.filter((c) =>
    c.founder.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white relative">

      {/* LEFT PANEL */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`w-full p-4 flex gap-3 text-left hover:bg-gray-50 ${
                selected.id === conv.id ? "bg-purple-50" : ""
              }`}
            >
              <div className="relative">
                <ImageWithFallback
                  src={conv.photo}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
               <p className="font-medium text-black">{conv.founder}</p>
<p className="text-sm text-black">{conv.startup}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center gap-4">
          <ImageWithFallback
            src={selected.photo}
            alt=""
            className="w-12 h-12 rounded-full cursor-pointer"
            onClick={() => setShowProfile(true)}
          />
          <div>
           <h2 className="font-medium text-black">{selected.founder}</h2>

<div className="flex items-center gap-2 text-sm text-black">
              {selected.online && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
              {selected.online ? "Active Now" : "Offline"}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.sender === "mentor" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-2xl ${
                  msg.sender === "mentor"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-white border text-black"
                }`}
              >
                {msg.text}
                <div className="text-xs opacity-70 mt-1">{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

       {/* INPUT */}
        <div className="p-4 border-t bg-white relative">
          <div className="flex gap-3 items-center">
            <input type="file" ref={fileRef} onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="text-black"><Paperclip size={20} /></button>
            <button onClick={() => setShowEmoji(!showEmoji)} className="text-black"><Smile size={20} /></button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Search conversations..."
  style={{ backgroundColor: "#ffffff", color: "#000000" }}
  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"

            />
            
          </div>

          {showEmoji && (
            <div className="absolute bottom-16 left-4 bg-white border rounded-xl p-3 shadow-lg grid grid-cols-5 gap-2">
              {emojis.map((e) => (
                <button key={e} onClick={() => setMessage((m) => m + e)}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PROFILE PANEL */}
      <div
        className={`absolute top-0 right-0 h-full w-80 bg-white border-l shadow-2xl transform transition-transform duration-300 ${
          showProfile ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white relative">
          <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4">
            <X />
          </button>

          <div className="flex flex-col items-center mt-6">
            <div className="relative">
              <ImageWithFallback
                src={selected.photo}
                alt=""
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
              {selected.online && (
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              )}
            </div>
            <h2 className="text-xl font-semibold mt-4">{selected.founder}</h2>
            <p className="text-sm opacity-90">{selected.startup}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <button
            onClick={() => setCalling(true)}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl"
          >
            Call {selected.founder}
          </button>

          <div>
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-sm text-gray-600">{selected.bio}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <strong>LinkedIn:</strong>{" "}
              <a
                href={selected.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                {selected.linkedin}
              </a>
            </div>
            <div>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${selected.email}`}
                className="text-purple-600 hover:underline"
              >
                {selected.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CALL MODAL */}
      {calling && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl w-96">
            <div className="relative flex justify-center items-center">
              <div className="absolute w-36 h-36 rounded-full bg-purple-300 animate-ping opacity-30"></div>
              <ImageWithFallback
                src={selected.photo}
                alt=""
                className="w-28 h-28 rounded-full border-4 border-purple-500 shadow-lg"
              />
            </div>

            <h2 className="text-xl font-semibold mt-6">
              Calling {selected.founder}...
            </h2>

            <p className="text-gray-500 mt-2">Connecting...</p>

            <button
              onClick={() => setCalling(false)}
              className="mt-6 px-8 py-2 bg-red-500 text-white rounded-full"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}