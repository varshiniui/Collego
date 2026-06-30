import { useEffect, useRef, useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Save, Check, Loader2 } from "lucide-react";

const STREAMS = [
  "Group I - Computer Science (PCM + CS)",
  "Group II - Biology (PCM + Bio)",
  "Group III - Vocational / Technical",
  "Group V - Commerce (Economics, Commerce, Accountancy)",
  "Group VI - Arts / Humanities",
];
const PCM_STREAM = "Group I - Computer Science (PCM + CS)";
const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "VITEEE", "SRMJEEE", "MET", "BITSAT", "CLAT", "CAT", "CUET", "None"];
const COURSE_CATEGORIES = ["Engineering", "Medical", "Law", "Management", "Arts and Science", "Polytechnic", "Distance Education", "International Universities"];
const COLLEGE_TYPES = ["No preference", "Government", "Private", "Deemed"];
const BUDGETS = ["Under 1 Lakh", "1-3 Lakhs", "3-5 Lakhs", "5-10 Lakhs", "Above 10 Lakhs"];

const EMPTY = {
  phone: "", date_of_birth: "", gender: "", city: "", state: "",
  tenth_percentage: "", twelfth_percentage: "", twelfth_stream: "",
  maths_marks: "", physics_marks: "", chemistry_marks: "", tnea_cutoff: "",
  entrance_exam: "", entrance_score: "", interests: "",
  preferred_course_category: "", preferred_college_type: "",
  budget_range: "", preferred_states: ""
};

export default function StudentProfile() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoStatus, setAutoStatus] = useState("idle"); // idle | pending | saving | saved
  const debounceRef = useRef(null);
  const isFirstLoad = useRef(true);
  const formRef = useRef(form); // always holds the latest form value, for use in cleanup closures

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    api.get("/student/profile")
      .then(res => setForm({ ...EMPTY, ...res.data }))
      .finally(() => setLoading(false));
  }, []);

  // Auto-save: debounce 1.5s after the user stops typing
  useEffect(() => {
    if (loading) return;
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }

    setAutoStatus("pending");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setAutoStatus("saving");
      try {
        await api.put("/student/profile", formRef.current);
        setAutoStatus("saved");
        setTimeout(() => setAutoStatus("idle"), 2000);
      } catch {
        setAutoStatus("idle");
      }
    }, 1500);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Save immediately when leaving the page, so nothing is lost.
  // Uses formRef (not `form`) so it always sends the latest values, even
  // though this effect's cleanup only runs once on unmount and would
  // otherwise close over the `form` from the very first render.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        api.put("/student/profile", formRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    try {
      await api.put("/student/profile", form);
      setAutoStatus("saved");
      toast.success("Profile saved");
      setTimeout(() => setAutoStatus("idle"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return <StudentLayout><div className="text-sm text-gray-400">Loading...</div></StudentLayout>;
  }

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-gray-900">My Profile</h1>
        <AutoSaveStatus status={autoStatus} />
      </div>
      <p className="text-sm text-gray-500 mb-8">The more accurate this is, the better your recommendations.</p>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
        <Section title="Personal details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone"><input value={form.phone} onChange={handleChange("phone")} className="input" /></Field>
            <Field label="Date of birth"><input type="date" value={form.date_of_birth || ""} onChange={handleChange("date_of_birth")} className="input" /></Field>
            <Field label="Gender">
              <select value={form.gender} onChange={handleChange("gender")} className="input">
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
            <Field label="City"><input value={form.city} onChange={handleChange("city")} className="input" /></Field>
            <Field label="State"><input value={form.state} onChange={handleChange("state")} className="input" /></Field>
          </div>
        </Section>

        <Section title="Academic details">
          <p className="text-xs text-amber-600 -mt-2 mb-2">Required for accurate college recommendations</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="10th percentage"><input type="number" step="0.01" value={form.tenth_percentage} onChange={handleChange("tenth_percentage")} className="input" /></Field>
            <Field label="12th percentage *"><input type="number" step="0.01" value={form.twelfth_percentage} onChange={handleChange("twelfth_percentage")} className="input" required /></Field>
            <Field label="12th stream *">
              <select value={form.twelfth_stream} onChange={handleChange("twelfth_stream")} className="input" required>
                <option value="">Select</option>
                {STREAMS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Entrance exam">
              <select value={form.entrance_exam} onChange={handleChange("entrance_exam")} className="input">
                <option value="">Select</option>
                {EXAMS.map(e => <option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="Entrance score / rank"><input type="number" step="0.01" value={form.entrance_score} onChange={handleChange("entrance_score")} className="input" /></Field>
          </div>

          {form.twelfth_stream === PCM_STREAM && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3">
                Your stream qualifies for engineering admission cutoff (TNEA-style). Enter your Maths, Physics, and Chemistry marks (out of 100 each) to calculate it.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Maths marks (/100)">
                  <input type="number" step="0.01" min="0" max="100" value={form.maths_marks} onChange={handleChange("maths_marks")} className="input" />
                </Field>
                <Field label="Physics marks (/100)">
                  <input type="number" step="0.01" min="0" max="100" value={form.physics_marks} onChange={handleChange("physics_marks")} className="input" />
                </Field>
                <Field label="Chemistry marks (/100)">
                  <input type="number" step="0.01" min="0" max="100" value={form.chemistry_marks} onChange={handleChange("chemistry_marks")} className="input" />
                </Field>
              </div>
              <CutoffPreview maths={form.maths_marks} physics={form.physics_marks} chemistry={form.chemistry_marks} />
            </div>
          )}
        </Section>

        <Section title="Preferences">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preferred course category *">
              <select value={form.preferred_course_category} onChange={handleChange("preferred_course_category")} className="input" required>
                <option value="">Select</option>
                {COURSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Preferred college type">
              <select value={form.preferred_college_type} onChange={handleChange("preferred_college_type")} className="input">
                <option value="">Select</option>
                {COLLEGE_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Budget range (per year)">
              <select value={form.budget_range} onChange={handleChange("budget_range")} className="input">
                <option value="">Select</option>
                {BUDGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Preferred states"><input value={form.preferred_states} onChange={handleChange("preferred_states")} className="input" placeholder="e.g. Tamil Nadu, Karnataka" /></Field>
          </div>
          <Field label="Interests (comma separated)">
            <input value={form.interests} onChange={handleChange("interests")} className="input" placeholder="e.g. Computer Science, AI, Robotics" />
          </Field>
        </Section>

        <button
          type="submit" disabled={saving}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-60"
        >
          <Save size={15} /> {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <style>{`.input { width: 100%; padding: 0.6rem 0.85rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; font-size: 0.875rem; } .input:focus { outline: none; box-shadow: 0 0 0 2px #4f46e5; border-color: transparent; }`}</style>
    </StudentLayout>
  );
}

function AutoSaveStatus({ status }) {
  if (status === "idle") return null;
  if (status === "pending") {
    return <span className="text-xs text-gray-400">Unsaved changes...</span>;
  }
  if (status === "saving") {
    return (
      <span className="text-xs text-gray-400 flex items-center gap-1.5">
        <Loader2 size={12} className="animate-spin" /> Saving...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="text-xs text-accent-600 flex items-center gap-1.5">
        <Check size={12} /> Saved
      </span>
    );
  }
  return null;
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <h2 className="font-display font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function CutoffPreview({ maths, physics, chemistry }) {
  const m = parseFloat(maths);
  const p = parseFloat(physics);
  const c = parseFloat(chemistry);
  const hasAll = [m, p, c].every((n) => !Number.isNaN(n));

  if (!hasAll) {
    return (
      <p className="text-xs text-gray-400 mt-3">
        Enter all three marks to see your calculated cutoff.
      </p>
    );
  }

  const cutoff = (m + p / 2 + c / 2).toFixed(2);
  return (
    <div className="mt-3 bg-primary-50 rounded-lg px-4 py-3">
      <p className="text-xs text-primary-700">
        Your TNEA-style engineering cutoff: <span className="font-bold">{cutoff} / 200</span>
        <span className="text-primary-500"> (saved automatically with your profile)</span>
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}