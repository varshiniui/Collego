import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import CounselorLayout from "../../components/counselor/CounselorLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft, FileText, Sparkles, FileCheck, MessageSquare,
  CheckCircle2, Download, Send, MapPin, PlusCircle, Search, IndianRupee
} from "lucide-react";

const TABS = [
  { key: "documents",     label: "Documents",          icon: FileText },
  { key: "recommendations", label: "AI Recommendations", icon: Sparkles },
  { key: "applications",  label: "Applications",       icon: FileCheck },
  { key: "notes",         label: "Counseling Notes",   icon: MessageSquare },
  { key: "alternatives",  label: "Suggest Alternatives", icon: PlusCircle },
];

const APP_STATUSES = [
  "Application Started", "Application Submitted", "Under Review",
  "Admission Offered", "Admission Confirmed", "Rejected"
];

const LEVEL_COLORS = {
  "Highly Recommended": "bg-emerald-50 text-emerald-700",
  "Recommended":        "bg-primary-50 text-primary-700",
  "Suitable":           "bg-amber-50 text-amber-700",
  "Alternative Option": "bg-gray-100 text-gray-600",
  "Over Budget":        "bg-rose-50 text-rose-600",
};

export default function CounselorStudentDetail() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [tab, setTab] = useState("documents");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    api.get("/counselor/students").then(res => {
      const found = res.data.find(s => s.student_id === studentId);
      setStudent(found || null);
    });
  }, [studentId]);

  const verify = async () => {
    setVerifying(true);
    try {
      await api.post(`/counselor/students/${studentId}/verify`);
      toast.success("Student marked as verified");
      setStudent(prev => prev ? {
        ...prev,
        student_profiles: { ...prev.student_profiles, application_status: "Eligibility Verified" }
      } : prev);
    } catch {
      toast.error("Couldn't verify student");
    } finally {
      setVerifying(false);
    }
  };

  const profile = student?.student_profiles;
  const isVerified = profile?.application_status && profile.application_status !== "Profile Created";

  return (
    <CounselorLayout>
      <Link to="/counselor/students" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <ArrowLeft size={15} /> Back to students
      </Link>

      {!student ? (
        <div className="h-32 bg-white border border-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center font-display font-bold text-lg text-primary-700">
                {student.users?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-gray-900">{student.users?.name}</h1>
                <p className="text-sm text-gray-500">{student.users?.email}</p>
              </div>
            </div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={13} /> {profile.application_status}
              </span>
            ) : (
              <button
                onClick={verify}
                disabled={verifying}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-60"
              >
                <CheckCircle2 size={13} /> {verifying ? "Verifying..." : "Verify academic information"}
              </button>
            )}
          </div>

          {/* Academic profile card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Academic profile</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Field label="12th percentage" value={profile?.twelfth_percentage ? `${profile.twelfth_percentage}%` : null} />
              <Field label="12th stream" value={profile?.twelfth_stream} />
              <Field label="Preferred category" value={profile?.preferred_course_category} />
              <Field label="Preferred states" value={profile?.preferred_states} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mt-4">
              <Field label="College type preference" value={profile?.preferred_college_type} />
              <Field label="Budget range" value={profile?.budget_range} />
              <Field label="Application status" value={profile?.application_status} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-gray-100 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  tab === key
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {tab === "documents"       && <DocumentsTab studentId={studentId} />}
          {tab === "recommendations" && <RecommendationsTab studentId={studentId} />}
          {tab === "applications"    && <ApplicationsTab studentId={studentId} />}
          {tab === "notes"           && <NotesTab studentId={studentId} />}
          {tab === "alternatives"    && <AlternativesTab studentId={studentId} />}
        </>
      )}
    </CounselorLayout>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-medium text-gray-800">{value || <span className="text-gray-300 font-normal">Not provided</span>}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
      <Icon className="mx-auto text-primary-400 mb-3" size={26} />
      <h3 className="font-display font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500">{body}</p>
    </div>
  );
}

function formatFee(min, max) {
  if (!min && !max) return null;
  const fmt = n => `₹${(n / 100000).toFixed(1)}L`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} / yr`;
  if (min) return `From ${fmt(min)} / yr`;
  return `Up to ${fmt(max)} / yr`;
}

// ─── Documents tab ────────────────────────────────────────────────────────────

function DocumentsTab({ studentId }) {
  const [docs, setDocs] = useState(null);
  useEffect(() => {
    api.get(`/counselor/students/${studentId}/documents`)
      .then(res => setDocs(res.data))
      .catch(() => setDocs([]));
  }, [studentId]);

  if (docs === null) return <div className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse" />;
  if (docs.length === 0) return <EmptyState icon={FileText} title="No documents uploaded" body="This student hasn't uploaded any mark sheets or certificates yet." />;

  return (
    <div className="space-y-2.5">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-primary-500" size={18} />
            <div>
              <p className="text-sm font-medium text-gray-800">{doc.file_name || doc.document_type}</p>
              <p className="text-xs text-gray-400">{doc.document_type}</p>
            </div>
          </div>
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary-600 transition">
              <Download size={16} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Recommendations tab ──────────────────────────────────────────────────────

function RecommendationsTab({ studentId }) {
  const [recs, setRecs] = useState(null);
  useEffect(() => {
    api.get(`/counselor/students/${studentId}/recommendations`)
      .then(res => setRecs(res.data))
      .catch(() => setRecs([]));
  }, [studentId]);

  if (recs === null) return <div className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse" />;
  if (recs.length === 0) return <EmptyState icon={Sparkles} title="No recommendations generated yet" body="This student hasn't generated AI college recommendations." />;

  return (
    <div className="space-y-2.5">
      {recs.slice(0, 25).map((r) => (
        <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-gray-900">{r.colleges?.name}</h4>
              <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} /> {r.colleges?.location}
              </span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${LEVEL_COLORS[r.level] || "bg-gray-100 text-gray-600"}`}>
              {r.level}
            </span>
          </div>
          {r.reasons?.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {r.reasons.slice(0, 2).map((reason, i) => (
                <li key={i} className="text-xs text-gray-500">• {reason}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Applications tab ─────────────────────────────────────────────────────────

function ApplicationsTab({ studentId }) {
  const [apps, setApps] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    api.get(`/counselor/students/${studentId}/applications`)
      .then(res => setApps(res.data))
      .catch(() => setApps([]));
  };
  useEffect(load, [studentId]);

  const updateStatus = async (appId, status) => {
    setUpdating(appId);
    try {
      await api.put(`/counselor/applications/${appId}/status`, { status });
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast.success(`Status updated to "${status}"`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't update status");
    } finally {
      setUpdating(null);
    }
  };

  if (apps === null) return <div className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse" />;
  if (apps.length === 0) return <EmptyState icon={FileCheck} title="No applications yet" body="This student hasn't started any college applications." />;

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <div key={app.id} className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-display font-bold text-sm text-gray-900">{app.colleges?.name}</h4>
              <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} /> {app.colleges?.location}
              </span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
              app.status === "Rejected" ? "bg-rose-50 text-rose-600" : "bg-primary-50 text-primary-700"
            }`}>
              {app.status}
            </span>
          </div>
          <select
            value={app.status}
            disabled={updating === app.id}
            onChange={(e) => updateStatus(app.id, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 disabled:opacity-60"
          >
            {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ─── Notes tab ────────────────────────────────────────────────────────────────

function NotesTab({ studentId }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    api.get(`/counselor/students/${studentId}/notes`)
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]));
  };
  useEffect(load, [studentId]);

  const addNote = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await api.post(`/counselor/students/${studentId}/notes`, { note: draft.trim() });
      setDraft("");
      toast.success("Note added");
      load();
    } catch {
      toast.error("Couldn't add note");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a counseling note for this student..."
          rows={3}
          className="w-full text-sm text-gray-800 placeholder:text-gray-400 resize-none outline-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={addNote}
            disabled={sending || !draft.trim()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            <Send size={13} /> {sending ? "Saving..." : "Save note"}
          </button>
        </div>
      </div>

      {notes === null ? (
        <div className="h-16 bg-white border border-gray-100 rounded-2xl animate-pulse" />
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No counseling notes yet for this student.</p>
      ) : (
        <div className="space-y-2.5">
          {notes.map((n) => (
            <div key={n.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-700">{n.note}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Suggest Alternatives tab ─────────────────────────────────────────────────

function AlternativesTab({ studentId }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [suggested, setSuggested] = useState(new Set()); // college_ids already pushed
  const [pushing, setPushing]   = useState(null);

  // Load colleges already suggested (level = "Alternative Option") so we
  // can pre-mark them as pushed on first render.
  useEffect(() => {
    api.get(`/counselor/students/${studentId}/recommendations`)
      .then(res => {
        const altIds = (res.data || [])
          .filter(r => r.level === "Alternative Option")
          .map(r => r.college_id);
        setSuggested(new Set(altIds));
      })
      .catch(() => {});
  }, [studentId]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await api.get("/student/colleges/search", {
        params: { name: query.trim() }
      });
      setResults(res.data.slice(0, 15));
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const pushAlternative = async (college) => {
    setPushing(college.id);
    try {
      await api.post(`/counselor/students/${studentId}/suggest`, {
        college_id: college.id,
      });
      setSuggested(prev => new Set(prev).add(college.id));
      toast.success(`"${college.name}" added to student's recommendations`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't suggest college");
    } finally {
      setPushing(null);
    }
  };

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Suggest an alternative college</h3>
        <p className="text-xs text-gray-400 mb-4">
          Search the college database and push colleges to this student's recommendation list as "Alternative Option". The student will see them immediately in their Recommendations page.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="Search by college name…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <button
            onClick={search}
            disabled={searching || !query.trim()}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2.5">
          {results.map(c => {
            const alreadySuggested = suggested.has(c.id);
            const ispushing = pushing === c.id;
            const fee = formatFee(c.fees_min, c.fees_max);
            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-bold text-sm text-gray-900 truncate">{c.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {c.location}, {c.state}</span>
                    {fee && <span className="flex items-center gap-1"><IndianRupee size={11} /> {fee}</span>}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{c.category}</span>
                    {c.ranking && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">Rank #{c.ranking}</span>}
                  </div>
                </div>
                <button
                  onClick={() => pushAlternative(c)}
                  disabled={alreadySuggested || ispushing}
                  className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                    alreadySuggested
                      ? "border-emerald-200 text-emerald-600 bg-emerald-50 cursor-default"
                      : "border-primary-200 text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                  }`}
                >
                  <PlusCircle size={13} />
                  {ispushing ? "Adding…" : alreadySuggested ? "Suggested" : "Suggest"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && !searching && query && (
        <p className="text-sm text-gray-400 text-center py-8">No colleges found for "{query}".</p>
      )}

      {!query && (
        <div className="text-center py-10">
          <PlusCircle className="mx-auto text-gray-200 mb-3" size={32} />
          <p className="text-sm text-gray-400">Search above to find colleges to suggest.</p>
        </div>
      )}
    </div>
  );
}