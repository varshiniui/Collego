import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Search } from "lucide-react";

export default function AdminCounselors() {
  const [counselors, setCounselors] = useState(null);
  const [assignmentCounts, setAssignmentCounts] = useState({});
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    api.get("/admin/users?role=counselor").then(res => setCounselors(res.data)).catch(() => setCounselors([]));
    api.get("/admin/counselor-assignments")
      .then(res => {
        const counts = {};
        (res.data || []).forEach(a => {
          counts[a.counselor_id] = (counts[a.counselor_id] || 0) + 1;
        });
        setAssignmentCounts(counts);
      })
      .catch(() => {});
  };

  useEffect(load, []);

  const toggleUser = async (userId, isActive) => {
    setToggling(userId);
    try {
      await api.post(`/admin/users/${userId}/toggle`);
      setCounselors(prev => prev.map(c => c.id === userId ? { ...c, is_active: !isActive } : c));
      toast.success(isActive ? "Account deactivated" : "Account activated");
    } catch {
      toast.error("Failed to update account");
    } finally {
      setToggling(null);
    }
  };

  const filtered = (counselors || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-gray-900">Counselors</h1>
        <span className="text-sm text-gray-400">{counselors?.length ?? 0} registered</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">View counselor accounts, their student load, and toggle access.</p>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search counselors…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {counselors === null ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500 mb-1">No counselors found.</p>
          <p className="text-xs text-gray-400">Counselors register themselves using the regular sign-up flow with the counselor role.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {filtered.map((c) => (
            <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                  {c.is_active
                    ? <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                    : <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>
                  }
                </div>
                <p className="text-xs text-gray-400 truncate">{c.email}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {assignmentCounts[c.id] ?? 0} student{assignmentCounts[c.id] !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => toggleUser(c.id, c.is_active)}
                  disabled={toggling === c.id}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition disabled:opacity-50 whitespace-nowrap ${
                    c.is_active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {toggling === c.id ? "…" : c.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
