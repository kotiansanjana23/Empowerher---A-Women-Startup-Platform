
import { useState, useEffect } from "react";
import {
  FileText, Download, Check, X, TrendingUp, DollarSign,
  Video, BarChart3, Loader2, RefreshCw, Eye,
  Building2, Calendar, Mail, Award, Link2, UserCheck,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { db, auth } from "../../../../../../firebase";
import {
  collection, onSnapshot, doc, updateDoc, setDoc,
  query, where, serverTimestamp, addDoc,getDoc,
} from "firebase/firestore";

/* ─────────────────────────── Types ─────────────────────────── */
interface FundingRequest {
  id: string;
  // Founder identity
  founderId: string;
  founderName: string;
  founderEmail: string;
  founderPhoto: string;
  // Startup info
  startupName: string;
  startupStage: string;
  fundingAmountRequested: string;
  // Pitch content
  problemStatement: string;
  solution: string;
  whyYouQualify: string;
  // Opportunity
  opportunityId: string;
  opportunityTitle: string;
  organization: string;
  amount: string;
  // Investor
  investorId: string;
  investorName: string;
  investorEmail: string;
  investorPhoto: string;
  // Documents
  deckURL?: string;
  financialURL?: string;
  videoURL?: string;
  // Meta
  submittedDate: string;
  createdAt: any;
  status: string;
}

/* ─────────────────────────── Helpers ─────────────────────────── */
const STATUS_STYLES: Record<string, string> = {
  "Pending":      "bg-orange-100 text-orange-700 border-orange-200",
  "Under Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress":  "bg-blue-100 text-blue-700 border-blue-200",
  "Interested":   "bg-purple-100 text-purple-700 border-purple-200",
  "Connected":    "bg-green-100 text-green-700 border-green-200",
  "Rejected":     "bg-red-100 text-red-700 border-red-200",
};

const INVESTOR_STATUSES = ["Under Review", "In Progress", "Interested", "Connected", "Rejected"];

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] || "bg-gray-100 text-gray-700 border-gray-200";
  return <Badge className={`${cls} border text-xs font-semibold`}>{status}</Badge>;
}

function getInitials(name: string) {
  return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";
}

/* ─────────────────────────── Main Component ─────────────────────────── */
export default function FundingRequests() {
  const [requests, setRequests]     = useState<FundingRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedReq, setSelectedReq] = useState<FundingRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<"all" | "pending" | "reviewing" | "decided">("all");
  const [connections, setConnections] = useState<string[]>([]); // founderIds already connected

  /* ── Real-time: load ONLY this investor's requests ── */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    // Listen to fundingRequests where investorId === this investor
    const q = query(
      collection(db, "fundingRequests"),
      where("investorId", "==", user.uid)
    );

const unsub = onSnapshot(q, async (snap) => {
  const reqs = await Promise.all(
    snap.docs.map(async (d) => {
      const data = { id: d.id, ...d.data() } as FundingRequest;
      if (!data.founderPhoto && data.founderId) {
        try {
          const founderSnap = await getDoc(doc(db, "founders", data.founderId));
          if (founderSnap.exists()) {
            data.founderPhoto = founderSnap.data()?.profilePhoto
              || founderSnap.data()?.photoURL
              || founderSnap.data()?.photo
              || "";
          }
        } catch (_) {}
      }
      return data;
    })
  );
      // Sort newest first (createdAt may be null briefly after write)
      reqs.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setRequests(reqs);
      setLoading(false);
    }, (err) => {
      console.error("Firestore fundingRequests error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ── Real-time: load existing connections for this investor ── */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "connections"),
      where("investorId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setConnections(snap.docs.map(d => (d.data() as any).founderId));
    });

    return () => unsub();
  }, []);

  /* ── Update status ── */
  const updateStatus = async (reqId: string, newStatus: string) => {
    setUpdatingId(reqId);
    try {
      await updateDoc(doc(db, "fundingRequests", reqId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // If CONNECTED → also write to connections collection
 if (newStatus === "Connected") {
  const req = requests.find(r => r.id === reqId);
  if (req) {
    // existing connections collection
    await setDoc(doc(db, "connections", `${req.investorId}_${req.founderId}`), {
      founderId:        req.founderId,
      founderName:      req.founderName,
      founderEmail:     req.founderEmail,
      founderPhoto:     req.founderPhoto,
      investorId:       req.investorId,
      investorName:     req.investorName,
      investorEmail:    req.investorEmail,
      investorPhoto:    req.investorPhoto,
      startupName:      req.startupName,
      connectionStatus: "Connected",
      connectedAt:      serverTimestamp(),
    });

    // NEW: write to investorConnections so founder dashboard shows this investor
    await setDoc(doc(db, "investorConnections", `${req.investorId}_${req.founderId}`), {
      founderId:        req.founderId,
      founderName:      req.founderName,
      founderEmail:     req.founderEmail,
      founderPhoto:     req.founderPhoto,
      investorId:       req.investorId,
      investorName:     req.investorName,
      investorEmail:    req.investorEmail,
      investorPhoto:    req.investorPhoto,
      organization:     req.organization    || "",
      opportunityTitle: req.opportunityTitle || req.startupName || "Funding Opportunity",
      status:           "accepted",
      connectedAt:      serverTimestamp(),
    });
  }
}

      // Update modal if open
      if (selectedReq?.id === reqId) {
        setSelectedReq(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Filtered view ── */
  const filtered = requests.filter(req => {
    if (activeTab === "pending")   return req.status === "Pending" || req.status === "Under Review";
    if (activeTab === "reviewing") return req.status === "In Progress" || req.status === "Interested";
    if (activeTab === "decided")   return req.status === "Connected" || req.status === "Rejected";
    return true;
  });

  /* ── Summary counts ── */
  const counts = {
    total:     requests.length,
    pending:   requests.filter(r => r.status === "Pending" || r.status === "Under Review").length,
    reviewing: requests.filter(r => r.status === "In Progress" || r.status === "Interested").length,
    connected: requests.filter(r => r.status === "Connected").length,
    rejected:  requests.filter(r => r.status === "Rejected").length,
  };

  /* ─────────── Loading ─────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading funding requests...</p>
      </div>
    );
  }

  /* ─────────── Main render ─────────── */
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funding Requests</h1>
          <p className="text-gray-500 mt-1">
            Real-time requests from founders — {requests.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-purple-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live updates
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 border-none text-white">
          <FileText className="w-7 h-7 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Total Requests</p>
          <p className="text-3xl font-bold mt-1">{counts.total}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-yellow-500 to-orange-500 border-none text-white">
          <RefreshCw className="w-7 h-7 mb-2 opacity-80" />
          <p className="text-yellow-100 text-sm">Awaiting Review</p>
          <p className="text-3xl font-bold mt-1">{counts.pending}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-500 to-indigo-500 border-none text-white">
          <TrendingUp className="w-7 h-7 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">In Progress</p>
          <p className="text-3xl font-bold mt-1">{counts.reviewing}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-500 to-emerald-600 border-none text-white">
          <UserCheck className="w-7 h-7 mb-2 opacity-80" />
          <p className="text-green-100 text-sm">Connected</p>
          <p className="text-3xl font-bold mt-1">{counts.connected}</p>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-purple-100 pb-1">
        {(["all", "pending", "reviewing", "decided"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg capitalize transition-all ${
              activeTab === tab
                ? "text-purple-700 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-purple-600"
            }`}
          >
            {tab === "all"       ? `All (${counts.total})`
            : tab === "pending"  ? `Awaiting (${counts.pending})`
            : tab === "reviewing"? `In Progress (${counts.reviewing})`
            : `Decided (${counts.connected + counts.rejected})`}
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-16 h-16 text-purple-200 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">No funding requests yet</h3>
          <p className="text-gray-400 mt-1">
            {requests.length === 0
              ? "When founders apply to your opportunities, they'll appear here in real time."
              : "No requests match this filter."}
          </p>
        </div>
      )}

      {/* ── Request Cards ── */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Card
              key={req.id}
              className="p-5 hover:shadow-md transition-shadow border border-purple-50 bg-white/80 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">

                {/* Founder Avatar */}
                <div className="flex-shrink-0">
                  {req.founderPhoto ? (
                    <img src={req.founderPhoto} alt={req.founderName}
                      className="w-12 h-12 rounded-xl object-cover border border-purple-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(req.founderName || req.startupName)}
                    </div>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {req.startupName || "Unnamed Startup"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        <span className="font-medium text-purple-600">{req.founderName}</span>
                        {req.founderEmail && <> · {req.founderEmail}</>}
                      </p>
                    </div>
                    <StatusBadge status={req.status || "Pending"} />
                  </div>

                  {/* Opportunity */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-medium text-purple-700">{req.opportunityTitle}</span>
                    {req.organization && <> · <Building2 className="w-3 h-3" /> {req.organization}</>}
                  </div>

                  {/* Key details */}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {req.fundingAmountRequested && (
                      <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-semibold">{req.fundingAmountRequested}</span>
                      </div>
                    )}
                    {req.startupStage && (
                      <div className="flex items-center gap-1.5 bg-pink-50 text-pink-700 px-3 py-1 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-semibold">{req.startupStage}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Submitted {req.submittedDate}</span>
                    </div>
                  </div>

                  {/* Connected badge */}
                  {req.status === "Connected" && (
                    <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm font-medium w-fit">
                      <Link2 className="w-4 h-4" />
                      Connected with {req.founderName}
                    </div>
                  )}

                  {/* Document links */}
                  {(req.deckURL || req.financialURL || req.videoURL) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {req.deckURL && (
                        <a href={req.deckURL} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">
                          <FileText className="w-3 h-3" /> Pitch Deck
                        </a>
                      )}
                      {req.financialURL && (
                        <a href={req.financialURL} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-full transition-colors">
                          <BarChart3 className="w-3 h-3" /> Financials
                        </a>
                      )}
                      {req.videoURL && (
                        <a href={req.videoURL} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full transition-colors">
                          <Video className="w-3 h-3" /> Video Pitch
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 text-xs"
                    onClick={() => { setSelectedReq(req); setReviewOpen(true); }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Review
                  </Button>

                  {req.status !== "Connected" && req.status !== "Rejected" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(req.id, "Connected")}
                        disabled={updatingId === req.id}
                        title="Accept & Connect"
                        className="flex-1 p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
                      >
                        {updatingId === req.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          : <Check className="w-3.5 h-3.5 mx-auto" />}
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "Rejected")}
                        disabled={updatingId === req.id}
                        title="Reject"
                        className="flex-1 p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════════════ REVIEW MODAL ══════════════════ */}
      {reviewOpen && selectedReq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-purple-100 p-6 flex items-start justify-between z-10 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Review</h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  {selectedReq.opportunityTitle} · {selectedReq.organization}
                </p>
              </div>
              <button
                onClick={() => setReviewOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* ── Founder Identity Card ── */}
              <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                {selectedReq.founderPhoto ? (
                  <img src={selectedReq.founderPhoto} alt={selectedReq.founderName}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {getInitials(selectedReq.founderName)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedReq.founderName}</h3>
                      <p className="text-purple-600 font-semibold">{selectedReq.startupName}</p>
                    </div>
                    <StatusBadge status={selectedReq.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                    {selectedReq.founderEmail && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-purple-400" />
                        <a href={`mailto:${selectedReq.founderEmail}`} className="text-purple-600 hover:underline">
                          {selectedReq.founderEmail}
                        </a>
                      </div>
                    )}
                  </div>
                  {/* Connected badge in modal */}
                  {selectedReq.status === "Connected" && (
                    <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm font-semibold w-fit">
                      <Link2 className="w-4 h-4" />
                      Connected with this Founder
                    </div>
                  )}
                </div>
              </div>

              {/* ── Key Metrics ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <DollarSign className="w-5 h-5 text-purple-500 mb-1" />
                  <p className="text-xs text-gray-500">Funding Requested</p>
                  <p className="text-lg font-bold text-purple-700">{selectedReq.fundingAmountRequested || "—"}</p>
                </div>
                <div className="p-4 rounded-xl bg-pink-50 border border-pink-100">
                  <TrendingUp className="w-5 h-5 text-pink-500 mb-1" />
                  <p className="text-xs text-gray-500">Startup Stage</p>
                  <p className="text-lg font-bold text-pink-700">{selectedReq.startupStage || "—"}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <Calendar className="w-5 h-5 text-blue-500 mb-1" />
                  <p className="text-xs text-gray-500">Date Submitted</p>
                  <p className="text-lg font-bold text-blue-700">{selectedReq.submittedDate || "—"}</p>
                </div>
              </div>

              {/* ── Pitch Content ── */}
              <div className="space-y-4">
                <SectionBlock title="Problem Statement" content={selectedReq.problemStatement} color="purple" />
                <SectionBlock title="Proposed Solution"  content={selectedReq.solution}          color="pink"   />
                <SectionBlock title="Why They Qualify"   content={selectedReq.whyYouQualify}     color="blue"   />
              </div>

              {/* ── Documents ── */}
              {(selectedReq.deckURL || selectedReq.financialURL || selectedReq.videoURL) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Submitted Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedReq.deckURL && (
                      <DocumentCard icon={<FileText className="w-6 h-6 text-blue-500" />}
                        label="Pitch Deck" url={selectedReq.deckURL} bgColor="bg-blue-50" borderColor="border-blue-100" />
                    )}
                    {selectedReq.financialURL && (
                      <DocumentCard icon={<BarChart3 className="w-6 h-6 text-green-500" />}
                        label="Financial Model" url={selectedReq.financialURL} bgColor="bg-green-50" borderColor="border-green-100" />
                    )}
                    {selectedReq.videoURL && (
                      <DocumentCard icon={<Video className="w-6 h-6 text-purple-500" />}
                        label="Video Pitch" url={selectedReq.videoURL} bgColor="bg-purple-50" borderColor="border-purple-100" />
                    )}
                  </div>
                </div>
              )}

              {/* ── Status Update ── */}
              <div className="border-t border-purple-100 pt-5">
                <h4 className="font-semibold text-gray-900 mb-3">Update Request Status</h4>
                <div className="flex flex-wrap gap-2 mb-5">
                  {INVESTOR_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedReq.id, status)}
                      disabled={updatingId === selectedReq.id || selectedReq.status === status}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        selectedReq.status === status
                          ? (STATUS_STYLES[status] || "") + " border opacity-100 ring-2 ring-offset-1 ring-purple-400"
                          : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 disabled:opacity-50"
                      }`}
                    >
                      {updatingId === selectedReq.id && selectedReq.status !== status
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                        : null}
                      {status}
                    </button>
                  ))}
                </div>

                {/* Primary action buttons */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={updatingId === selectedReq.id || selectedReq.status === "Connected"}
                    onClick={() => updateStatus(selectedReq.id, "Connected")}
                  >
                    {updatingId === selectedReq.id
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <Check className="w-4 h-4 mr-2" />}
                    Accept & Connect
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    disabled={updatingId === selectedReq.id || selectedReq.status === "Interested"}
                    onClick={() => updateStatus(selectedReq.id, "Interested")}
                  >
                    Mark Interested
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={updatingId === selectedReq.id || selectedReq.status === "Rejected"}
                    onClick={() => updateStatus(selectedReq.id, "Rejected")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function SectionBlock({ title, content, color }: {
  title: string; content: string; color: "purple" | "pink" | "blue"
}) {
  const colors   = { purple: "border-purple-100 bg-purple-50/50", pink: "border-pink-100 bg-pink-50/50", blue: "border-blue-100 bg-blue-50/50" };
  const tColors  = { purple: "text-purple-700", pink: "text-pink-700", blue: "text-blue-700" };
  if (!content) return null;
  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <h4 className={`font-semibold text-sm mb-2 ${tColors[color]}`}>{title}</h4>
      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function DocumentCard({ icon, label, url, bgColor, borderColor }: {
  icon: React.ReactNode; label: string; url: string; bgColor: string; borderColor: string;
}) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-xl border ${bgColor} ${borderColor} hover:shadow-sm transition-all group`}>
      {icon}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-400 truncate">Click to open</p>
      </div>
      <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
    </a>
  );
}