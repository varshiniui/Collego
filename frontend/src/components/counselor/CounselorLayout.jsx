import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LayoutDashboard, Users, LogOut, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../lib/api";

const NAV = [
  { to: "/counselor/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { to: "/counselor/students",  label: "My Students", icon: Users },
  { to: "/counselor/messages",  label: "Messages",    icon: MessageCircle, badge: true },
];

export default function CounselorLayout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/messages/unread-count")
      .then(res => setUnread(res.data.unread || 0))
      .catch(() => {});
    const interval = setInterval(() => {
      api.get("/messages/unread-count")
        .then(res => setUnread(res.data.unread || 0))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper)] flex">
      <aside className="w-60 shrink-0 border-r border-gray-100 bg-white flex flex-col h-screen sticky top-0">
        <Link to="/" className="font-display text-xl font-extrabold text-primary-700 px-6 py-6 block">
          Collego
        </Link>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, badge }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {badge && unread > 0 && (
                  <span className="w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 pt-3 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 w-full"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-10 py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}