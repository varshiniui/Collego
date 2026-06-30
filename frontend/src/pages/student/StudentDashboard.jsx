import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import StudentLayout from "../../components/student/StudentLayout";
import api from "../../lib/api";
import { Sparkles, GraduationCap, FileCheck, Award, Bookmark, ArrowRight } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard")
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0];

  return (
    <StudentLayout>
      <h1 className="font-display text-2xl font-bold text-ink mb-1">
        Hey {firstName}
      </h1>
      <p className="text-sm text-ink-soft mb-8">Here's where your college search stands.</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-card animate-pulse" style={{ boxShadow: "inset 0 0 0 1.5px #E3E3E0" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Sparkles size={16} />} label="Recommended" value={stats?.total_recommended ?? 0} />
          <StatCard icon={<GraduationCap size={16} />} label="Eligible" value={stats?.eligible_colleges ?? 0} accent="blue" />
          <StatCard icon={<FileCheck size={16} />} label="Applications" value={stats?.submitted_applications ?? 0} />
          <StatCard icon={<Award size={16} />} label="Offers" value={stats?.admission_offers ?? 0} accent="green" />
          <StatCard icon={<Bookmark size={16} />} label="Saved" value={stats?.saved_colleges ?? 0} />
        </div>
      )}

      {/* CTA if no recommendations yet */}
      {!loading && (stats?.total_recommended ?? 0) === 0 && (
        <div className="tilt-card rounded-cardLg p-8 text-center mb-8" style={{ "--tilt-border": "#E3E3E0" }}>
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={22} />
          </div>
          <h3 className="font-display font-bold text-ink mb-1.5">You don't have recommendations yet</h3>
          <p className="text-sm text-ink-soft mb-5 max-w-sm mx-auto">
            Complete your profile with your marks, interests, and budget so Collego's AI can match you with the right colleges.
          </p>
          <Link
            to="/student/profile"
            className="press-scale inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-600 transition"
          >
            Complete your profile <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* Recent recommendations preview */}
      {!loading && (stats?.total_recommended ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-ink">Top matches</h2>
            <Link to="/student/recommendations" className="text-sm font-medium text-primary-600 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-cardLg divide-y divide-hairline" style={{ boxShadow: "inset 0 0 0 1.5px #E3E3E0" }}>
            {stats.recent_recommendations.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-medium text-ink/80">{r.college_name}</span>
                <LevelBadge level={r.level} />
              </div>
            ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}

function StatCard({ icon, label, value, accent }) {
  const accentBg = accent === "blue" ? "bg-accentBlue-50 text-accentBlue-600"
    : accent === "green" ? "bg-accentGreen-50 text-accentGreen-600"
    : "bg-paper text-ink-soft";

  const handleMove = (e) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(500px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-2px)`;
  };
  const handleLeave = (e) => {
    e.currentTarget.style.transform = "perspective(500px) rotateX(0) rotateY(0) translateY(0)";
  };

  return (
    <div
      className="tilt-card rounded-card p-4"
      style={{ "--tilt-border": "#E3E3E0" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-3 ${accentBg}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold font-display text-ink">{value}</p>
      <p className="text-xs text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}

function LevelBadge({ level }) {
  const styles = {
    "Highly Recommended": "bg-accentGreen-50 text-accentGreen-600",
    "Recommended": "bg-primary-50 text-primary-700",
    "Suitable": "bg-amber-50 text-amber-700",
    "Alternative Option": "bg-gray-100 text-gray-600",
    "Over Budget": "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[level] || styles["Alternative Option"]}`}>
      {level}
    </span>
  );
}