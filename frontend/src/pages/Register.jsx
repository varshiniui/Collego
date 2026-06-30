import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { ArrowRight, GraduationCap, Users, ShieldCheck } from "lucide-react";

const ROLES = [
  { value: "student", label: "Student", desc: "Get college recommendations", icon: GraduationCap },
  { value: "counselor", label: "Counselor", desc: "Guide students", icon: Users },
  { value: "admin", label: "Admin", desc: "Manage the platform", icon: ShieldCheck },
];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      toast.success(`Welcome to Collego, ${user.name.split(" ")[0]}`);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fadeUp">
        <Link to="/" className="font-display text-xl font-extrabold text-ink mb-8 block text-center">
          Collego
        </Link>
        <div className="tilt-card rounded-cardLg p-8" style={{ "--tilt-border": "#E3E3E0" }}>
          <h1 className="font-display text-2xl font-bold text-ink mb-1">Create your account</h1>
          <p className="text-sm text-ink-soft mb-6">Start finding colleges that fit you</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon }) => (
                  <button
                    type="button" key={value}
                    onClick={() => setForm({ ...form, role: value })}
                    className={`press-scale flex flex-col items-center gap-1.5 py-3 rounded-xl border-1.5 text-xs font-medium transition ${
                      form.role === value
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-hairline text-ink-soft hover:border-ink/20"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Full name</label>
              <input
                required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-1.5 border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Email</label>
              <input
                type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-1.5 border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Password</label>
              <input
                type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-1.5 border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="At least 6 characters"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="press-scale w-full bg-primary-500 text-white font-semibold py-2.5 rounded-xl hover:bg-primary-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Creating account..." : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-soft mt-6">
          Already have an account? <Link to="/login" className="text-primary-600 font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}