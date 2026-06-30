import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Settings2,
  BarChart3, LogOut, ShieldCheck, BrainCircuit
} from "lucide-react";

const NAV = [
  { to: "/admin/dashboard",   label: "Overview",         icon: LayoutDashboard },
  { to: "/admin/students",    label: "Students",         icon: Users },
  { to: "/admin/counselors",  label: "Counselors",       icon: ShieldCheck },
  { to: "/admin/colleges",    label: "Colleges",         icon: GraduationCap },
  { to: "/admin/courses",     label: "Courses",          icon: BookOpen },
  { to: "/admin/analytics",   label: "Reports",          icon: BarChart3 },
  { to: "/admin/ai-settings", label: "AI Settings",      icon: BrainCircuit },
  { to: "/admin/settings",    label: "Platform Config",  icon: Settings2 },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-hairline bg-white flex flex-col h-screen sticky top-0">
        <Link to="/" className="font-display text-xl font-extrabold text-ink px-6 py-6 block">
          Collego <span className="text-xs font-semibold text-ink-muted ml-1">Admin</span>
        </Link>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to} to={to}
                className={`press-scale flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-primary-50 text-primary-700" : "text-ink-soft hover:bg-paper"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 pt-3 border-t border-hairline">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
            <p className="text-xs text-ink-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="press-scale flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-ink-soft hover:bg-paper w-full"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 px-10 py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}