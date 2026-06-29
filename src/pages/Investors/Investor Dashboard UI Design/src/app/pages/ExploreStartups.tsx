import { useState, useRef } from "react";
import { Search, Filter, TrendingUp, MapPin, DollarSign, Heart, X, Send, Paperclip, Smile, Calendar, MessageCircle, BadgeDollarSign } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { startups } from "../data/mockData";
import { useInvestorNav } from "../context/NavigationContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type Startup = (typeof startups)[number];

interface ChatMessage {
  id: number;
  sender: "investor" | "founder";
  text?: string;
  fileName?: string;
  fileUrl?: string;
  emoji?: string;
  timestamp: string;
}

// ─── Emoji Picker (simple inline) ─────────────────────────────────────────────
const EMOJIS = ["😊","👍","🎉","🚀","💡","💰","🤝","❤️","🔥","✅","💬","📈","🌟","👏","😄"];

function EmojiPicker({ onSelect }: { onSelect: (e: string) => void }) {
  return (
    <div className="absolute bottom-12 left-0 bg-white border border-purple-100 rounded-xl shadow-xl p-3 z-50 w-64 flex flex-wrap gap-2">
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
      ))}
    </div>
  );
}

// ─── Meeting Modal ─────────────────────────────────────────────────────────────
function MeetingModal({ startup, onClose }: { startup: Startup; onClose: () => void }) {
  const [form, setForm] = useState({ date: "", time: "", agenda: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.date || !form.time) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-purple-100">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-white font-semibold text-lg">Request Meeting</h2>
              <p className="text-purple-100 text-sm">{startup.name} · {startup.founder}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Meeting Requested!</h3>
            <p className="text-gray-500 text-sm">
              Your meeting request has been sent to <span className="font-semibold text-purple-700">{startup.founder}</span> for{" "}
              <span className="font-semibold">{form.date}</span> at <span className="font-semibold">{form.time}</span>.
              <br />You'll receive a confirmation shortly.
            </p>
            <Button
              className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white text-gray-900"                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Time *</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white text-gray-900"                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Meeting Agenda (optional)</label>
              <textarea
                rows={3}
                value={form.agenda}
                onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                placeholder="What would you like to discuss?"
className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 resize-none bg-white text-gray-900"              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleSubmit}
                disabled={!form.date || !form.time}
              >
                Send Request
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat Popup ────────────────────────────────────────────────────────────────
function ChatPopup({ startup, onClose }: { startup: Startup; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "founder",
      text: `Hi! I'm ${startup.founder}. Thanks for your interest in ${startup.name}. How can I help you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = (extra?: Partial<ChatMessage>) => {
    if (!input.trim() && !extra) return;
    const msg: ChatMessage = {
      id: Date.now(),
      sender: "investor",
      text: input.trim() || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...extra,
    };
    setMessages(prev => [...prev, msg]);
    setInput("");
    setShowEmoji(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    send({ text: undefined, fileName: file.name, fileUrl: url });
    e.target.value = "";
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col z-50 overflow-hidden" style={{ height: 520 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-sm">
            {startup.founder.charAt(0)}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{startup.founder}</p>
            <p className="text-purple-100 text-xs">{startup.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-purple-50/30">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === "investor" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
              msg.sender === "investor"
                ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-sm"
                : "bg-white text-gray-800 border border-purple-100 rounded-bl-sm"
            }`}>
              {msg.text && <p>{msg.text}</p>}
              {msg.fileName && (
                <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-1.5 underline">
                  <Paperclip className="w-3 h-3" /> {msg.fileName}
                </a>
              )}
              <p className={`text-xs mt-1 ${msg.sender === "investor" ? "text-purple-200" : "text-gray-400"}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-purple-100 bg-white shrink-0">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message..."
className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 pr-10 bg-white text-gray-900"            />
            {showEmoji && <EmojiPicker onSelect={addEmoji} />}
          </div>
          <button onClick={() => setShowEmoji(v => !v)} className="p-2 hover:bg-purple-50 rounded-lg transition-all text-gray-400 hover:text-purple-600">
            <Smile className="w-5 h-5" />
          </button>
          <button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-purple-50 rounded-lg transition-all text-gray-400 hover:text-purple-600">
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white disabled:opacity-40 hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}

// ─── Funding Modal ─────────────────────────────────────────────────────────────
function FundingModal({ startup, onClose }: { startup: Startup; onClose: () => void }) {
  const [form, setForm] = useState({
    minAmount: "",
    maxAmount: "",
    equity: "",
    investmentType: "Equity",
    terms: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const investmentTypes = ["Equity", "Convertible Note", "SAFE", "Revenue Share", "Debt"];

  const handleSubmit = () => {
    if (!form.minAmount || !form.maxAmount || !form.equity) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-purple-100 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <BadgeDollarSign className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-white font-semibold text-lg">Express Funding Interest</h2>
              <p className="text-purple-100 text-sm">{startup.name} · {startup.fundingStage}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Interest Submitted!</h3>
            <p className="text-gray-500 text-sm">
              Your funding interest of{" "}
              <span className="font-semibold text-purple-700">${Number(form.minAmount).toLocaleString()}–${Number(form.maxAmount).toLocaleString()}</span>{" "}
              for <span className="font-semibold">{form.equity}% equity</span> has been sent to{" "}
              <span className="font-semibold">{startup.founder}</span>. Expect to hear back within 2–3 business days.
            </p>
            <Button
              className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Startup asking info */}
            <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-4">
              <img src={(startup as any).logo} alt={startup.name} className="w-12 h-12 rounded-lg border border-purple-100" />
              <div>
                <p className="font-semibold text-gray-900">{startup.name}</p>
                <p className="text-sm text-purple-600">{startup.fundingStage} · Seeking ${((startup as any).fundingNeeded / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500">{(startup as any).location}</p>
              </div>
            </div>

            {/* Investment Range */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Investment Range (USD) *</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Min (e.g. 50000)"
                    value={form.minAmount}
                    onChange={e => setForm(f => ({ ...f, minAmount: e.target.value }))}
className="w-full border border-purple-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white text-gray-900"                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Max (e.g. 200000)"
                    value={form.maxAmount}
                    onChange={e => setForm(f => ({ ...f, maxAmount: e.target.value }))}
className="w-full border border-purple-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white text-gray-900"                  />
                </div>
              </div>
            </div>

            {/* Equity */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Equity Sought (%) *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="e.g. 10"
                  value={form.equity}
                  onChange={e => setForm(f => ({ ...f, equity: e.target.value }))}
className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white text-gray-900"                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>

            {/* Investment Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Investment Type</label>
              <div className="flex flex-wrap gap-2">
                {investmentTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setForm(f => ({ ...f, investmentType: type }))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      form.investmentType === type
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
                        : "border-purple-200 text-purple-700 hover:bg-purple-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Additional Terms (optional)</label>
              <input
                type="text"
                placeholder="e.g. Board seat, pro-rata rights, milestone-based..."
                value={form.terms}
                onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white text-gray-900"              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Message to Founder (optional)</label>
              <textarea
                rows={3}
                placeholder="Why are you interested in this startup? What value do you bring?"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 resize-none bg-white text-gray-900"              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleSubmit}
                disabled={!form.minAmount || !form.maxAmount || !form.equity}
              >
                Submit Interest
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ExploreStartups() {
  const { navigate } = useInvestorNav();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [interestedStartups, setInterestedStartups] = useState<number[]>([]);

  // Modal states
  const [meetingStartup, setMeetingStartup] = useState<Startup | null>(null);
  const [chatStartup, setChatStartup] = useState<Startup | null>(null);
  const [fundingStartup, setFundingStartup] = useState<Startup | null>(null);

  const industries = [...new Set(startups.map(s => s.industry))];
  const fundingStages = [...new Set(startups.map(s => s.fundingStage))];

  const filteredStartups = startups.filter(startup => {
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         startup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         startup.founder.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustries.length === 0 || selectedIndustries.includes(startup.industry);
    const matchesStage = selectedStages.length === 0 || selectedStages.includes(startup.fundingStage);
    return matchesSearch && matchesIndustry && matchesStage;
  });

  const toggleInterested = (id: number) => {
    setInterestedStartups(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      {meetingStartup && <MeetingModal startup={meetingStartup} onClose={() => setMeetingStartup(null)} />}
      {fundingStartup && <FundingModal startup={fundingStartup} onClose={() => setFundingStartup(null)} />}
      {chatStartup && <ChatPopup startup={chatStartup} onClose={() => setChatStartup(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explore Startups</h1>
        <p className="text-gray-500 mt-1">Discover amazing women-led startups seeking investment</p>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-white/70 backdrop-blur-sm border border-purple-100">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by startup name, founder, or description..."
              className="pl-10 bg-white border-purple-200 focus:border-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="p-6 bg-white/70 backdrop-blur-sm border border-purple-100 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-sm text-gray-900 mb-3">Industry</h4>
            <div className="space-y-2">
              {industries.map((industry) => (
                <label key={industry} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedIndustries.includes(industry)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIndustries([...selectedIndustries, industry]);
                      else setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
                    }}
                  />
                  <span className="text-sm text-gray-700">{industry}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-sm text-gray-900 mb-3">Funding Stage</h4>
            <div className="space-y-2">
              {fundingStages.map((stage) => (
                <label key={stage} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedStages.includes(stage)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedStages([...selectedStages, stage]);
                      else setSelectedStages(selectedStages.filter(s => s !== stage));
                    }}
                  />
                  <span className="text-sm text-gray-700">{stage}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => { setSelectedIndustries([]); setSelectedStages([]); setSearchQuery(""); }}
          >
            Clear All Filters
          </Button>
        </Card>

        {/* Startup Cards */}
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-700">{filteredStartups.length}</span> startups
            </p>
            <div className="flex gap-2">
              <Badge className="bg-purple-100 text-purple-700 border-none">Most Relevant</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredStartups.map((startup) => (
              <Card
                key={startup.id}
                className="p-6 bg-white/70 backdrop-blur-sm border border-purple-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img src={(startup as any).logo} alt={startup.name} className="w-14 h-14 rounded-lg border-2 border-purple-100" />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{startup.name}</h3>
                        <p className="text-sm text-gray-500">{startup.founder}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleInterested(startup.id); }}
                      className="p-2 rounded-lg hover:bg-pink-50 transition-all"
                    >
                      <Heart className={`w-5 h-5 ${interestedStartups.includes(startup.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`} />
                    </button>
                  </div>

                  {/* Founder Image */}
                  <img src={(startup as any).founderImage} alt={startup.founder} className="w-full h-32 object-cover rounded-lg" />

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">{startup.description}</p>

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-purple-100 text-purple-700 border-none">{startup.industry}</Badge>
                    <Badge className="bg-pink-100 text-pink-700 border-none">{startup.fundingStage}</Badge>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-500">Funding Needed</p>
                        <p className="text-sm font-semibold text-gray-900">${((startup as any).fundingNeeded / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Growth</p>
                        <p className="text-sm font-semibold text-green-600">{(startup as any).growthRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {(startup as any).location}
                  </div>

                  {/* Actions — 4 buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
  <Button
    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs px-2"
    onClick={() => navigate("startup-details", { startupId: String(startup.id) })}
  >
    View Pitch
  </Button>
  <Button
    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs px-2 border-none"
    onClick={(e) => { e.stopPropagation(); setMeetingStartup(startup); }}
  >
    <Calendar className="w-3.5 h-3.5 mr-1 text-white" />
    Request Meeting
  </Button>
  <Button
    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs px-2 border-none"
    onClick={(e) => { e.stopPropagation(); setChatStartup(startup); }}
  >
    <MessageCircle className="w-3.5 h-3.5 mr-1 text-white" />
    Contact Founder
  </Button>
  <Button
    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs px-2 border-none"
    onClick={(e) => { e.stopPropagation(); setFundingStartup(startup); }}
  >
    <BadgeDollarSign className="w-3.5 h-3.5 mr-1 text-white" />
    {interestedStartups.includes(startup.id) ? 'Funding ✓' : 'Interested Funding'}
  </Button>
</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}