import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Save, Loader2, Plus, X } from "lucide-react";

const DEFAULT_SETTINGS = {
  application_statuses: [
    "Profile Created", "Eligibility Verified", "Recommended",
    "Application Submitted", "Under Review", "Admission Offered",
    "Admission Confirmed", "Rejected"
  ],
  college_categories: [
    "Engineering", "Medical", "Arts and Science", "Management",
    "Law", "Polytechnic", "Distance Education", "International Universities"
  ],
  course_categories: [
    "Computer Science", "Information Technology", "Artificial Intelligence",
    "Data Science", "Mechanical Engineering", "Civil Engineering",
    "Electronics and Communication", "Business Administration",
    "Commerce", "Medical Sciences", "Law", "Other Professional Courses"
  ],
  min_percentage_required: 50,
  allow_self_registration: true,
  require_document_verification: true,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItems, setNewItems] = useState({ college_categories: "", course_categories: "" });

  useEffect(() => {
    api.get("/admin/platform-settings")
      .then(res => setSettings({ ...DEFAULT_SETTINGS, ...res.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/admin/platform-settings", settings);
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const addItem = (listKey) => {
    const val = newItems[listKey]?.trim();
    if (!val) return;
    if (settings[listKey].includes(val)) { toast.error("Already exists"); return; }
    set(listKey, [...settings[listKey], val]);
    setNewItems(prev => ({ ...prev, [listKey]: "" }));
  };

  const removeItem = (listKey, item) => {
    set(listKey, settings[listKey].filter(i => i !== item));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-gray-900">Platform Configuration</h1>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-8">Configure admission criteria, categories, and system-wide rules.</p>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">

          {/* Admission criteria */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-5">Admission Criteria</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Minimum marks % required to be eligible</label>
                <input
                  type="number" min={0} max={100}
                  value={settings.min_percentage_required}
                  onChange={e => set("min_percentage_required", Number(e.target.value))}
                  className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Toggle
                label="Allow student self-registration"
                desc="Students can sign up on their own without an admin invite"
                value={settings.allow_self_registration}
                onChange={v => set("allow_self_registration", v)}
              />
              <Toggle
                label="Require document verification before recommendations"
                desc="Marks sheets must be verified before AI generates college matches"
                value={settings.require_document_verification}
                onChange={v => set("require_document_verification", v)}
              />
            </div>
          </div>

          {/* Application status flow */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-2">Application Status Flow</h2>
            <p className="text-xs text-gray-400 mb-4">The ordered list of statuses a student's application moves through.</p>
            <div className="flex flex-wrap gap-2">
              {settings.application_statuses.map((s, i) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                  <span className="text-gray-400 font-normal">{i + 1}.</span> {s}
                </span>
              ))}
            </div>
          </div>

          {/* College categories */}
          <TagListEditor
            title="College Categories"
            desc="The types of colleges students can filter by and get matched to."
            items={settings.college_categories}
            newValue={newItems.college_categories}
            onNewChange={v => setNewItems(prev => ({ ...prev, college_categories: v }))}
            onAdd={() => addItem("college_categories")}
            onRemove={item => removeItem("college_categories", item)}
          />

          {/* Course categories */}
          <TagListEditor
            title="Course / Stream Categories"
            desc="The academic disciplines students can express interest in."
            items={settings.course_categories}
            newValue={newItems.course_categories}
            onNewChange={v => setNewItems(prev => ({ ...prev, course_categories: v }))}
            onAdd={() => addItem("course_categories")}
            onRemove={item => removeItem("course_categories", item)}
          />
        </div>
      )}
    </AdminLayout>
  );
}

function TagListEditor({ title, desc, items, newValue, onNewChange, onAdd, onRemove }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <h2 className="font-display font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-xs text-gray-400 mb-4">{desc}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map(item => (
          <span key={item} className="inline-flex items-center gap-1 text-xs font-medium bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full">
            {item}
            <button onClick={() => onRemove(item)} className="ml-0.5 text-primary-400 hover:text-primary-700">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newValue}
          onChange={e => onNewChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onAdd()}
          placeholder="Add new category…"
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${value ? "bg-primary-600" : "bg-gray-200"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
