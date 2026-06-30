import { useEffect, useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Bookmark, MapPin, IndianRupee, X, Building2, BookOpen } from "lucide-react";

export default function SavedColleges() {
  const [tab, setTab] = useState("colleges"); // "colleges" | "courses"
  const [saved, setSaved] = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/student/saved").then(res => setSaved(res.data)).finally(() => setLoading(false));
  };

  const loadCourses = () => {
    setCoursesLoading(true);
    api.get("/student/saved-courses").then(res => setSavedCourses(res.data)).finally(() => setCoursesLoading(false));
  };

  useEffect(() => { load(); loadCourses(); }, []);

  const remove = async (collegeId) => {
    try {
      await api.delete(`/student/saved/${collegeId}`);
      setSaved(prev => prev.filter(s => s.college_id !== collegeId));
      toast.success("Removed");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const removeCourse = async (courseName) => {
    try {
      await api.delete(`/student/saved-courses?course_name=${encodeURIComponent(courseName)}`);
      setSavedCourses(prev => prev.filter(c => c.course_name !== courseName));
      toast.success("Removed");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Saved</h1>
      <p className="text-sm text-gray-500 mb-6">Your personal shortlist.</p>

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
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : saved.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <Bookmark className="mx-auto text-primary-400 mb-3" size={28} />
            <h3 className="font-display font-bold text-gray-900 mb-1.5">Nothing saved yet</h3>
            <p className="text-sm text-gray-500">Bookmark colleges from recommendations or search to build your shortlist.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map((s) => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-gray-900">{s.colleges?.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {s.colleges?.location}</span>
                    <span className="flex items-center gap-1"><IndianRupee size={12} /> {formatFee(s.colleges?.fees_min, s.colleges?.fees_max)}</span>
                  </div>
                </div>
                <button onClick={() => remove(s.college_id)} className="text-gray-300 hover:text-red-500 transition shrink-0">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        coursesLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : savedCourses.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <BookOpen className="mx-auto text-primary-400 mb-3" size={28} />
            <h3 className="font-display font-bold text-gray-900 mb-1.5">No courses saved yet</h3>
            <p className="text-sm text-gray-500">Bookmark courses from the Recommendations page to keep track of them here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedCourses.map((c) => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
                <h3 className="font-display font-bold text-gray-900">{c.course_name}</h3>
                <button onClick={() => removeCourse(c.course_name)} className="text-gray-300 hover:text-red-500 transition shrink-0">
                  <X size={18} />
                </button>
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