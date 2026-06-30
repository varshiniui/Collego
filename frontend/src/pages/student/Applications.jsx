import { useEffect, useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { FileCheck, MapPin, X, ChevronRight } from "lucide-react";

const STATUS_FLOW = [
  "Application Started", "Application Submitted", "Under Review",
  "Admission Offered", "Admission Confirmed"
];
// Self-settable by the student; anything past this point is set by a counselor.
const SELF_SETTABLE = ["Application Started", "Application Submitted"];

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/student/applications").then(res => setApps(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const advance = async (app) => {
    const currentIdx = STATUS_FLOW.indexOf(app.status);
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    if (!nextStatus || !SELF_SETTABLE.includes(nextStatus)) return;

    setUpdating(app.id);
    try {
      await api.put(`/student/applications/${app.id}/status`, { status: nextStatus });
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: nextStatus } : a));
      toast.success(`Marked as "${nextStatus}"`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't update status");
    } finally {
      setUpdating(null);
    }
  };

  const withdraw = async (appId) => {
    try {
      await api.delete(`/student/applications/${appId}`);
      setApps(prev => prev.filter(a => a.id !== appId));
      toast.success("Application withdrawn");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Applications</h1>
      <p className="text-sm text-gray-500 mb-6">Track your progress at each college.</p>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : apps.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <FileCheck className="mx-auto text-primary-400 mb-3" size={28} />
          <h3 className="font-display font-bold text-gray-900 mb-1.5">No applications yet</h3>
          <p className="text-sm text-gray-500">Click "Apply" on a college from Recommendations to start tracking it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-gray-900">{app.colleges?.name}</h3>
                  <span className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin size={12} /> {app.colleges?.location}
                  </span>
                </div>
                <button onClick={() => withdraw(app.id)} className="text-gray-300 hover:text-red-500 transition shrink-0">
                  <X size={18} />
                </button>
              </div>

              <StatusTracker status={app.status} />

              {SELF_SETTABLE.includes(STATUS_FLOW[STATUS_FLOW.indexOf(app.status) + 1]) && (
                <button
                  onClick={() => advance(app)}
                  disabled={updating === app.id}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition disabled:opacity-60"
                >
                  Mark as "{STATUS_FLOW[STATUS_FLOW.indexOf(app.status) + 1]}" <ChevronRight size={14} />
                </button>
              )}

              {app.status === "Rejected" && (
                <p className="text-xs text-rose-600 mt-3">This application was marked rejected by your counselor.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}

function StatusTracker({ status }) {
  const isRejected = status === "Rejected";
  const currentIdx = STATUS_FLOW.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((step, i) => {
        const reached = !isRejected && i <= currentIdx;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className={`h-1.5 flex-1 rounded-full ${reached ? "bg-primary-500" : "bg-gray-100"}`} />
            {i < STATUS_FLOW.length - 1 && <div className="w-1" />}
          </div>
        );
      })}
      <span className={`ml-3 text-xs font-semibold whitespace-nowrap ${isRejected ? "text-rose-600" : "text-primary-700"}`}>
        {status}
      </span>
    </div>
  );
}