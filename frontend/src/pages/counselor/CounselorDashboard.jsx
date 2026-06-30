import { useEffect, useState } from "react";
import CounselorLayout from "../../components/counselor/CounselorLayout";
import api from "../../lib/api";
import { Link } from "react-router-dom";
import { Users, ClipboardCheck, MessageSquare, TrendingUp, ChevronRight } from "lucide-react";

export default function CounselorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/counselor/dashboard")
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Students Assigned", value: stats?.total_students, icon: Users },
    { label: "Pending Verifications", value: stats?.pending_verifications, icon: ClipboardCheck },
    { label: "Counseling Sessions", value: stats?.counseling_sessions, icon: MessageSquare },
    { label: "Admission Success Rate", value: stats ? `${stats.admission_success_rate}%` : undefined, icon: TrendingUp },
  ];

  return (
    <CounselorLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">An overview of your assigned students and counseling activity.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <Icon className="text-primary-500 mb-3" size={20} />
            <p className="text-2xl font-display font-bold text-gray-900">
              {loading ? <span className="inline-block h-7 w-10 bg-gray-100 rounded animate-pulse" /> : value ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-gray-900 mb-1">Your students</h3>
            <p className="text-sm text-gray-500">Review profiles, verify academics, and add counseling notes.</p>
          </div>
          <Link
            to="/counselor/students"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition whitespace-nowrap"
          >
            View all students <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </CounselorLayout>
  );
}