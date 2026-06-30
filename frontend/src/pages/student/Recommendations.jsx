import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Sparkles, RefreshCw, MapPin, IndianRupee, Bookmark, BookmarkCheck, AlertCircle, BookOpen, Building2, FileCheck, Download } from "lucide-react";

export default function Recommendations() {
  const [tab, setTab] = useState("colleges"); // "colleges" | "courses"
  const [recs, setRecs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [missingFields, setMissingFields] = useState(null);
  const [coursesError, setCoursesError] = useState(null);
  const [savedCourseNames, setSavedCourseNames] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applying, setApplying] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/student/recommendations")
      .then(res => setRecs(res.data))
      .finally(() => setLoading(false));
  };

  const loadCourses = () => {
    setCoursesLoading(true);
    setCoursesError(null);
    api.get("/student/courses/recommended")
      .then(res => setCourses(res.data))
      .catch(err => setCoursesError(err.response?.data?.error || "Couldn't load course recommendations"))
      .finally(() => setCoursesLoading(false));
  };

  const loadSavedCourses = () => {
    api.get("/student/saved-courses")
      .then(res => setSavedCourseNames(new Set(res.data.map(c => c.course_name))))
      .catch(() => {});
  };

  const loadApplications = () => {
    api.get("/student/applications")
      .then(res => setAppliedIds(new Set(res.data.map(a => a.college_id))))
      .catch(() => {});
  };

  useEffect(() => { load(); loadCourses(); loadSavedCourses(); loadApplications(); }, []);

  const applyToCollege = async (collegeId) => {
    setApplying(collegeId);
    try {
      await api.post(`/student/applications/${collegeId}`);
      setAppliedIds(prev => new Set(prev).add(collegeId));
      toast.success("Application started — track it on the Applications page");
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't start application");
    } finally {
      setApplying(null);
    }
  };

  const generate = async () => {
    setGenerating(true);
    setMissingFields(null);
    try {
      const res = await api.post("/student/recommendations/generate");
      toast.success(`Generated ${res.data.count} recommendations`);
      load();
      loadCourses();
    } catch (err) {
      const data = err.response?.data;
      if (data?.missing_fields) {
        setMissingFields(data.missing_fields);
      } else {
        toast.error(data?.error || "Couldn't generate recommendations");
      }
    } finally {
      setGenerating(false);
    }
  };

  const toggleSave = async (collegeId) => {
    const isSaved = savedIds.has(collegeId);
    try {
      if (isSaved) {
        await api.delete(`/student/saved/${collegeId}`);
        setSavedIds(prev => { const s = new Set(prev); s.delete(collegeId); return s; });
      } else {
        await api.post(`/student/saved/${collegeId}`);
        setSavedIds(prev => new Set(prev).add(collegeId));
        toast.success("Saved to your list");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const toggleSaveCourse = async (courseName) => {
    const isSaved = savedCourseNames.has(courseName);
    try {
      if (isSaved) {
        await api.delete(`/student/saved-courses?course_name=${encodeURIComponent(courseName)}`);
        setSavedCourseNames(prev => { const s = new Set(prev); s.delete(courseName); return s; });
      } else {
        await api.post("/student/saved-courses", { course_name: courseName });
        setSavedCourseNames(prev => new Set(prev).add(courseName));
        toast.success("Saved to your list");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const [downloading, setDownloading] = useState(false);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/student/reports/recommendations.pdf", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "Collego_Recommendations.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let message = "Couldn't generate the report";
      // Blob error responses need to be read as text to get the JSON error message
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          message = JSON.parse(text).error || message;
        } catch { /* fall back to generic message */ }
      }
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Recommendations</h1>
          <p className="text-sm text-gray-500">Colleges ranked by fit, based on your profile.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadReport} disabled={downloading}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-60"
          >
            <Download size={15} />
            {downloading ? "Preparing..." : "Download report"}
          </button>
          <button
            onClick={generate} disabled={generating}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-60"
          >
            <RefreshCw size={15} className={generating ? "animate-spin" : ""} />
            {generating ? "Generating..." : "Refresh recommendations"}
          </button>
        </div>
      </div>

      {missingFields && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 mb-1">Complete your profile to get accurate recommendations</p>
            <p className="text-sm text-amber-700">
              Missing: {missingFields.join(", ")}. Without your cutoff/percentage, recommendations can't be matched to your eligibility.
            </p>
            <Link to="/student/profile" className="inline-block mt-2 text-sm font-semibold text-amber-800 underline">
              Go to My Profile →
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("colleges")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold transition ${tab === "colleges" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
        >
          <Building2 size={14} /> Colleges
        </button>
        <button
          onClick={() => setTab("courses")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold transition ${tab === "courses" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
        >
          <BookOpen size={14} /> Courses
        </button>
      </div>

      {tab === "colleges" ? (
        loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recs.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <Sparkles className="mx-auto text-primary-400 mb-3" size={28} />
            <h3 className="font-display font-bold text-gray-900 mb-1.5">No recommendations yet</h3>
            <p className="text-sm text-gray-500 mb-5">Click "Refresh recommendations" to run the AI matching engine on your profile.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recs.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-bold text-gray-900">{r.colleges?.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {r.colleges?.location}</span>
                      <span className="flex items-center gap-1"><IndianRupee size={12} /> {formatFee(r.colleges?.fees_min, r.colleges?.fees_max)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <LevelBadge level={r.level} />
                    <button onClick={() => toggleSave(r.college_id)} className="text-gray-300 hover:text-primary-500 transition">
                      {savedIds.has(r.college_id) ? <BookmarkCheck size={18} className="text-primary-600" /> : <Bookmark size={18} />}
                    </button>
                  </div>
                </div>
                {r.reasons?.length > 0 && (
                  <ul className="text-xs text-gray-500 mt-3 space-y-1">
                    {r.reasons.map((reason, i) => (
                      <li key={i} className="flex gap-1.5"><span className="text-accent-500">•</span> {reason}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 pt-3 border-t border-gray-50">
                  {appliedIds.has(r.college_id) ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                      <FileCheck size={14} /> Application started
                    </span>
                  ) : (
                    <button
                      onClick={() => applyToCollege(r.college_id)}
                      disabled={applying === r.college_id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition disabled:opacity-60"
                    >
                      <FileCheck size={14} /> {applying === r.college_id ? "Starting..." : "Apply"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        coursesLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : coursesError ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <BookOpen className="mx-auto text-primary-400 mb-3" size={28} />
            <h3 className="font-display font-bold text-gray-900 mb-1.5">Can't show course recommendations yet</h3>
            <p className="text-sm text-gray-500">{coursesError}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <BookOpen className="mx-auto text-primary-400 mb-3" size={28} />
            <h3 className="font-display font-bold text-gray-900 mb-1.5">No course recommendations yet</h3>
            <p className="text-sm text-gray-500">Click "Refresh recommendations" to see courses that fit your profile.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-bold text-gray-900">{c.course_name}</h3>
                  <div className="flex items-center gap-3 shrink-0">
                    <LevelBadge level={c.level} />
                    <button onClick={() => toggleSaveCourse(c.course_name)} className="text-gray-300 hover:text-primary-500 transition">
                      {savedCourseNames.has(c.course_name) ? <BookmarkCheck size={18} className="text-primary-600" /> : <Bookmark size={18} />}
                    </button>
                  </div>
                </div>
                {c.reasons?.length > 0 && (
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    {c.reasons.map((reason, i) => (
                      <li key={i} className="flex gap-1.5"><span className="text-accent-500">•</span> {reason}</li>
                    ))}
                  </ul>
                )}
                {c.available_at?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 mb-1.5">Available at {c.total_colleges_offering} college{c.total_colleges_offering !== 1 ? "s" : ""}, including:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.available_at.map((a) => (
                        <span
                          key={a.college_id}
                          className={`text-xs px-2 py-1 rounded-full ${a.is_cutoff_eligible ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {a.college_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </StudentLayout>
  );
}

function formatFee(min, max) {
  if (!min || !max) return "Fee not listed";
  const fmt = (n) => `₹${(n / 100000).toFixed(1)}L`;
  return `${fmt(min)} – ${fmt(max)} / yr`;
}

function LevelBadge({ level }) {
  const styles = {
    "Highly Recommended": "bg-accent-500/10 text-accent-700",
    "Recommended": "bg-primary-50 text-primary-700",
    "Suitable": "bg-amber-50 text-amber-700",
    "Alternative Option": "bg-gray-100 text-gray-600",
    "Over Budget": "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[level] || styles["Alternative Option"]}`}>
      {level}
    </span>
  );
}