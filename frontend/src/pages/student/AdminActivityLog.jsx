import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import { Activity, RefreshCw } from "lucide-react";

const ACTION_LABELS = {
  ai_chat:           "AI Chatbot",
  career_guidance:   "Career Guidance",
  eligibility_check: "Eligibility Check",
  scholarship_check: "Scholarships",
  learning_path:     "Learning Path",
};

const ACTION_COLORS = {
  ai_chat:           "bg-primary-50 text-primary-700",
  career_guidance:   "bg-emerald-50 text-emerald-700",
  eligibility_check: "bg-amber-50 text-amber-700",
  scholarship_check: "bg-purple-50 text-purple-700",
  learning_path:     "bg-blue-50 text-blue-700",
};

const ROLE_COLORS = {
  student:   "bg-gray-100 text-gray-600",
  counselor: "bg-primary-50 text-primary-600",
  admin:     "bg-red-50 text-red-500",
};

export default function AdminActivityLog() {
  const [logs, setLogs] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = { limit: 200 };
    if (roleFilter) params.role = roleFilter;
    if (actionFilter) params.action = actionFilter;
    api.get("/ai/activity-log", { params })
      .then(res => setLogs(res.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter, actionFilter]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-gray-900">Activity Log</h1>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-50 transition"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Recent AI feature usage across all users.</p>

      <div className="flex gap-3 mb-5">
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 text-gray-600"
        >
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="counselor">Counselor</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 text-gray-600"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs?.length === 0 ? (
        <div className="text-center py-16">
          <Activity size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No activity recorded yet.</p>
          <p className="text-xs text-gray-300 mt-1">Activity is logged when students use AI features.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {logs.map((log) => (
            <div key={log.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600"}`}>
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {log.users?.name || log.user_id}
                  </p>
                  {log.details && (
                    <p className="text-xs text-gray-400 truncate">{log.details}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[log.role] || "bg-gray-100 text-gray-500"}`}>
                  {log.role}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("en-IN", {
                    day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}