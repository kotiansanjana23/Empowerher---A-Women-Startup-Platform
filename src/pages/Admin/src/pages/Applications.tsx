import { Card, CardContent } from "../components/ui/card";

import { Badge } from "../components/ui/badge";

import { Button } from "../components/ui/button";

import { Input } from "../components/ui/input";

import { Search, CheckCircle2, XCircle, FileText } from "lucide-react";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../../firebase";

export function Applications() {
  const [searchQuery, setSearchQuery] = useState("");

  const [applications, setApplications] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const snapshot = await getDocs(collection(db, "applications"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: any) => {
    try {
      /* Update application status */

      await updateDoc(doc(db, "applications", application.id), {
        status: "Approved",
      });

      /* Mentor Approval */

      if (application.role === "Mentor") {
        await addDoc(collection(db, "mentors"), {
          name: application.applicantName || "Unknown Mentor",

          expertise: ["Startup", "Business"],

          students: 0,

          sessions: 0,

          rating: 4.8,

          status: "Active",

          avatar: (application.applicantName || "M").charAt(0).toUpperCase(),

          email: application.email || "",

          startup: application.startup || "",

          approvedAt: serverTimestamp(),
        });
      } else if (application.role === "Founder") {

      /* Founder Approval */
        await addDoc(collection(db, "founders"), {
          ...application,
          approvedAt: serverTimestamp(),
        });
      }

      fetchApplications();
    } catch (error) {
      console.error(error);

      alert("Failed to approve application");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, "applications", id), {
        status: "Rejected",
      });

      fetchApplications();
    } catch (error) {
      console.error(error);

      alert("Failed to reject application");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Delete this application?");

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "applications", id));

      setApplications((prev) =>
        prev.filter((application) => application.id !== id),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const filteredApplications = applications.filter(
    (application: any) =>
      (application.applicantName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (application.startup || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return <div className="p-6">Loading applications...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] p-6">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black mb-2">Applications</h1>

        <p className="text-gray-500 text-base">
          Review mentor and founder onboarding requests
        </p>
      </div>

      {/* Search */}

      <Card className="rounded-3xl border border-gray-200 shadow-sm bg-white mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 rounded-2xl border border-gray-200 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Applications */}

      <div className="space-y-4">
        {filteredApplications.map((application: any) => (
          <Card
            key={application.id}
            className="rounded-3xl border border-gray-200 shadow-sm bg-white"
          >
            <CardContent className="p-6">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                {/* Left */}

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold text-black">
                      {application.applicantName}
                    </h2>

                    <Badge
                      className={
                        application.role === "Founder"
                          ? "bg-[#EEF2FF] text-[#4338CA] border-none text-xs"
                          : "bg-[#F4EBFF] text-[#9333EA] border-none text-xs"
                      }
                    >
                      {application.role}
                    </Badge>
                  </div>

                  <p className="text-gray-500 text-sm">{application.startup}</p>

                  <p className="text-gray-400 text-sm mt-1">
                    Submitted: {application.submitted}
                  </p>
                </div>

                {/* Status */}

                <div>
                  <Badge
                    className={
                      application.status === "Approved"
                        ? "bg-green-50 text-green-600 border-none text-xs"
                        : application.status === "Rejected"
                          ? "bg-red-50 text-red-500 border-none text-xs"
                          : "bg-yellow-50 text-yellow-600 border-none text-xs"
                    }
                  >
                    {application.status}
                  </Badge>
                </div>

                {/* Actions */}

                <div className="flex gap-3 flex-wrap">
                  <Button
                    className="rounded-2xl px-5 py-5 text-sm font-medium border-none bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:opacity-90 text-white shadow-sm"
                    onClick={() => handleApprove(application)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border border-red-200 text-red-500 hover:bg-red-50"
                    onClick={() => handleReject(application.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border border-gray-200"
                    onClick={() => handleDelete(application.id)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
