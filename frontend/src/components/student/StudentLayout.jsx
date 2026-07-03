import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard, UserCircle, Sparkles, Search, MessagesSquare,
  Bookmark, FileText, FileCheck, LogOut, Award, BookOpen,
  MessageCircle, ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../lib/api";

const NAV = [
  { to: "/student/dashboard",      label: "Dashboard",        icon: LayoutDashboard },
  { to: "/student/profile",        label: "My Profile",       icon: UserCircle },
  { to: "/student/documents",      label: "Documents",        icon: FileText },
  { to: "/student/recommendations",label: "Recommendations",  icon: Sparkles },
  { to: "/student/applications",   label: "Applications",     icon: FileCheck },
  { to: "/student/search",         label: "Search Colleges",  icon: Search },
  { to: "/student/saved",          label: "Saved",            icon: Bookmark },
  { to: "/student/eligibility",    label: "Eligibility",      icon: ShieldCheck },
  { to: "/student/scholarships",   label: "Scholarships",     icon: Award },
  { to: "/student/learning-path",  label: "Learning Path",    icon: BookOpen },
  { to: "/student/messages",       label: "Messages",         icon: MessageCircle, badge: true },
  { to: "/student/chatbot",        label: "Ask Collego AI",   icon: MessagesSquare },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/messages/unread-count")
      .then(res => setUnread(res.data.unread || 0))
      .catch(() => {});
    const id = setInterval(() => {
      api.get("/messages/unread-count").then(res => setUnread(res.data.unread || 0)).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex" style={{ background: "#F7F7F5" }}>
      <aside
        className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
        style={{ background: "#15151A" }}
      >
        <div className="px-5 pt-6 pb-5">
          <Link to="/" className="font-display font-extrabold text-white text-lg tracking-tight block">
            Collego
          </Link>
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5 block" style={{ color: "#5C9C81" }}>
            Student
          </span>
        </div>

        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, badge }) => {
            const active = pathname === to;
            return (
              <Link
                key={to} to={to}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={active ? { background: "#5C9C81", color: "#fff" } : { color: "#9b9b9f" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#9b9b9f"; }}
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {badge && unread > 0 && (
                  <span className="w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ background: "#5C9C81", color: "#fff" }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

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

      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-10 py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
