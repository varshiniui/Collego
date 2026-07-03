import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

/* ─── Mock recommendation data shown in the hero widget ─────────────────── */
const MOCK_COLLEGES = [
  { name: "PSG College of Technology", loc: "Coimbatore", score: 94, level: "Highly Recommended", dept: "CSE" },
  { name: "Government College of Technology", loc: "Coimbatore", score: 88, level: "Recommended", dept: "IT" },
  { name: "Thiagarajar College of Engineering", loc: "Madurai", score: 81, level: "Recommended", dept: "CSE" },
];

export default function Landing() {
  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, color: "#15151A", letterSpacing: "-0.3px" }}>
          Collego
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: "#7a7a80", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#15151A"}
            onMouseLeave={e => e.currentTarget.style.color = "#7a7a80"}>
            Log in
          </Link>
          <Link to="/register"
            style={{ fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 9, background: "#15151A", color: "#fff", textDecoration: "none", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#2a2a30"}
            onMouseLeave={e => e.currentTarget.style.background = "#15151A"}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero — split ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>

        {/* Left: copy */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "#3B6553", background: "#EEF7F3", padding: "5px 12px", borderRadius: 99, marginBottom: 28 }}>
            <Sparkles size={12} />
            AI-powered · Tamil Nadu colleges
          </div>

          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "clamp(2rem, 3.8vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-1.2px",
            color: "#15151A",
            marginBottom: 22
          }}>
            Find the college<br />
            <span style={{ fontWeight: 400, color: "#7a7a80" }}>that actually fits</span>{" "}
            <span style={{ color: "#5C9C81" }}>you.</span>
          </h1>

          <p style={{ fontSize: 15, lineHeight: 1.65, color: "#7a7a80", maxWidth: 400, marginBottom: 36 }}>
            Enter your 12th marks once. Collego runs the TNEA cutoff formula against
            279 colleges and shows you exactly where you stand — no guesswork, no paid listings.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Link to="/register"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, padding: "11px 22px", borderRadius: 10, background: "#5C9C81", color: "#fff", textDecoration: "none", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#4A8068"}
              onMouseLeave={e => e.currentTarget.style.background = "#5C9C81"}>
              Start for free <ArrowRight size={15} />
            </Link>
            <Link to="/login"
              style={{ fontSize: 14, fontWeight: 500, color: "#7a7a80", textDecoration: "none", transition: "color .15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#15151A"}
              onMouseLeave={e => e.currentTarget.style.color = "#7a7a80"}>
              I have an account →
            </Link>
          </div>

          {/* Social proof strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40, paddingTop: 32, borderTop: "1px solid #e8e8e6" }}>
            <Proof value="279" label="colleges indexed" />
            <div style={{ width: 1, height: 32, background: "#e8e8e6" }} />
            <Proof value="TNEA" label="formula accurate" />
            <div style={{ width: 1, height: 32, background: "#e8e8e6" }} />
            <Proof value="3 roles" label="student · counselor · admin" />
          </div>
        </div>

        {/* Right: live mock widget */}
        <HeroWidget />
      </section>

      {/* ── How it works — actual steps, genuinely sequential ────────────── */}
      <section style={{ background: "#15151A", padding: "72px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C9C81", marginBottom: 40 }}>
            How Collego works
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {[
              { step: "01", title: "Enter your marks", body: "12th percentage, stream, and optional TNEA subject scores. Takes two minutes." },
              { step: "02", title: "Get matched colleges", body: "The AI runs eligibility against every college's real cutoff. You see a ranked, scored list instantly." },
              { step: "03", title: "Track with a counselor", body: "A human counselor verifies your documents and keeps your application moving through each status." },
            ].map(({ step, title, body }, i) => (
              <div key={step} style={{ padding: "0 36px 0 0", borderLeft: i > 0 ? "1px solid #2a2a30" : "none", paddingLeft: i > 0 ? 36 : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#5C9C81", display: "block", marginBottom: 14 }}>{step}</span>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.2px" }}>{title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "#9b9b9f" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#15151A", letterSpacing: "-0.5px", marginBottom: 14 }}>
            Your marks are ready.<br />Your list isn't.
          </h2>
          <p style={{ fontSize: 14, color: "#7a7a80", lineHeight: 1.65, marginBottom: 32 }}>
            Create a free account and get your personalised college list in under five minutes.
          </p>
          <Link to="/register"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, padding: "12px 28px", borderRadius: 10, background: "#15151A", color: "#fff", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "#2a2a30"}
            onMouseLeave={e => e.currentTarget.style.background = "#15151A"}>
            Get my college list <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #e8e8e6", padding: "20px 28px", textAlign: "center", fontSize: 12, color: "#9b9b9f" }}>
        Built by Varshini · Collego · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

/* ── Live recommendation widget ─────────────────────────────────────────── */
function HeroWidget() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [counting, setCounting] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // Cycle through colleges every 2.8s
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % MOCK_COLLEGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // Animate score counter whenever college changes
  useEffect(() => {
    const target = MOCK_COLLEGES[activeIdx].score;
    setDisplayScore(0);
    setCounting(true);
    let start = null;
    const duration = 600;
    const tick = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      setDisplayScore(Math.round(pct * target));
      if (pct < 1) requestAnimationFrame(tick);
      else setCounting(false);
    };
    requestAnimationFrame(tick);
  }, [activeIdx]);

  const college = MOCK_COLLEGES[activeIdx];

  return (
    <div style={{
      background: "#15151A",
      borderRadius: 18,
      padding: "28px 24px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 24px 60px rgba(21,21,26,0.18)"
    }}>
      {/* Subtle glow */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(92,156,129,0.18) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C9C81", marginBottom: 4 }}>
            Your match
          </p>
          <p style={{ fontSize: 12, color: "#5a5a60" }}>Based on 90.4% · PCM+CS stream</p>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: "2.5px solid #5C9C81",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column"
        }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "'Sora', sans-serif" }}>{displayScore}</span>
          <span style={{ fontSize: 9, color: "#5C9C81", fontWeight: 600 }}>/ 100</span>
        </div>
      </div>

      {/* College cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOCK_COLLEGES.map((c, i) => (
          <div key={c.name}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: i === activeIdx ? "rgba(92,156,129,0.12)" : "rgba(255,255,255,0.04)",
              border: i === activeIdx ? "1px solid rgba(92,156,129,0.3)" : "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.35s ease",
              cursor: "default"
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: i === activeIdx ? "#fff" : "#6a6a70",
                  marginBottom: 3, transition: "color 0.35s",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {c.name}
                </p>
                <p style={{ fontSize: 11, color: "#5a5a60" }}>{c.dept} · {c.loc}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, flexShrink: 0, marginLeft: 10,
                background: c.level === "Highly Recommended" ? "rgba(92,156,129,0.2)" : "rgba(255,255,255,0.07)",
                color: c.level === "Highly Recommended" ? "#5C9C81" : "#5a5a60",
                border: c.level === "Highly Recommended" ? "1px solid rgba(92,156,129,0.3)" : "1px solid rgba(255,255,255,0.08)"
              }}>
                {c.level === "Highly Recommended" ? "★ Top match" : "Recommended"}
              </span>
            </div>
            {i === activeIdx && (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99, background: "#5C9C81",
                    width: `${c.score}%`, transition: "width 0.6s ease"
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Counselor note */}
      <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <CheckCircle2 size={14} style={{ color: "#5C9C81", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: "#5a5a60", lineHeight: 1.5 }}>
          Documents verified · Counselor assigned
        </p>
      </div>

      {/* Pagination dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
        {MOCK_COLLEGES.map((_, i) => (
          <div key={i} style={{
            width: i === activeIdx ? 18 : 5, height: 5, borderRadius: 99,
            background: i === activeIdx ? "#5C9C81" : "#2a2a30",
            transition: "all 0.3s ease"
          }} />
        ))}
      </div>
    </div>
  );
}

function Proof({ value, label }) {
  return (
    <div>
      <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: "#15151A", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#9b9b9f", marginTop: 3 }}>{label}</p>
    </div>
  );
}