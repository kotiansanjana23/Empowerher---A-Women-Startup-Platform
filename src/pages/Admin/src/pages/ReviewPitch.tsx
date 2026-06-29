import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { doc, getDoc, updateDoc } from "firebase/firestore";

import { db } from "../../../../firebase";

import { Button } from "../components/ui/button";

import { Badge } from "../components/ui/badge";

import { ArrowLeft, DollarSign, Building2, Layers3, Globe } from "lucide-react";

export function ReviewPitch() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [pitch, setPitch] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPitch();
  }, []);

  const fetchPitch = async () => {
    try {
      const docRef = doc(db, "pitches", id!);

      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        setPitch({
          id: snapshot.id,
          ...snapshot.data(),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updatePitchStatus = async (status: string) => {
    try {
      await updateDoc(doc(db, "pitches", pitch.id), { status });

      setPitch((prev: any) => ({
        ...prev,
        status,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading pitch...</div>;
  }

  if (!pitch) {
    return <div className="p-8">Pitch not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] p-6">
      {/* Back */}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-black mb-5 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero Card */}

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <Badge className="mb-4 bg-[#EEF2FF] text-[#4338CA] border-none px-4 py-1 rounded-full text-xs font-medium">
              {pitch.status || "Pending"}
            </Badge>

            <h1 className="text-3xl font-semibold text-black mb-3">
              {pitch.title}
            </h1>

            <p className="text-gray-500 text-base">
              Founder: {pitch.founderEmail}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              className="rounded-2xl px-6 py-5 text-sm font-medium border-none bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:opacity-90 text-white shadow-sm"
              onClick={() => updatePitchStatus("Approved")}
            >
              Approve Pitch
            </Button>

            <Button
              className="rounded-2xl px-6 py-5 text-sm font-medium border border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
              onClick={() => updatePitchStatus("Rejected")}
            >
              Reject Pitch
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-[#9333EA]" />

            <span className="text-gray-500 text-sm">Industry</span>
          </div>

          <h3 className="text-lg font-semibold text-black">
            {pitch.industry || "N/A"}
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Layers3 className="w-4 h-4 text-[#9333EA]" />

            <span className="text-gray-500 text-sm">Stage</span>
          </div>

          <h3 className="text-lg font-semibold text-black">
            {pitch.stage || "N/A"}
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-[#9333EA]" />

            <span className="text-gray-500 text-sm">Funding Goal</span>
          </div>

          <h3 className="text-lg font-semibold text-black">
            ₹ {pitch.fundingGoal || "N/A"}
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[#9333EA]" />

            <span className="text-gray-500 text-sm">Market Size</span>
          </div>

          <h3 className="text-lg font-semibold text-black">
            {pitch.marketSize || "N/A"}
          </h3>
        </div>
      </div>

      {/* Main Content */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Problem */}

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-black mb-4">
            Problem Statement
          </h2>

          <p className="text-gray-600 leading-7 text-base">
            {pitch.problem || "No problem statement"}
          </p>
        </div>

        {/* Solution */}

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-black mb-4">Solution</h2>

          <p className="text-gray-600 leading-7 text-base">
            {pitch.solution || "No solution"}
          </p>
        </div>
      </div>

      {/* Business Model */}

      <div className="bg-white border border-gray-200 rounded-3xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-black mb-4">
          Business Model
        </h2>

        <p className="text-gray-600 leading-7 text-base">
          {pitch.businessModel || "No business model"}
        </p>
      </div>

      {/* Documents */}

      <div className="bg-white border border-gray-200 rounded-3xl p-6 mt-6">
        <h2 className="text-xl font-semibold text-black mb-5">
          Pitch Documents
        </h2>

        <div className="flex flex-wrap gap-3">
          {pitch.deckURL && (
            <a
              href={pitch.deckURL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white text-sm font-medium shadow-sm hover:opacity-90"
            >
              View Pitch Deck
            </a>
          )}

          {pitch.videoURL && (
            <a
              href={pitch.videoURL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white text-sm font-medium shadow-sm hover:opacity-90"
            >
              Watch Pitch Video
            </a>
          )}

          {pitch.financialURL && (
            <a
              href={pitch.financialURL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white text-sm font-medium shadow-sm hover:opacity-90"
            >
              Financial Document
            </a>
          )}
        </div>
      </div>
    </div>
  );
}