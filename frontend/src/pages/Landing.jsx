import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, CheckCircle2, MapPin } from "lucide-react";

const MOCK_COLLEGES = [
  { name: "PSG College of Technology", loc: "Coimbatore", score: 94, tag: "Top match", dept: "B.E. CSE" },
  { name: "Government College of Technology", loc: "Coimbatore", score: 88, tag: "Recommended", dept: "B.Tech IT" },
  { name: "Thiagarajar College of Engineering", loc: "Madurai", score: 81, tag: "Recommended", dept: "B.E. CSE" },
];

export default function Landing() {
  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh" }}>

      {/* Nav — slightly uneven padding on purpose, logo sits lower visually */}
      <nav style={{
        maxWidth: 1080, margin: "0 auto",
        padding: "22px 32px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 800,
          fontSize: 17, color: "#15151A", letterSpacing: "-0.4px"
        }}>
          Collego
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link to="/login" style={{
            fontSize: 13.5, fontWeight: 500, color: "#9b9b9f",
            textDecoration: "none", letterSpacing: "0.01em"
          }}
            onMouseEnter={e => e.currentTarget.style.color = "#15151A"}
            onMouseLeave={e => e.currentTarget.style.color = "#9b9b9f"}>
            Log in
          </Link>
          <Link to="/register" style={{
            fontSize: 13, fontWeight: 600, padding: "8px 16px",
            borderRadius: 8, background: "#15151A", color: "#fff",
            textDecoration: "none", letterSpacing: "0.01em"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#2e2e35"}
            onMouseLeave={e => e.currentTarget.style.background = "#15151A"}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero — intentionally slightly unbalanced: left gets more room */}
      <section style={{
        maxWidth: 1080, margin: "0 auto",
        padding: "52px 32px 88px",
        display: "grid",
        gridTemplateColumns: "1.15fr 0.85fr",
        gap: 56,
        alignItems: "start"
      }}>

        {/* Left copy */}
        <div style={{ paddingTop: 8 }}>

          {/* Eyebrow — no icon, just text, reads more editorial */}
          <p style={{
            fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#5C9C81", marginBottom: 24
          }}>
            Tamil Nadu · TNEA · AI-matched
          </p>

          {/* Headline — three distinct lines with different weights */}
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.1rem, 3.5vw, 2.85rem)",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            color: "#15151A",
            marginBottom: 20,
            marginTop: 0
          }}>
            Stop guessing.<br />
            <span style={{ color: "#5C9C81" }}>Know</span> which colleges<br />
            <span style={{ fontWeight: 400, color: "#6b6b73" }}>will actually take you.</span>
          </h1>

          <p style={{
            fontSize: 14.5, lineHeight: 1.7, color: "#7a7a80",
            maxWidth: 380, marginBottom: 0, marginTop: 0
          }}>
            Most students apply to colleges and hope for the best.
            Collego runs your actual marks through the TNEA cutoff formula
            first — you only see colleges you're genuinely eligible for.
          </p>

          {/* Friction-reducing detail — real, specific, not hype */}
          <p style={{
            fontSize: 12.5, color: "#9b9b9f", marginTop: 14, marginBottom: 32
          }}>
            Takes about 3 minutes to set up. No entrance exam score needed to start.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Link to="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 13.5, fontWeight: 600, padding: "11px 22px",
              borderRadius: 9, background: "#5C9C81", color: "#fff",
              textDecoration: "none"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#4e8a70"}
              onMouseLeave={e => e.currentTarget.style.background = "#5C9C81"}>
              Find my colleges <ArrowRight size={14} />
            </Link>
            <Link to="/login" style={{
              fontSize: 13.5, color: "#9b9b9f", textDecoration: "none", fontWeight: 500
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#15151A"}
              onMouseLeave={e => e.currentTarget.style.color = "#9b9b9f"}>
              I already have an account →
            </Link>
          </div>

          {/* Stats — not identical widths, staggered so they feel noticed not placed */}
          <div style={{
            display: "flex", gap: 0, marginTop: 52,
            paddingTop: 28, borderTop: "1px solid #e4e4e2"
          }}>
            <StatPill value="279" label="colleges" note="indexed from Tamil Nadu" />
            <div style={{ width: 1, background: "#e4e4e2", margin: "0 24px", alignSelf: "stretch" }} />
            <StatPill value="TNEA" label="formula" note="same one colleges use" />
            <div style={{ width: 1, background: "#e4e4e2", margin: "0 24px", alignSelf: "stretch" }} />
            <StatPill value="free" label="to start" note="no credit card" />
          </div>
        </div>

        {/* Right: widget — positioned slightly lower so it doesn't perfectly mirror the headline */}
        <div style={{ paddingTop: 28 }}>
          <HeroWidget />
        </div>
      </section>

      {/* How it works — dark band, asymmetric internal padding */}
      <section style={{ background: "#15151A" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 32px 68px" }}>

          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.13em",
            textTransform: "uppercase", color: "#5C9C81", marginBottom: 44
          }}>
            How it works
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              {
                n: "1",
                title: "Enter your 12th marks",
                body: "Percentage, stream, Maths/Physics/Chemistry if you have them. Collego calculates your TNEA cutoff automatically."
              },
              {
                n: "2",
                title: "Get a ranked list",
                body: "Every college is scored against your actual cutoff. You see match %, fees range, and ranking — not a sponsored list."
              },
              {
                n: "3",
                title: "Track with a real counselor",
                body: "A counselor reviews your documents, adds notes, and updates your application status as things move."
              },
            ].map(({ n, title, body }, i) => (
              <div key={n} style={{
                paddingRight: 40,
                paddingLeft: i === 0 ? 0 : 40,
                borderLeft: i > 0 ? "1px solid #232328" : "none"
              }}>
                {/* Step number — large, faint, behind the content */}
                <span style={{
                  display: "block",
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 11, fontWeight: 700,
                  color: "#5C9C81", marginBottom: 16,
                  letterSpacing: "0.05em"
                }}>
                  Step {n}
                </span>
                <h3 style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 16,
                  fontWeight: 700, color: "#fff", marginBottom: 10,
                  lineHeight: 1.3, letterSpacing: "-0.1px"
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "#7a7a80" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA — left-aligned, not centered (reads more confident) */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 32px 88px" }}>
        <div style={{ maxWidth: 540 }}>
          <h2 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
            fontWeight: 800, color: "#15151A",
            letterSpacing: "-0.5px", lineHeight: 1.2,
            marginBottom: 14
          }}>
            Your results are already out.<br />
            Your list should be too.
          </h2>
          <p style={{
            fontSize: 14, color: "#7a7a80", lineHeight: 1.65, marginBottom: 28, maxWidth: 420
          }}>
            Create a free account, enter your marks, and get a ranked list of
            colleges you can actually get into.
          </p>
          <Link to="/register" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 13.5, fontWeight: 600, padding: "11px 24px",
            borderRadius: 9, background: "#15151A", color: "#fff",
            textDecoration: "none"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#2e2e35"}
            onMouseLeave={e => e.currentTarget.style.background = "#15151A"}>
            Get my list <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid #e4e4e2", padding: "18px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span style={{ fontSize: 12, color: "#9b9b9f" }}>
          Built by Varshini for Tamil Nadu students
        </span>
        <span style={{ fontSize: 12, color: "#c8c8c5" }}>Collego {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

/* ── Hero widget — looks like actual product UI, not a demo mockup ────── */
function HeroWidget() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayScore, setDisplayScore] = useState(MOCK_COLLEGES[0].score);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx(p => (p + 1) % MOCK_COLLEGES.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const target = MOCK_COLLEGES[activeIdx].score;
    let frame;
    let start = null;
    setDisplayScore(prev => prev); // hold old value while counting up
    const tick = ts => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / 550, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeIdx]);

  const college = MOCK_COLLEGES[activeIdx];

  return (
    <div style={{
      background: "#1a1a20",
      borderRadius: 14,
      overflow: "hidden",
      border: "1px solid #2a2a32",
      boxShadow: "0 20px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.12)"
    }}>

      {/* Window chrome — like a real browser/app frame */}
      <div style={{
        padding: "10px 14px",
        background: "#111116",
        borderBottom: "1px solid #222228",
        display: "flex", alignItems: "center", gap: 7
      }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3a3a40", display: "block" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3a3a40", display: "block" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3a3a40", display: "block" }} />
        <span style={{
          marginLeft: 8, fontSize: 10.5, color: "#4a4a52",
          fontFamily: "monospace", letterSpacing: "0.02em"
        }}>
          collego.app/recommendations
        </span>
      </div>

      {/* App content */}
      <div style={{ padding: "18px 18px 20px" }}>

        {/* Profile line */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, paddingBottom: 14,
          borderBottom: "1px solid #242428"
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#c8c8d0", marginBottom: 2 }}>
              Priya S. — 12th result
            </p>
            <p style={{ fontSize: 11, color: "#4a4a56" }}>
              90.4% · PCM+CS · Coimbatore
            </p>
          </div>
          {/* Score ring */}
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            border: "2px solid #5C9C81",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(92,156,129,0.07)"
          }}>
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1
            }}>
              {displayScore}
            </span>
            <span style={{ fontSize: 8, color: "#5C9C81", fontWeight: 600 }}>/100</span>
          </div>
        </div>

        {/* College rows — no border-radius overload, flat rows like a real table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MOCK_COLLEGES.map((c, i) => {
            const isActive = i === activeIdx;
            return (
              <div key={c.name} style={{
                padding: "11px 12px",
                borderRadius: 8,
                background: isActive ? "rgba(92,156,129,0.1)" : "transparent",
                border: `1px solid ${isActive ? "rgba(92,156,129,0.22)" : "transparent"}`,
                transition: "all 0.3s ease"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12.5, fontWeight: 600,
                      color: isActive ? "#e8e8f0" : "#52525c",
                      marginBottom: 3, lineHeight: 1.3,
                      transition: "color 0.3s"
                    }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: 11, color: "#3e3e48" }}>
                      {c.dept}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <MapPin size={9} color="#3e3e48" />
                      <span style={{ fontSize: 10.5, color: "#3e3e48" }}>{c.loc}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: isActive ? "#5C9C81" : "#3a3a44",
                      background: isActive ? "rgba(92,156,129,0.15)" : "rgba(255,255,255,0.04)",
                      padding: "2px 8px", borderRadius: 5,
                      display: "block", marginBottom: 4,
                      transition: "all 0.3s"
                    }}>
                      {c.tag}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isActive ? "#fff" : "#3a3a44",
                      fontFamily: "'Sora', sans-serif",
                      transition: "color 0.3s"
                    }}>
                      {c.score}%
                    </span>
                  </div>
                </div>

                {/* Score bar — only for active */}
                {isActive && (
                  <div style={{
                    marginTop: 10,
                    height: 2,
                    background: "#242428",
                    borderRadius: 99,
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${c.score}%`,
                      background: "#5C9C81",
                      borderRadius: 99,
                      transition: "width 0.55s cubic-bezier(0.4,0,0.2,1)"
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status line — like a real app footer */}
        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: "1px solid #1e1e24",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <CheckCircle2 size={12} color="#5C9C81" />
          <span style={{ fontSize: 11, color: "#3e3e48" }}>
            Documents verified by counselor
          </span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#2e2e36" }}>
            just now
          </span>
        </div>
      </div>
    </div>
  );
}

function StatPill({ value, label, note }) {
  return (
    <div>
      <p style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: 19, fontWeight: 800,
        color: "#15151A", lineHeight: 1, letterSpacing: "-0.3px"
      }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#4a4a54", marginTop: 3 }}>{label}</p>
      <p style={{ fontSize: 11, color: "#b0b0b8", marginTop: 1 }}>{note}</p>
    </div>
  );
}