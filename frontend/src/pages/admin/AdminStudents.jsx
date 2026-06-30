import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Search, CheckCircle2, XCircle, UserPlus } from "lucide-react";

export default function AdminStudents() {
  const [students, setStudents] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [selectedCounselor, setSelectedCounselor] = useState({});
  const [assigning, setAssigning] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    api.get("/admin/users?role=student").then(res => setStudents(res.data)).catch(() => setStudents([]));
    api.get("/admin/users?role=counselor").then(res => setCounselors(res.data)).catch(() => {});
    api.get("/admin/counselor-assignments")
      .then(res => {
        const map = {};
        (res.data || []).forEach(a => { map[a.student_id] = a.counselor_id; });
        setAssignments(map);
      })
      .catch(() => {});
  };

  useEffect(load, []);

  const toggleUser = async (userId, isActive) => {
    setToggling(userId);
    try {
      await api.post(`/admin/users/${userId}/toggle`);
      setStudents(prev => prev.map(s => s.id === userId ? { ...s, is_active: !isActive } : s));
      toast.success(isActive ? "Account deactivated" : "Account activated");
    } catch {
      toast.error("Failed to update account");
    } finally {
      setToggling(null);
    }
  };

  const assign = async (studentId) => {
    const counselorId = selectedCounselor[studentId];
    if (!counselorId) { toast.error("Pick a counselor first"); return; }
    setAssigning(studentId);
    try {
      await api.post("/admin/assign-counselor", { student_id: studentId, counselor_id: counselorId });
      toast.success("Counselor assigned");
      setAssignments(prev => ({ ...prev, [studentId]: counselorId }));
    } catch {
      toast.error("Could not assign counselor");
    } finally {
      setAssigning(null);
    }
  };

  const counselorName = (id) => counselors.find(c => c.id === id)?.name;

  const filtered = (students || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-gray-900">Students</h1>
        <span className="text-sm text-gray-400">{students?.length ?? 0} registered</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">Manage student accounts and counselor assignments.</p>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {students === null ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No students found.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {filtered.map((s) => (
            <div key={s.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                  {s.is_active
                    ? <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                    : <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>
                  }
                </div>
                <p className="text-xs text-gray-400 truncate">{s.email}</p>
              </div>

              {/* Counselor assignment */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {assignments[s.id] && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 whitespace-nowrap">
                    <CheckCircle2 size={12} /> {counselorName(assignments[s.id]) || "Assigned"}
                  </span>
                )}
                {counselors.length > 0 && (
                  <select
                    value={selectedCounselor[s.id] || ""}
                    onChange={e => setSelectedCounselor(prev => ({ ...prev, [s.id]: e.target.value }))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
                  >
                    <option value="">Assign counselor…</option>
                    {counselors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {counselors.length > 0 && (
                  <button
                    onClick={() => assign(s.id)}
                    disabled={assigning === s.id}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    <UserPlus size={12} />
                    {assigning === s.id ? "…" : assignments[s.id] ? "Reassign" : "Assign"}
                  </button>
                )}
                {/* Toggle active */}
                <button
                  onClick={() => toggleUser(s.id, s.is_active)}
                  disabled={toggling === s.id}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition disabled:opacity-50 whitespace-nowrap ${
                    s.is_active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {toggling === s.id ? "…" : s.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
