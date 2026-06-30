import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import {
  Users, GraduationCap, FileCheck, Award, ShieldCheck,
  TrendingUp, ArrowRight, Activity
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard")
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Platform Overview</h1>
      <p className="text-sm text-ink-soft mb-8">Live metrics across students, counselors, and admissions.</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-card animate-pulse" style={{ boxShadow: "inset 0 0 0 1.5px #E3E3E0" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users size={16} />} label="Total Students" value={stats?.total_students ?? 0} />
          <StatCard icon={<ShieldCheck size={16} />} label="Counselors" value={stats?.total_counselors ?? 0} accent="blue" />
          <StatCard icon={<GraduationCap size={16} />} label="Colleges" value={stats?.total_colleges ?? 0} />
          <StatCard icon={<FileCheck size={16} />} label="Applications" value={stats?.total_applications ?? 0} />
          <StatCard icon={<Award size={16} />} label="Admission Success" value={`${stats?.admission_success_rate ?? 0}%`} accent="green" />
          <StatCard icon={<Activity size={16} />} label="AI Recommendations" value={stats?.total_recommendations ?? 0} />
          <StatCard icon={<TrendingUp size={16} />} label="Active Counselings" value={stats?.active_counselings ?? 0} />
          <StatCard icon={<Users size={16} />} label="Unassigned Students" value={stats?.unassigned_students ?? 0} />
        </div>
      )}

      {/* Charts row */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <ChartCard
            title="College Distribution"
            subtitle="By category"
            data={stats.college_distribution || []}
            color="#6366f1"
          />
          <ChartCard
            title="Course Popularity"
            subtitle="By student interest"
            data={stats.course_popularity || []}
            color="#0ea5e9"
          />
        </div>
      )}

      <h2 className="font-display font-bold text-ink/90 mb-3">Quick actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { to: "/admin/students",    label: "Manage Students",         desc: "View, assign counselors, toggle accounts" },
          { to: "/admin/counselors",  label: "Manage Counselors",       desc: "Add, review and deactivate counselors" },
          { to: "/admin/colleges",    label: "College Database",        desc: "Bulk upload or edit college records" },
          { to: "/admin/analytics",   label: "Reports & Analytics",     desc: "Admission trends, AI accuracy, cohort stats" },
          { to: "/admin/ai-settings", label: "AI Recommendation Rules", desc: "Tune weights and cutoffs for the AI engine" },
          { to: "/admin/settings",    label: "Platform Configuration",  desc: "Admission criteria, status flows, categories" },
        ].map(({ to, label, desc }) => (
          <Link
            key={to} to={to}
            className="press-scale flex items-start justify-between gap-3 bg-white rounded-xl px-5 py-4 hover:bg-primary-50/30 transition group"
            style={{ boxShadow: "inset 0 0 0 1.5px #E3E3E0" }}
          >
            <div>
              <p className="text-sm font-semibold text-ink/90 group-hover:text-primary-700 transition">{label}</p>
              <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
            </div>
            <ArrowRight size={15} className="text-ink-muted/60 group-hover:text-primary-500 mt-0.5 shrink-0 transition" />
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}

// ─── Horizontal bar chart (no external library) ───────────────────────────────

function ChartCard({ title, subtitle, data, color }) {
  if (!data.length) {
    return (
      <div
        className="bg-white rounded-card p-5"
        style={{ boxShadow: "inset 0 0 0 1.5px #E3E3E0" }}
      >
        <p className="text-sm font-semibold text-ink/90 mb-0.5">{title}</p>
        <p className="text-xs text-ink-muted mb-4">{subtitle}</p>
        <p className="text-xs text-ink-muted text-center py-6">No data yet</p>
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.count));

  return (
    <div
      className="bg-white rounded-card p-5"
      style={{ boxShadow: "inset 0 0 0 1.5px #E3E3E0" }}
    >
      <p className="text-sm font-semibold text-ink/90 mb-0.5">{title}</p>
      <p className="text-xs text-ink-muted mb-4">{subtitle}</p>
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ink-soft truncate max-w-[70%]">{d.label}</span>
              <span className="text-xs font-semibold text-ink/80 ml-2 shrink-0">{d.count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: max > 0 ? `${Math.round((d.count / max) * 100)}%` : "0%",
                  backgroundColor: color,
                  opacity: 1 - i * 0.08,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat card (unchanged from your original) ─────────────────────────────────

function StatCard({ icon, label, value, accent }) {
  const accentBg = accent === "blue"  ? "bg-accentBlue-50 text-accentBlue-600"
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