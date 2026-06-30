import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Search, Upload, Loader2, Pencil, Trash2, X, Check } from "lucide-react";

const CATEGORIES = ["Engineering", "Medical", "Arts and Science", "Management", "Law", "Polytechnic", "Distance Education", "International Universities"];

export default function AdminColleges() {
  const [colleges, setColleges] = useState(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/admin/colleges").then(res => setColleges(res.data)).catch(() => setColleges([]));
  };
  useEffect(load, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/admin/colleges/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadResult(res.data);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const startEdit = (college) => {
    setEditingId(college.id);
    setEditForm({
      name: college.name || "",
      category: college.category || "",
      location: college.location || "",
      state: college.state || "",
      fees_min: college.fees_min ?? "",
      fees_max: college.fees_max ?? "",
      ranking: college.ranking ?? "",
      min_cutoff_percentage: college.min_cutoff_percentage ?? "",
      website: college.website || "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/colleges/${editingId}`, editForm);
      toast.success("College updated");
      setColleges(prev => prev.map(c => c.id === editingId ? { ...c, ...editForm } : c));
      setEditingId(null);
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteCollege = async (id) => {
    if (!confirm("Deactivate this college?")) return;
    try {
      await api.delete(`/admin/colleges/${id}`);
      toast.success("College deactivated");
      setColleges(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error("Could not deactivate");
    }
  };

  const filtered = (colleges || []).filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-start justify-between mb-1 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">College Database</h1>
          <p className="text-sm text-gray-500 mt-0.5">{colleges?.length ?? 0} colleges in the system.</p>
        </div>
        {/* Bulk upload */}
        <label className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition cursor-pointer shrink-0">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Uploading…" : "Upload CSV"}
          <input type="file" accept=".csv" onChange={handleFileUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      {uploadResult && (
        <div className="mt-3 mb-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 space-y-0.5">
          <p>Inserted: <span className="font-semibold text-gray-900">{uploadResult.inserted}</span></p>
          <p>Skipped (duplicates): {uploadResult.skipped_duplicates}</p>
          <p>Skipped (missing fields): {uploadResult.skipped_missing_fields}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-5 mt-2">
        CSV columns: name, category, college_type, location, state, courses_offered, min_cutoff_percentage, fees_min, fees_max, ranking, description, website
      </p>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, location, category…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {colleges === null ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No colleges match your search.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {filtered.map((c) => (
            <div key={c.id}>
              {editingId === c.id ? (
                /* Edit row */
                <div className="px-5 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name">
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                        className="input-sm" />
                    </Field>
                    <Field label="Category">
                      <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                        className="input-sm">
                        {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                      </select>
                    </Field>
                    <Field label="Location">
                      <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                        className="input-sm" />
                    </Field>
                    <Field label="State">
                      <input value={editForm.state} onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))}
                        className="input-sm" />
                    </Field>
                    <Field label="Min Fees (₹)">
                      <input type="number" value={editForm.fees_min} onChange={e => setEditForm(p => ({ ...p, fees_min: e.target.value }))}
                        className="input-sm" />
                    </Field>
                    <Field label="Max Fees (₹)">
                      <input type="number" value={editForm.fees_max} onChange={e => setEditForm(p => ({ ...p, fees_max: e.target.value }))}
                        className="input-sm" />
                    </Field>
                    <Field label="Min Cutoff %">
                      <input type="number" value={editForm.min_cutoff_percentage} onChange={e => setEditForm(p => ({ ...p, min_cutoff_percentage: e.target.value }))}
                        className="input-sm" />
                    </Field>
                    <Field label="Ranking">
                      <input type="number" value={editForm.ranking} onChange={e => setEditForm(p => ({ ...p, ranking: e.target.value }))}
                        className="input-sm" />
                    </Field>
                    <Field label="Website" className="col-span-2">
                      <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                        className="input-sm" />
                    </Field>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={saveEdit} disabled={saving}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                      <Check size={12} /> {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View row */
                <div className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {c.category} · {c.location}, {c.state}
                      {c.fees_min ? ` · ₹${Number(c.fees_min).toLocaleString("en-IN")}–${Number(c.fees_max || c.fees_min).toLocaleString("en-IN")}` : ""}
                      {c.ranking ? ` · Rank #${c.ranking}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(c)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteCollege(c.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .input-sm {
          width: 100%;
          padding: 6px 10px;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          outline: none;
        }
        .input-sm:focus { border-color: #a5b4fc; box-shadow: 0 0 0 2px rgba(99,102,241,0.15); }
      `}</style>
    </AdminLayout>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
