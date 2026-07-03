import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F7F7F5" }}>
      {/* Left panel — dark, brand */}
      <div
        className="hidden md:flex flex-col justify-between w-[42%] shrink-0 px-12 py-10"
        style={{ background: "#15151A" }}
      >
        <Link to="/" className="font-display text-xl font-extrabold text-white tracking-tight">
          Collego
        </Link>
        <div>
          <p
            className="font-display text-3xl font-extrabold text-white leading-snug mb-4 tracking-tight"
          >
            Your next chapter<br />starts with the<br />right college.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#9b9b9f" }}>
            AI-matched, counselor-verified, eligibility-first.
          </p>
        </div>
        <p className="text-xs" style={{ color: "#5a5a60" }}>
          © {new Date().getFullYear()} Collego
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="font-display text-xl font-extrabold md:hidden block mb-8" style={{ color: "#15151A" }}>
            Collego
          </Link>

          <h1 className="font-display text-2xl font-extrabold mb-1 tracking-tight" style={{ color: "#15151A" }}>
            Log in
          </h1>
          <p className="text-sm mb-8" style={{ color: "#7a7a80" }}>
            Don't have an account? <Link to="/register" className="font-semibold" style={{ color: "#5C9C81" }}>Sign up free</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                style={{ border: "1.5px solid #e8e8e6", background: "#fff", color: "#15151A" }}
                onFocus={e => e.target.style.borderColor = "#5C9C81"}
                onBlur={e => e.target.style.borderColor = "#e8e8e6"}
              />
            </Field>
            <Field label="Password">
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? "Logging in…" : <><span>Continue</span> <ArrowRight size={15} /></>}
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
