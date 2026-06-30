import { useEffect, useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Search, MapPin, IndianRupee, Bookmark, BookmarkCheck, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = [
  "Engineering", "Medical", "Arts and Science", "Management",
  "Law", "Polytechnic", "Distance Education", "International Universities",
];

const COURSE_CATEGORIES = [
  "Computer Science", "Information Technology", "Artificial Intelligence",
  "Data Science", "Mechanical Engineering", "Civil Engineering",
  "Electronics and Communication", "Business Administration",
  "Commerce", "Medical Sciences", "Law", "Other Professional Courses",
];

const STATES = [
  "Tamil Nadu", "Maharashtra", "Karnataka", "Delhi", "Uttar Pradesh",
  "Telangana", "Andhra Pradesh", "Kerala", "Gujarat", "Rajasthan",
  "West Bengal", "Madhya Pradesh", "Punjab", "Haryana", "Bihar",
];

export default function CollegeSearch() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [ownershipType, setOwnershipType] = useState("");
  const [state, setState] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [minFees, setMinFees] = useState("");
  const [maxFees, setMaxFees] = useState("");
  const [maxRanking, setMaxRanking] = useState("");

  const activeFilterCount = [
    category, ownershipType, state, courseCategory, minFees, maxFees, maxRanking
  ].filter(Boolean).length;

  const buildParams = () => {
    const params = {};
    if (name)          params.name = name;
    if (category)      params.category = category;
    if (ownershipType) params.ownership_type = ownershipType;
    if (state)         params.state = state;
    if (courseCategory) params.course_category = courseCategory;
    return params;
  };

  const doSearch = () => {
    setLoading(true);
    api.get("/student/colleges/search", { params: buildParams() })
      .then(res => {
        let results = res.data;
        // Fees and ranking filtering is client-side since the backend
        // search endpoint doesn't support numeric range params yet
        if (minFees) results = results.filter(c => c.fees_max == null || c.fees_max >= Number(minFees) * 100000);
        if (maxFees) results = results.filter(c => c.fees_min == null || c.fees_min <= Number(maxFees) * 100000);
        if (maxRanking) results = results.filter(c => c.ranking == null || c.ranking <= Number(maxRanking));
        setColleges(results);
      })
      .finally(() => setLoading(false));
  };

  const clearFilters = () => {
    setCategory(""); setOwnershipType(""); setState("");
    setCourseCategory(""); setMinFees(""); setMaxFees(""); setMaxRanking("");
  };

  useEffect(() => {
    api.get("/student/saved")
      .then(res => setSavedIds(new Set((res.data || []).map(s => s.college_id))))
      .catch(() => {});
    doSearch();
  }, []);

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

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Search Colleges</h1>
      <p className="text-sm text-gray-500 mb-6">Browse the full college directory.</p>

      {/* Search bar row */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search by college name…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
            showFilters || activeFilterCount > 0
              ? "border-primary-300 bg-primary-50 text-primary-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={doSearch}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition"
        >
          Search
        </button>
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Filters</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* College category */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">College category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Ownership type */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select
                value={ownershipType}
                onChange={e => setOwnershipType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">All types</option>
                <option>Government</option>
                <option>Private</option>
                <option>Deemed</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">State</label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">All states</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Course category */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Course / stream</label>
              <select
                value={courseCategory}
                onChange={e => setCourseCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">All courses</option>
                {COURSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Fees range */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min fees (₹ Lakhs / yr)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 1"
                value={minFees}
                onChange={e => setMinFees(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max fees (₹ Lakhs / yr)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 10"
                value={maxFees}
                onChange={e => setMaxFees(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            {/* Ranking */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max ranking (top N)</label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 100"
                value={maxRanking}
                onChange={e => setMaxRanking(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <button
            onClick={() => { doSearch(); setShowFilters(false); }}
            className="mt-4 w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition"
          >
            Apply filters
          </button>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: category, clear: () => setCategory("") },
            { label: ownershipType, clear: () => setOwnershipType("") },
            { label: state, clear: () => setState("") },
            { label: courseCategory, clear: () => setCourseCategory("") },
            { label: minFees ? `Min ₹${minFees}L` : "", clear: () => setMinFees("") },
            { label: maxFees ? `Max ₹${maxFees}L` : "", clear: () => setMaxFees("") },
            { label: maxRanking ? `Top ${maxRanking}` : "", clear: () => setMaxRanking("") },
          ].filter(f => f.label).map(f => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-full"
            >
              {f.label}
              <button onClick={() => { f.clear(); setTimeout(doSearch, 0); }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : colleges.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No colleges found. Try adjusting your filters.</p>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{colleges.length} college{colleges.length !== 1 ? "s" : ""} found</p>
          <div className="space-y-3">
            {colleges.map(c => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-gray-900">{c.name}</h3>
                    {c.ranking && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                        Rank #{c.ranking}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {c.location}, {c.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee size={11} /> {formatFee(c.fees_min, c.fees_max)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {c.category}
                    </span>
                    {c.college_type && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                        {c.college_type}
                      </span>
                    )}
                  </div>
                  {c.courses_offered && (
                    <p className="text-xs text-gray-400 truncate">{c.courses_offered}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleSave(c.id)}
                  className="text-gray-300 hover:text-primary-500 transition shrink-0 mt-0.5"
                >
                  {savedIds.has(c.id)
                    ? <BookmarkCheck size={18} className="text-primary-600" />
                    : <Bookmark size={18} />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </StudentLayout>
  );
}

function formatFee(min, max) {
  if (!min && !max) return "Fee not listed";
  const fmt = n => `₹${(n / 100000).toFixed(1)}L`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} / yr`;
  if (min) return `From ${fmt(min)} / yr`;
  return `Up to ${fmt(max)} / yr`;
}