import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"];

export default function ReviewPitch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [founder, setFounder] = useState<any>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myFounders") || "[]");
    const selected = stored.find((f: any) => f.id == id);
    setFounder(selected);
  }, [id]);

  if (!founder) return <div className="p-6">Founder not found</div>;

  const evaluation = founder.evaluation;

  // Prepare chart data
  const chartData = evaluation
    ? Object.entries(evaluation.scores).map(([key, value]: any) => ({
        name: key,
        value: value,
      }))
    : [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow border flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">{founder.founder}</h1>
          <p className="text-purple-600 text-lg">{founder.startup}</p>
          <p className="text-sm text-gray-500">{founder.industry}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() =>
              window.open(
                "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "_blank"
              )
            }
            className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50"
          >
            <FileText size={16} />
            Download Pitch
          </button>

          <button
            onClick={() => navigate(`/mentor/evaluation/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg"
          >
            <TrendingUp size={16} />
            Evaluate Pitch
          </button>
        </div>
      </div>

      {/* Evaluation Section */}
      {evaluation ? (
        <div className="grid md:grid-cols-2 gap-8">

          {/* Left: Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow border">
            <h2 className="text-xl font-semibold mb-4">
              Score Distribution
            </h2>

            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    outerRadius={100}
                    label
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Score Summary */}
          <div className="space-y-6">

            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg text-center">
              <p className="text-6xl font-semibold">
                {evaluation.percentage}%
              </p>
              <p className="mt-2 text-lg">{evaluation.status}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow border">
              <h2 className="text-xl font-semibold mb-3">
                Mentor Review
              </h2>
              <p className="text-gray-700">
                {evaluation.comments}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-center">
          No evaluation yet. Please evaluate this founder.
        </div>
      )}
    </div>
  );
}