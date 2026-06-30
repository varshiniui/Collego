import { useEffect, useState } from "react";
import CounselorLayout from "../../components/counselor/CounselorLayout";
import api from "../../lib/api";
import { Link } from "react-router-dom";
import { Users, ChevronRight, CheckCircle2, Clock } from "lucide-react";

export default function CounselorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/counselor/students")
      .then(res => setStudents(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CounselorLayout>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">My Students</h1>
      <p className="text-sm text-gray-500 mb-6">Students assigned to you for counseling and verification.</p>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <Users className="mx-auto text-primary-400 mb-3" size={28} />
          <h3 className="font-display font-bold text-gray-900 mb-1.5">No students assigned yet</h3>
          <p className="text-sm text-gray-500">Once an administrator assigns students to you, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const profile = s.student_profiles;
            const verified = profile?.application_status && profile.application_status !== "Profile Created";
            return (
              <Link
                key={s.student_id}
                to={`/counselor/students/${s.student_id}`}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary-200 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center font-display font-bold text-primary-700">
                    {s.users?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900">{s.users?.name}</h3>
                    <p className="text-xs text-gray-500">{s.users?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {verified ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {profile?.application_status || "Profile Created"}
                  </span>
                  <ChevronRight className="text-gray-300" size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </CounselorLayout>
  );
}