import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { BarChart3, TrendingUp, FileDown } from "lucide-react";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics")
      .then(res => setData(res.data))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  const downloadReport = async (type) => {
    try {
      const res = await api.get(`/admin/reports/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.csv`;
      a.click();
    } catch (err) {
      let message = "Couldn't generate this report";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          message = JSON.parse(text).error || message;
        } catch { /* fall back to generic message */ }
      }
      toast.error(message);
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Reports & Analytics</h1>
      <p className="text-sm text-gray-500 mb-8">Platform-wide stats and downloadable reports.</p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <MetricCard label="Total Applications" value={data?.total_applications ?? "—"} />
          <MetricCard label="Admission Success Rate" value={data?.admission_success_rate != null ? `${data.admission_success_rate}%` : "—"} highlight />
          <MetricCard label="AI Recommendations Sent" value={data?.total_recommendations ?? "—"} />
          <MetricCard label="Highly Recommended" value={data?.highly_recommended ?? "—"} />
          <MetricCard label="Applications Under Review" value={data?.under_review ?? "—"} />
          <MetricCard label="Applications Rejected" value={data?.rejected ?? "—"} />
        </div>
      )}

      {/* Application status breakdown */}
      {!loading && data?.status_breakdown && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={17} className="text-primary-500" /> Application Status Breakdown
          </h2>
          <div className="space-y-3">
            {Object.entries(data.status_breakdown).map(([status, count]) => {
              const total = Object.values(data.status_breakdown).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{status}</span>
                    <span className="text-xs text-gray-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Course popularity */}
      {!loading && data?.course_popularity && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={17} className="text-primary-500" /> Most Applied Courses
          </h2>
          <div className="space-y-2">
            {data.course_popularity.slice(0, 8).map(({ course, count }) => (
              <div key={course} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{course}</span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downloadable reports */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileDown size={17} className="text-primary-500" /> Download Reports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { type: "student-recommendations",     label: "Student Recommendation Report" },
            { type: "admission-eligibility",        label: "Admission Eligibility Report" },
            { type: "college-analysis",              label: "College-wise Admission Analysis" },
            { type: "course-popularity",             label: "Course Popularity Report" },
            { type: "scholarship-eligibility",       label: "Scholarship Eligibility Report" },
            { type: "admission-success",             label: "Admission Success Report" },
            { type: "ai-recommendation-accuracy",    label: "AI Recommendation Accuracy Report" },
            { type: "counselor-performance",         label: "Counselor Performance Report" },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => downloadReport(type)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700 transition text-left"
            >
              <FileDown size={14} className="text-gray-400 shrink-0" /> {label}
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-primary-50 border-primary-100" : "bg-white border-gray-100"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-display text-xl font-bold ${highlight ? "text-primary-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}