import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Settings2,
  BarChart3, LogOut, ShieldCheck, BrainCircuit, Activity
} from "lucide-react";

const NAV = [
  { to: "/admin/dashboard",   label: "Overview",        icon: LayoutDashboard },
  { to: "/admin/students",    label: "Students",        icon: Users },
  { to: "/admin/counselors",  label: "Counselors",      icon: ShieldCheck },
  { to: "/admin/colleges",    label: "Colleges",        icon: GraduationCap },
  { to: "/admin/courses",     label: "Courses",         icon: BookOpen },
  { to: "/admin/analytics",   label: "Reports",         icon: BarChart3 },
  { to: "/admin/ai-settings", label: "AI Settings",     icon: BrainCircuit },
  { to: "/admin/settings",    label: "Config",          icon: Settings2 },
  { to: "/admin/activity-log",label: "Activity",        icon: Activity },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex" style={{ background: "#F7F7F5" }}>
      {/* Dark sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
        style={{ background: "#15151A" }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <Link to="/" className="font-display font-extrabold text-white text-lg tracking-tight block">
            Collego
          </Link>
          <span
            className="text-[10px] font-bold tracking-widest uppercase mt-0.5 block"
            style={{ color: "#5C9C81" }}
          >
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? { background: "#5C9C81", color: "#fff" }
                    : { color: "#9b9b9f" }
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#9b9b9f"; }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-5 pt-3" style={{ borderTop: "1px solid #2a2a30" }}>
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: "#9b9b9f" }}>{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition"
            style={{ color: "#9b9b9f" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#2a2a30"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#9b9b9f"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-10 py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
