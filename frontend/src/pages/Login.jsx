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
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fadeUp">
        <Link to="/" className="font-display text-xl font-extrabold text-ink mb-8 block text-center">
          Collego
        </Link>
        <div className="tilt-card rounded-cardLg p-8" style={{ "--tilt-border": "#E3E3E0" }}>
          <h1 className="font-display text-2xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-ink-soft mb-6">Log in to continue your search</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-1.5 border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-1.5 border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="press-scale w-full bg-primary-500 text-white font-semibold py-2.5 rounded-xl hover:bg-primary-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Logging in..." : <>Log in <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-soft mt-6">
          New to Collego? <Link to="/register" className="text-primary-600 font-semibold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}