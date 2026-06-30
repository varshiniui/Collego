import { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import { BookOpen, Search } from "lucide-react";

export default function AdminCourses() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    api.get("/admin/colleges")
      .then(res => setColleges(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Build a flat list of { course, college, category, state } from courses_offered text
  const courseRows = useMemo(() => {
    const rows = [];
    for (const college of colleges) {
      if (!college.courses_offered) continue;
      const courses = college.courses_offered
        .split(/[,;\n]+/)
        .map(c => c.trim())
        .filter(Boolean);
      for (const course of courses) {
        rows.push({
          course,
          college: college.name,
          category: college.category || "—",
          state: college.state || "—",
          college_type: college.college_type || "—",
        });
      }
    }
    return rows;
  }, [colleges]);

  const categories = useMemo(() => {
    const cats = [...new Set(courseRows.map(r => r.category))].filter(c => c !== "—").sort();
    return ["All", ...cats];
  }, [courseRows]);

  const filtered = useMemo(() => {
    return courseRows.filter(r => {
      const matchSearch = r.course.toLowerCase().includes(search.toLowerCase()) ||
        r.college.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "All" || r.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [courseRows, search, filterCategory]);

  // Group by course name for summary view
  const grouped = useMemo(() => {
    const map = {};
    for (const r of filtered) {
      if (!map[r.course]) map[r.course] = [];
      map[r.course].push(r);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Courses</h1>
      <p className="text-sm text-gray-500 mb-6">
        All courses offered across {colleges.length} colleges in the database.
      </p>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl font-bold font-display text-gray-900">{courseRows.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total course offerings</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl font-bold font-display text-gray-900">{grouped.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Unique course names</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl font-bold font-display text-gray-900">{categories.length - 1}</p>
          <p className="text-xs text-gray-400 mt-0.5">Categories</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search course or college…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 text-gray-600"
        >
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400">
          <BookOpen size={32} className="mx-auto mb-3 text-gray-200" />
          No courses found.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Course Name</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3">Colleges Offering</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Sample Colleges</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(([course, rows], i) => (
                <tr
                  key={course}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition ${i === grouped.length - 1 ? "border-0" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{course}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                      {rows[0].category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                      {rows.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                    {rows.slice(0, 2).map(r => r.college).join(", ")}
                    {rows.length > 2 && ` +${rows.length - 2} more`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}