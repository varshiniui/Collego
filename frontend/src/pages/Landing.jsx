import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

/* Real Tamil Nadu colleges with real departments */
const SAMPLE = [
  { rank: 1,  name: "PSG College of Technology",          dept: "B.E. Computer Science",       cutoff: 196.5, match: true  },
  { rank: 2,  name: "Coimbatore Institute of Technology", dept: "B.E. Computer Science",       cutoff: 193.0, match: true  },
  { rank: 3,  name: "Government College of Technology",   dept: "B.Tech Information Technology",cutoff: 191.5, match: true  },
  { rank: 4,  name: "Thiagarajar College of Engineering", dept: "B.E. Computer Science",       cutoff: 188.0, match: true  },
  { rank: 5,  name: "Sri Sivasubramaniya Nadar College",  dept: "B.E. Computer Science",       cutoff: 184.5, match: false },
];

export default function Landing() {
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <div style={{ background: "#fafaf8", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Nav ── very minimal, just anchors the page */}
      <nav style={{
        padding: "28px 48px 0",
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        maxWidth: 1020, margin: "0 auto"
      }}>
        <span style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 800,
          fontSize: 16, color: "#111", letterSpacing: "-0.3px"
        }}>
          Collego
        </span>
        <div style={{ display: "flex", gap: 28, alignItems: "baseline" }}>
          <Link to="/login" style={{ fontSize: 13, color: "#888", textDecoration: "none", fontWeight: 450 }}
            onMouseEnter={e => e.currentTarget.style.color = "#111"}
            onMouseLeave={e => e.currentTarget.style.color = "#888"}>
            Log in
          </Link>
          <Link to="/register" style={{
            fontSize: 13, color: "#111", textDecoration: "none",
            fontWeight: 600, borderBottom: "1.5px solid #111", paddingBottom: 1
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#4e8a70"; e.currentTarget.style.borderColor = "#4e8a70"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.borderColor = "#111"; }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1020, margin: "0 auto", padding: "72px 48px 0" }}>

        {/* Headline — single weight, single color, let the size do the work */}
        <h1 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "clamp(2.6rem, 5vw, 3.8rem)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-2px",
          color: "#111",
          margin: 0,
          maxWidth: 600
        }}>
          Your rank list,<br />before the results.
        </h1>

        {/* Subhead — two lines, plain, direct */}
        <p style={{
          fontSize: 15, lineHeight: 1.65, color: "#666",
          maxWidth: 420, marginTop: 20, marginBottom: 0
        }}>
          Enter your 12th marks. Collego calculates your TNEA cutoff and shows you
          every college in Tamil Nadu you can realistically get into — sorted by match.
        </p>

        {/* CTA — text link style, not a button block */}
        <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 32 }}>
          <Link to="/register" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, fontWeight: 650, color: "#fff",
            background: "#111", padding: "10px 20px", borderRadius: 7,
            textDecoration: "none", letterSpacing: "-0.1px"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#333"}
            onMouseLeave={e => e.currentTarget.style.background = "#111"}>
            See my colleges
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </Link>
          <Link to="/login" style={{
            fontSize: 13.5, color: "#999", textDecoration: "none"
          }}
            onMouseEnter={e => e.currentTarget.style.color = "#111"}
            onMouseLeave={e => e.currentTarget.style.color = "#999"}>
            Already have an account
          </Link>
        </div>
      </section>

      {/* ── The rank list — this IS the product, shown in the hero ── */}
      <section style={{ maxWidth: 1020, margin: "48px auto 0", padding: "0 48px" }}>

        {/* Table header — like a real rank list */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 200px 90px 80px",
          padding: "8px 16px",
          borderTop: "1.5px solid #111",
          borderBottom: "1px solid #e0e0dc"
        }}>
          {["#", "College / Department", "Location", "Cutoff", "Your match"].map(h => (
            <span key={h} style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "#999"
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {SAMPLE.map((c, i) => (
          <div
            key={c.rank}
            onMouseEnter={() => setHoveredRow(i)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 200px 90px 80px",
              padding: "14px 16px",
              borderBottom: "1px solid #e8e8e4",
              background: hoveredRow === i ? "#f0f0ee" : "transparent",
              transition: "background 0.12s",
              cursor: "default",
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: 12, color: "#bbb", fontVariantNumeric: "tabular-nums" }}>
              {c.rank}
            </span>
            <div>
              <p style={{
                fontSize: 13.5, fontWeight: 600, color: "#111",
                margin: 0, letterSpacing: "-0.1px"
              }}>
                {c.name}
              </p>
              <p style={{ fontSize: 11.5, color: "#999", margin: "2px 0 0" }}>
                {c.dept}
              </p>
            </div>
            <span style={{ fontSize: 12.5, color: "#555" }}>Tamil Nadu</span>
            <span style={{
              fontSize: 13, fontWeight: 600, color: "#111",
              fontVariantNumeric: "tabular-nums"
            }}>
              {c.cutoff}
            </span>
            <span style={{
              fontSize: 11.5, fontWeight: 700,
              color: c.match ? "#3d7a5c" : "#c0392b",
              background: c.match ? "#edf7f2" : "#fdf0ee",
              padding: "3px 10px", borderRadius: 5,
              display: "inline-block"
            }}>
              {c.match ? "Eligible" : "Below cutoff"}
            </span>
          </div>
        ))}

        {/* Blur overlay — implies there are more rows, drives sign-up */}
        <div style={{ position: "relative" }}>
          <div style={{
            height: 80,
            background: "linear-gradient(to bottom, transparent, #fafaf8 85%)",
            position: "absolute", top: -40, left: 0, right: 0,
            pointerEvents: "none"
          }} />
          <div style={{
            padding: "24px 16px 0",
            textAlign: "center"
          }}>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 14px" }}>
              +274 more colleges — based on your actual marks
            </p>
            <Link to="/register" style={{
              fontSize: 13, fontWeight: 600, color: "#3d7a5c",
              textDecoration: "none", borderBottom: "1.5px solid #3d7a5c",
              paddingBottom: 1
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              Enter your marks to see your full list →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works — inline, not a separate band ── */}
      <section style={{
        maxWidth: 1020, margin: "0 auto",
        padding: "80px 48px 0",
        display: "grid", gridTemplateColumns: "200px 1fr",
        gap: 64, alignItems: "start"
      }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#bbb", margin: 0
          }}>
            How it works
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
          {[
            { title: "Enter your marks", body: "12th percentage and stream. Maths, Physics, Chemistry if you have them — Collego calculates TNEA cutoff." },
            { title: "See your list", body: "Every eligible college ranked by match score. Fees, ranking, and cutoff shown side by side." },
            { title: "Track with a counselor", body: "A real counselor reviews your documents and updates your status as applications move forward." },
          ].map(({ title, body }) => (
            <div key={title}>
              <p style={{
                fontSize: 13.5, fontWeight: 650, color: "#111",
                marginBottom: 8, lineHeight: 1.3, letterSpacing: "-0.1px"
              }}>
                {title}
              </p>
              <p style={{ fontSize: 12.5, color: "#888", lineHeight: 1.65 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: 1020, margin: "80px auto 0",
        padding: "24px 48px",
        borderTop: "1px solid #e8e8e4",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 13, color: "#ccc" }}>
          Collego
        </span>
        <span style={{ fontSize: 11.5, color: "#bbb" }}>
          Built by Varshini for Tamil Nadu students · {new Date().getFullYear()}
        </span>
      </footer>

    </div>
  );
}