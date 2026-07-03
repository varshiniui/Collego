import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { ArrowRight, GraduationCap, Users, ShieldCheck } from "lucide-react";

const ROLES = [
  { value: "student",   label: "Student",   desc: "Get AI college matches",  icon: GraduationCap },
  { value: "counselor", label: "Counselor", desc: "Guide students",          icon: Users },
  { value: "admin",     label: "Admin",     desc: "Manage the platform",     icon: ShieldCheck },
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
    <div className="min-h-screen flex" style={{ background: "#F7F7F5" }}>
      {/* Left panel */}
      <div
        className="hidden md:flex flex-col justify-between w-[42%] shrink-0 px-12 py-10"
        style={{ background: "#15151A" }}
      >
        <Link to="/" className="font-display text-xl font-extrabold text-white tracking-tight">
          Collego
        </Link>
        <div>
          <p className="font-display text-3xl font-extrabold text-white leading-snug mb-4 tracking-tight">
            Find the college<br />that fits your<br />actual marks.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#9b9b9f" }}>
            TNEA-formula cutoffs, real fees, real rankings — not a sponsored list.
          </p>
        </div>
        <p className="text-xs" style={{ color: "#5a5a60" }}>© {new Date().getFullYear()} Collego</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-display text-xl font-extrabold md:hidden block mb-8" style={{ color: "#15151A" }}>
            Collego
          </Link>

          <h1 className="font-display text-2xl font-extrabold mb-1 tracking-tight" style={{ color: "#15151A" }}>
            Create account
          </h1>
          <p className="text-sm mb-8" style={{ color: "#7a7a80" }}>
            Already registered? <Link to="/login" className="font-semibold" style={{ color: "#5C9C81" }}>Log in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: "#9b9b9f" }}>
                I am a
              </label>
              <div className="flex gap-2">
                {ROLES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    type="button" key={value}
                    onClick={() => setForm({ ...form, role: value })}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-xs font-medium transition"
                    style={
                      form.role === value
                        ? { background: "#EEF7F3", border: "1.5px solid #5C9C81", color: "#3B6553" }
                        : { background: "#fff", border: "1.5px solid #e8e8e6", color: "#7a7a80" }
                    }
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Full name">
              <input
                required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                style={{ border: "1.5px solid #e8e8e6", background: "#fff", color: "#15151A" }}
                onFocus={e => e.target.style.borderColor = "#5C9C81"}
                onBlur={e => e.target.style.borderColor = "#e8e8e6"}
              />
            </Field>

            <Field label="Email">
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                style={{ border: "1.5px solid #e8e8e6", background: "#fff", color: "#15151A" }}
                onFocus={e => e.target.style.borderColor = "#5C9C81"}
                onBlur={e => e.target.style.borderColor = "#e8e8e6"}
              />
            </Field>

            <Field label="Password">
              <input
                type="password" required minLength={6} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                style={{ border: "1.5px solid #e8e8e6", background: "#fff", color: "#15151A" }}
                onFocus={e => e.target.style.borderColor = "#5C9C81"}
                onBlur={e => e.target.style.borderColor = "#e8e8e6"}
              />
            </Field>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
              style={{ background: loading ? "#9b9b9f" : "#15151A", color: "#fff" }}
            >
              {loading ? "Creating…" : <><span>Create account</span> <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: "#9b9b9f" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
