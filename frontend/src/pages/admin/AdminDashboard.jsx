import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(" ")[0];

  useEffect(() => {
    api.get("/admin/dashboard")
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-9">
        <p className="text-sm font-medium mb-1" style={{ color: "#5C9C81" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#15151A" }}>
          Good {hour()}, {firstName}.
        </h1>
        <p className="text-sm mt-1" style={{ color: "#7a7a80" }}>Here's what's happening on the platform.</p>
      </div>

      {/* Stat strip — no icon boxes, just numbers with left-border accent */}
      {loading ? (
        <div className="grid grid-cols-4 gap-3 mb-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "#ebebea" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Stat label="Students"         value={stats?.total_students ?? 0}        accent="#5C9C81" />
          <Stat label="Counselors"       value={stats?.total_counselors ?? 0}       accent="#3D6BFF" />
          <Stat label="Colleges"         value={stats?.total_colleges ?? 0}         accent="#15151A" />
          <Stat label="Applications"     value={stats?.total_applications ?? 0}     accent="#5C9C81" />
          <Stat label="Success rate"     value={`${stats?.admission_success_rate ?? 0}%`} accent="#2BA84A" />
          <Stat label="AI matched"       value={stats?.total_recommendations ?? 0}  accent="#3D6BFF" />
          <Stat label="Active counselings" value={stats?.active_counselings ?? 0}   accent="#5C9C81" />
          <Stat label="Unassigned"       value={stats?.unassigned_students ?? 0}    accent="#e05252" />
        </div>
      )}

      {/* Actions — two-column list, not cards */}
      <div className="mb-2 pb-2" style={{ borderBottom: "1px solid #e8e8e6" }}>
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#9b9b9f" }}>
          Quick actions
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px mt-0" style={{ background: "#e8e8e6" }}>
        {[
          { to: "/admin/students",     label: "Students",            desc: "Accounts · assignments" },
          { to: "/admin/counselors",   label: "Counselors",          desc: "Access · student load" },
          { to: "/admin/colleges",     label: "Colleges",            desc: "Database · bulk CSV upload" },
          { to: "/admin/analytics",    label: "Reports",             desc: "Trends · downloadable CSVs" },
          { to: "/admin/ai-settings",  label: "AI Settings",         desc: "Scoring weights · thresholds" },
          { to: "/admin/settings",     label: "Platform config",     desc: "Criteria · categories" },
        ].map(({ to, label, desc }) => (
          <Link
            key={to} to={to}
            className="group flex items-center justify-between px-5 py-4 transition-colors"
            style={{ background: "#fff" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F7F7F5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "#15151A" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9b9b9f" }}>{desc}</p>
            </div>
            <span className="text-lg font-light transition-transform group-hover:translate-x-0.5" style={{ color: "#d4d4d1" }}>→</span>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div
      className="rounded-xl px-4 py-4"
      style={{ background: "#fff", borderLeft: `3px solid ${accent}` }}
    >
      <p
        className="font-display text-2xl font-extrabold tracking-tight leading-none mb-1"
        style={{ color: "#15151A" }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: "#9b9b9f" }}>{label}</p>
    </div>
  );
}

function hour() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
