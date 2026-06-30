import { useState } from "react";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import { BookOpen, Loader2, Target, Clock, Zap, TrendingUp, Award } from "lucide-react";

const PHASES = [
  {
    key: "IMMEDIATE",
    label: "Next 3 months",
    icon: Zap,
    bg: "bg-primary-50",
    border: "border-primary-100",
    iconColor: "text-primary-600",
    headingColor: "text-primary-700",
  },
  {
    key: "SHORT TERM",
    label: "First year of college",
    icon: Clock,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconColor: "text-emerald-600",
    headingColor: "text-emerald-700",
  },
  {
    key: "MEDIUM TERM",
    label: "2nd and 3rd year",
    icon: TrendingUp,
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconColor: "text-amber-600",
    headingColor: "text-amber-700",
  },
  {
    key: "LONG TERM",
    label: "Final year & beyond",
    icon: Award,
    bg: "bg-purple-50",
    border: "border-purple-100",
    iconColor: "text-purple-600",
    headingColor: "text-purple-700",
  },
];

// Strip markdown bold markers and return clean text
function clean(text) {
  return text.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1").trim();
}

// Parse the AI response into phase sections, then into bullet points per section
function parseResponse(text) {
  if (!text) return [];

  const result = [];

  for (const phase of PHASES) {
    // Match the phase heading and everything until the next phase or end
    const otherKeys = PHASES.filter(p => p.key !== phase.key).map(p => p.key);
    const endPattern = otherKeys.map(k => k.replace(" ", "\\s+")).join("|");
    const regex = new RegExp(
      `(?:\\*{0,2})${phase.key.replace(" ", "[\\s\\S]{0,10}")}[^\\n]*(?:\\*{0,2})[\\s\\S]*?\\n([\\s\\S]*?)(?=(?:\\*{0,2})(?:${endPattern})|$)`,
      "i"
    );
    const match = text.match(regex);
    if (!match) continue;

    const body = match[1].trim();
    // Split into bullet points — lines starting with -, •, or numbered
    const bullets = body
      .split(/\n/)
      .map(l => clean(l).replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim())
      .filter(l => l.length > 10);

    // Group bullets under sub-headings if they contain a colon at the start
    const grouped = [];
    let current = null;
    for (const bullet of bullets) {
      // Detect sub-heading: short phrase followed by colon then content
      const colonIdx = bullet.indexOf(":");
      if (colonIdx > 0 && colonIdx < 60) {
        const heading = bullet.slice(0, colonIdx).trim();
        const content = bullet.slice(colonIdx + 1).trim();
        if (content) {
          grouped.push({ heading, content });
        } else {
          current = heading;
        }
      } else if (current) {
        grouped.push({ heading: current, content: bullet });
        current = null;
      } else {
        grouped.push({ heading: null, content: bullet });
      }
    }

    result.push({ phase, items: grouped });
  }

  // Fallback: if no phases parsed, split by double newlines into plain blocks
  if (result.length === 0) {
    return [{ phase: PHASES[0], items: text.split(/\n\n+/).filter(Boolean).map(b => ({ heading: null, content: clean(b) })) }];
  }

  return result;
}

export default function LearningPath() {
  const [careerGoal, setCareerGoal] = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [rawText, setRawText]       = useState(null);
  const [error, setError]           = useState(null);

  const generate = async (goal) => {
    const g = goal ?? careerGoal;
    setLoading(true);
    setError(null);
    setResult(null);
    setRawText(null);
    try {
      const res = await api.post("/ai/learning-path", { career_goal: g });
      const text = res.data.learning_path;
      setRawText(text);
      setResult(parseResponse(text));
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setRawText(null); setError(null); };

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Learning Path</h1>
      <p className="text-sm text-gray-500 mb-6">
        A personalised roadmap from now through placement, built around your profile and career goal.
      </p>

      {/* Input card — always visible until result is shown */}
      {!result && !loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <Target size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">What's your career goal?</p>
              <p className="text-xs text-gray-400">Optional — leave blank for a general path</p>
            </div>
          </div>
          <input
            value={careerGoal}
            onChange={e => setCareerGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generate()}
            placeholder="e.g. Software Engineer, Data Scientist, Civil Services, Law…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 mb-4"
          />
          <button
            onClick={() => generate()}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition"
          >
            Generate my learning path
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <Loader2 size={28} className="animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Building your personalised learning path…</p>
          <p className="text-xs text-gray-400 mt-1">This takes about 10 seconds</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-4">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={reset} className="mt-2 text-xs font-semibold text-red-500 hover:underline">Try again</button>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Goal + regenerate bar */}
          <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 mb-5">
            <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
              <Target size={14} className="text-primary-500 shrink-0" />
              <span className="text-gray-400">Goal:</span>
              <span className="font-medium truncate">{careerGoal || "General career path"}</span>
            </div>
            <button
              onClick={reset}
              className="text-xs text-primary-600 hover:underline shrink-0 ml-3"
            >
              Regenerate
            </button>
          </div>

          {/* Phase cards */}
          <div className="space-y-4">
            {result.map(({ phase, items }) => {
              const Icon = phase.icon;
              return (
                <div key={phase.key} className={`border rounded-2xl overflow-hidden ${phase.border}`}>
                  {/* Phase header */}
                  <div className={`px-5 py-3.5 flex items-center gap-3 ${phase.bg}`}>
                    <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={phase.iconColor} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide opacity-60 ${phase.headingColor}`}>
                        {phase.label}
                      </p>
                      <p className={`font-display font-bold text-sm ${phase.headingColor}`}>
                        {phase.key.charAt(0) + phase.key.slice(1).toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Phase body */}
                  <div className="px-5 py-4 bg-white space-y-3">
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-400">No details available for this phase.</p>
                    ) : (
                      items.map((item, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${phase.iconColor} opacity-60`}
                            style={{ background: "currentColor" }} />
                          <div className="flex-1 min-w-0">
                            {item.heading && (
                              <span className="text-xs font-semibold text-gray-700">{item.heading}: </span>
                            )}
                            <span className="text-sm text-gray-600 leading-relaxed">{item.content}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </StudentLayout>
  );
}