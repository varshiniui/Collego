import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles, MessageCircle, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="font-display text-xl font-extrabold tracking-tight text-ink">
          Collego
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-ink transition">
            Log in
          </Link>
          <Link
            to="/register"
            className="press-scale text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink/90 transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-20 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full mb-6">
          <Sparkles size={13} /> AI-powered admission guidance
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-ink leading-[1.05] mb-6">
          Find the college<br />that actually fits <span className="text-primary-500">you.</span>
        </h1>
        <p className="text-lg text-ink-soft max-w-xl mx-auto mb-10">
          Collego matches your marks, interests, and budget against real cutoffs to recommend
          colleges you're genuinely eligible for — no guesswork, no generic lists.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="press-scale inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-primary-600 transition"
          >
            Start your search <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="press-scale px-6 py-3.5 rounded-xl font-semibold text-ink border-1.5 border-hairline hover:border-ink/30 transition"
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* Feature grid — each card has its own distinct micro-interaction */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
          Why Collego
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <SpinStatCard />
          <TypingCard />
          <DrawLineCard />
        </div>
      </section>

      <footer className="border-t border-hairline py-8 text-center text-sm text-ink-muted">
        Built by Varshini · Collego
      </footer>
    </div>
  );
}

/* ── Card 1: click the stat, it flips into a badge ─────────────────────── */
function SpinStatCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="tilt-card text-left rounded-cardLg p-5 min-h-[158px] flex flex-col justify-between"
      style={{ "--tilt-border": "#E3E3E0" }}
      onMouseMove={(e) => tiltHandler(e)}
      onMouseLeave={(e) => tiltReset(e)}
    >
      <div
        className="font-display font-extrabold text-primary-500 transition-transform duration-300"
        style={{
          fontSize: flipped ? "20px" : "30px",
          transform: flipped ? "rotate(360deg) scale(1.05)" : "none",
        }}
      >
        {flipped ? "★ matched" : "92%"}
      </div>
      <div>
        <p className="font-bold text-sm text-ink mb-1">Eligibility-matched</p>
        <p className="text-ink-soft text-xs leading-relaxed">
          {flipped ? "That's the promise. Click again." : "of matches we show, you can realistically get into."}
        </p>
      </div>
    </button>
  );
}

/* ── Card 2: hover and the dots bounce like a live typing indicator ────── */
function TypingCard() {
  const [typing, setTyping] = useState(false);
  return (
    <div
      onMouseEnter={() => setTyping(true)}
      onMouseLeave={() => setTyping(false)}
      className="tilt-card rounded-cardLg p-5 min-h-[158px] flex flex-col justify-between cursor-pointer"
      style={{ "--tilt-border": "#E3E3E0" }}
      onMouseMove={(e) => tiltHandler(e)}
    >
      <div className="flex gap-1.5 h-6 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 rounded-full bg-accentBlue-500 transition-transform ${typing ? "typing-dot" : ""}`}
          />
        ))}
      </div>
      <div>
        <p className="font-bold text-sm text-ink mb-1">Ask anything, 24/7</p>
        <p className="text-ink-soft text-xs leading-relaxed">An AI counselor that already knows your profile.</p>
      </div>
    </div>
  );
}

/* ── Card 3: hover and a trendline draws itself, then resets ───────────── */
function DrawLineCard() {
  const lineRef = useRef(null);
  const dotRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const handleEnter = () => {
    if (drawing) return;
    setDrawing(true);
    const line = lineRef.current;
    const dot = dotRef.current;
    line.classList.add("drawn");
    setTimeout(() => { if (dot) dot.style.opacity = 1; }, 850);
    setTimeout(() => {
      line.classList.remove("drawn");
      if (dot) dot.style.opacity = 0;
      setDrawing(false);
    }, 2200);
  };

  return (
    <div
      onMouseEnter={handleEnter}
      className="tilt-card rounded-cardLg p-5 min-h-[158px] flex flex-col justify-between cursor-pointer"
      style={{ "--tilt-border": "#E3E3E0" }}
      onMouseMove={(e) => tiltHandler(e)}
      onMouseLeave={(e) => tiltReset(e)}
    >
      <svg width="70" height="32" viewBox="0 0 70 32" style={{ overflow: "visible" }}>
        <polyline
          ref={lineRef}
          points="0,26 16,20 32,22 48,9 64,11"
          fill="none"
          stroke="#2BA84A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="draw-line"
        />
        <circle ref={dotRef} cx="64" cy="11" r="4" fill="#2BA84A" style={{ opacity: 0, transition: "opacity 0.2s" }} />
      </svg>
      <div>
        <p className="font-bold text-sm text-ink mb-1">Track every step</p>
        <p className="text-ink-soft text-xs leading-relaxed">Watch your progress draw itself, hover to replay.</p>
      </div>
    </div>
  );
}

/* ── Shared tilt-on-hover physics ───────────────────────────────────────── */
function tiltHandler(e) {
  const card = e.currentTarget;
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  card.style.transform = `perspective(500px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-3px)`;
}
function tiltReset(e) {
  e.currentTarget.style.transform = "perspective(500px) rotateX(0) rotateY(0) translateY(0)";
}