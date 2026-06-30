import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { BrainCircuit, Save, Loader2 } from "lucide-react";

const DEFAULTS = {
  weight_cutoff: 40,
  weight_fees: 20,
  weight_ranking: 20,
  weight_location: 10,
  weight_entrance: 10,
  highly_recommended_threshold: 85,
  recommended_threshold: 70,
  suitable_threshold: 55,
  max_recommendations_per_student: 10,
  enable_scholarship_matching: true,
  enable_career_path_suggestions: true,
};

export default function AdminAISettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/ai-settings")
      .then(res => setSettings({ ...DEFAULTS, ...res.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/admin/ai-settings", settings);
      toast.success("AI settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const totalWeight = settings.weight_cutoff + settings.weight_fees +
    settings.weight_ranking + settings.weight_location + settings.weight_entrance;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-gray-900">AI Settings</h1>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-8">Configure how the AI recommendation engine scores and classifies colleges for students.</p>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* Scoring weights */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <BrainCircuit size={17} className="text-primary-500" /> Scoring Weights
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Each weight contributes to the match score out of 100. Total = <span className={totalWeight !== 100 ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>{totalWeight}</span> (must equal 100).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "weight_cutoff",   label: "Academic Cutoff Match" },
                { key: "weight_fees",     label: "Fee Budget Match" },
                { key: "weight_ranking",  label: "College Ranking" },
                { key: "weight_location", label: "Location Preference" },
                { key: "weight_entrance", label: "Entrance Exam Score" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="flex justify-between text-xs font-medium text-gray-600 mb-1.5">
                    <span>{label}</span>
                    <span className="font-bold text-gray-800">{settings[key]}%</span>
                  </label>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={settings[key]}
                    onChange={e => set(key, Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation thresholds */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-1">Recommendation Level Thresholds</h2>
            <p className="text-xs text-gray-400 mb-5">
              Colleges above each score threshold get the corresponding label.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: "highly_recommended_threshold", label: "Highly Recommended", color: "text-emerald-600" },
                { key: "recommended_threshold",        label: "Recommended",         color: "text-primary-600" },
                { key: "suitable_threshold",           label: "Suitable",            color: "text-amber-600" },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className={`block text-xs font-semibold ${color} mb-1.5`}>{label} ≥</label>
                  <input
                    type="number" min={0} max={100}
                    value={settings[key]}
                    onChange={e => set(key, Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* General settings */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-5">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Max recommendations per student</label>
                <input
                  type="number" min={1} max={50}
                  value={settings.max_recommendations_per_student}
                  onChange={e => set("max_recommendations_per_student", Number(e.target.value))}
                  className="w-40 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <Toggle
                label="Enable Scholarship Matching"
                desc="AI will recommend colleges based on scholarship eligibility"
                value={settings.enable_scholarship_matching}
                onChange={v => set("enable_scholarship_matching", v)}
              />
              <Toggle
                label="Enable Career Path Suggestions"
                desc="AI will suggest courses aligned with student career goals"
                value={settings.enable_career_path_suggestions}
                onChange={v => set("enable_career_path_suggestions", v)}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
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
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${value ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
