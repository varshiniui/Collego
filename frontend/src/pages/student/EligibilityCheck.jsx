import { useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import { ShieldCheck, Loader2, RefreshCw, AlertCircle } from "lucide-react";

const LEVEL_STYLES = {
  "Eligible":     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  "Borderline":   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100"   },
  "Not Eligible": { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-100"     },
};

// Parse the AI response into sections per college type
// Looks for numbered lines like "1. Government Engineering..." or "**1.**" etc.
function parseSections(text) {
  const lines = text.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^\*{0,2}(\d+)[.)]\s*\*{0,2}(.+)/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[2].replace(/\*+/g, "").trim(), body: [] };
    } else if (current && line.trim()) {
      current.body.push(line.replace(/\*+/g, "").trim());
    }
  }
  if (current) sections.push(current);
  return sections;
}

function detectLevel(body) {
  const text = body.join(" ").toLowerCase();
  if (text.includes("not eligible")) return "Not Eligible";
  if (text.includes("borderline"))   return "Borderline";
  if (text.includes("eligible"))     return "Eligible";
  return null;
}

export default function EligibilityCheck() {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post("/ai/eligibility-check");
      setResult(res.data.analysis);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const sections = result ? parseSections(result) : [];

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Admission Eligibility</h1>
      <p className="text-sm text-gray-500 mb-6">
        AI analysis of your eligibility across different college types based on your academic profile.
      </p>

      {/* Initial CTA */}
      {!result && !loading && !error && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} className="text-primary-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 mb-2">Check your eligibility</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            We'll analyse your 12th percentage, stream, and entrance exam scores against
            government and private college requirements across India.
          </p>
          <button
            onClick={run}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition"
          >
            Run eligibility check
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <Loader2 size={28} className="animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Analysing your academic profile…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-4 flex items-start gap-3">
          <AlertCircle size={17} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-700 font-medium">{error}</p>
            {error.includes("12th percentage") && (
              <p className="text-xs text-red-400 mt-1">
                Go to <span className="font-medium">My Profile</span> and add your 12th percentage to continue.
              </p>
            )}
            <button onClick={run} className="mt-3 text-xs font-semibold text-red-600 hover:underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {sections.length > 0 ? `${sections.length} college types analysed` : "Analysis complete"}
            </p>
            <button
              onClick={run}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline"
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>

          {sections.length > 0 ? (
            <div className="space-y-3">
              {sections.map((sec, i) => {
                const level = detectLevel(sec.body);
                const style = LEVEL_STYLES[level] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" };
                return (
                  <div key={i} className={`border rounded-2xl overflow-hidden ${style.border}`}>
                    <div className={`px-5 py-3 flex items-center justify-between ${style.bg}`}>
                      <h3 className={`font-display font-bold text-sm ${style.text}`}>{sec.title}</h3>
                      {level && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                          {level}
                        </span>
                      )}
                    </div>
                    <div className="px-5 py-4 bg-white space-y-1.5">
                      {sec.body.map((line, j) => (
                        <p key={j} className="text-sm text-gray-600 leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback — raw text if parsing finds no sections
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
            </div>
          )}
        </>
      )}
    </StudentLayout>
  );
}