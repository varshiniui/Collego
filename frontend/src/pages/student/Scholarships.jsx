import { useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import {
  Award,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Landmark,
  CheckCircle2,
  IndianRupee,
  FileText,
  CalendarClock,
  Circle,
} from "lucide-react";

const FIELD_ICONS = {
  "Awarding body":            Landmark,
  "Eligibility criteria":     CheckCircle2,
  "Approximate amount":       IndianRupee,
  "Amount":                   IndianRupee,
  "How to apply":             FileText,
  "Application deadline":     CalendarClock,
  "Deadline":                 CalendarClock,
};

function getIcon(heading) {
  for (const [key, icon] of Object.entries(FIELD_ICONS)) {
    if (heading.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return Circle;
}

// Strip markdown bold/italic markers
function clean(text) {
  return text.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1").replace(/_{1,2}([^_]+)_{1,2}/g, "$1").trim();
}

// Parse the AI response into scholarship objects
// Each scholarship starts with a numbered heading, followed by bullet lines
function parseScholarships(text) {
  if (!text) return [];

  // Split on numbered headings: "1.", "1)", "**1.**", "### 1." etc.
  const chunks = text.split(/\n(?=\s*(?:#{1,6}\s*)?(?:\*{0,2})\s*\d+[.)]\s)/);

  const scholarships = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map(l => clean(l).trim()).filter(Boolean);
    if (!lines.length) continue;

    // First line is the heading — strip the number prefix
    const heading = lines[0].replace(/^(?:#{1,6}\s*)?(?:\*{0,2})\s*\d+[.)]\s*(?:\*{0,2})\s*/, "").trim();
    if (!heading) continue;

    // Remaining lines are fields
    const fields = [];
    for (const line of lines.slice(1)) {
      const stripped = line.replace(/^[-*•]\s*/, "").trim();
      if (!stripped) continue;

      const colonIdx = stripped.indexOf(":");
      if (colonIdx > 0 && colonIdx < 50) {
        const key   = stripped.slice(0, colonIdx).trim();
        const value = stripped.slice(colonIdx + 1).trim();
        if (value) fields.push({ key, value });
      } else if (stripped.length > 5) {
        fields.push({ key: null, value: stripped });
      }
    }

    if (heading) scholarships.push({ heading, fields });
  }

  return scholarships;
}

export default function Scholarships() {
  const [loading, setLoading]   = useState(false);
  const [scholarships, setScholarships] = useState(null);
  const [rawText, setRawText]   = useState(null);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetch = async () => {
    setLoading(true);
    setError(null);
    setScholarships(null);
    setRawText(null);
    try {
      const res = await api.post("/ai/scholarships");
      const text = res.data.scholarships;
      setRawText(text);
      const parsed = parseScholarships(text);
      setScholarships(parsed);
      // Expand first one by default
      if (parsed.length > 0) setExpanded({ 0: true });
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Scholarships</h1>
      <p className="text-sm text-gray-500 mb-6">
        AI-matched scholarships based on your academic profile, stream, and state.
      </p>

      {/* Initial CTA */}
      {!scholarships && !loading && !error && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Award size={24} className="text-amber-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 mb-2">Find scholarships you qualify for</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Based on your 12th percentage, stream, state, and course preference, we'll suggest
            real Indian scholarships you can apply for right now.
          </p>
          <button
            onClick={fetch}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition"
          >
            Find my scholarships
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <Loader2 size={28} className="animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Finding scholarships matched to your profile…</p>
          <p className="text-xs text-gray-400 mt-1">This takes about 10 seconds</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-4">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          {error.toLowerCase().includes("percentage") && (
            <p className="text-xs text-red-400 mt-1">
              Go to <span className="font-medium">My Profile</span> and save your 12th percentage first.
            </p>
          )}
          <button onClick={fetch} className="mt-3 text-xs font-semibold text-red-500 hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {scholarships && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {scholarships.length} scholarship{scholarships.length !== 1 ? "s" : ""} found for your profile
            </p>
            <button onClick={fetch} className="text-xs text-primary-600 hover:underline">
              Refresh
            </button>
          </div>

          {scholarships.length > 0 ? (
            <div className="space-y-3">
              {scholarships.map((s, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span className="flex-1 font-display font-bold text-sm text-gray-900">{s.heading}</span>
                    {expanded[i]
                      ? <ChevronUp size={15} className="text-gray-400 shrink-0" />
                      : <ChevronDown size={15} className="text-gray-400 shrink-0" />
                    }
                  </button>

                  {/* Fields */}
                  {expanded[i] && s.fields.length > 0 && (
                    <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-2.5">
                      {s.fields.map((f, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          {f.key ? (
                            <>
                              {(() => {
                                const Icon = getIcon(f.key);
                                return <Icon size={14} className="text-gray-400 shrink-0 mt-0.5" />;
                              })()}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {f.key}
                                </span>
                                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                                  {f.key.toLowerCase().includes("apply") && f.value.startsWith("http") ? (
                                    <a
                                      href={f.value}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary-600 hover:underline inline-flex items-center gap-1"
                                    >
                                      {f.value} <ExternalLink size={11} />
                                    </a>
                                  ) : f.value}
                                </p>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed">{f.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Fallback: raw text if parsing completely fails
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{rawText}</pre>
            </div>
          )}
        </>
      )}
    </StudentLayout>
  );
}