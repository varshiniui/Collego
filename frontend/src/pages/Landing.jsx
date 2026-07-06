import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const MOCK = [
  { name: "PSG College of Technology",          dept: "B.E. Computer Science",        score: 94, top: true  },
  { name: "Government College of Technology",   dept: "B.Tech Information Technology", score: 88, top: false },
  { name: "Thiagarajar College of Engineering", dept: "B.E. Computer Science",        score: 81, top: false },
];

export default function Landing() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayScore, setDisplayScore] = useState(MOCK[0].score);

  useEffect(() => {
    const id = setInterval(() => setActiveIdx(p => (p + 1) % MOCK.length), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const target = MOCK[activeIdx].score;
    let frame, start = null;
    const tick = ts => {
      if (!start) start = ts;
      const eased = 1 - Math.pow(1 - Math.min((ts - start) / 520, 1), 3);
      setDisplayScore(Math.round(eased * target));
      if (eased < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeIdx]);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .landing { background: #f5f4f0; min-height: 100vh; font-family: 'Inter', system-ui, sans-serif; }

        /* ── Nav ── */
        .l-nav {
          max-width: 1080px; margin: 0 auto;
          padding: 22px 28px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .l-logo { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 16px; color: #111; letter-spacing: -0.3px; text-decoration: none; }
        .l-nav-links { display: flex; gap: 20px; align-items: center; }
        .l-login { font-size: 13px; color: #888; text-decoration: none; font-weight: 500; }
        .l-login:hover { color: #111; }
        .l-signup {
          font-size: 13px; font-weight: 600; color: #fff;
          background: #111; padding: 8px 16px; border-radius: 8px;
          text-decoration: none;
        }
        .l-signup:hover { background: #333; }

        /* ── Hero ── */
        .l-hero {
          max-width: 1080px; margin: 0 auto;
          padding: 48px 28px 56px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }
        .l-h1 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -2px; color: #111;
          margin: 0 0 20px;
        }
        .l-h1-green { color: #5C9C81; }
        .l-sub {
          font-size: 15px; line-height: 1.65; color: #666;
          margin: 0 0 32px; max-width: 400px;
        }
        .l-ctas { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .l-cta-primary {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 14px; font-weight: 600;
          background: #5C9C81; color: #fff;
          padding: 11px 22px; border-radius: 9px;
          text-decoration: none;
        }
        .l-cta-primary:hover { background: #4a8a70; }
        .l-cta-ghost { font-size: 14px; color: #999; text-decoration: none; }
        .l-cta-ghost:hover { color: #111; }

        /* ── Stats row ── */
        .l-stats {
          display: flex; gap: 0;
          margin-top: 40px; padding-top: 28px;
          border-top: 1px solid #e2e2de;
        }
        .l-stat { flex: 1; }
        .l-stat + .l-stat { padding-left: 24px; border-left: 1px solid #e2e2de; margin-left: 24px; }
        .l-stat-val { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #111; line-height: 1; }
        .l-stat-label { font-size: 12px; color: #999; margin-top: 3px; }

        /* ── Widget ── */
        .l-widget {
          background: #18181f;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #26262e;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }
        .l-widget-chrome {
          padding: 10px 14px;
          background: #111116;
          border-bottom: 1px solid #222228;
          display: flex; align-items: center; gap: 7px;
        }
        .l-dot { width: 9px; height: 9px; border-radius: 50%; background: #333338; }
        .l-url { margin-left: 8px; font-size: 10.5px; color: #44444c; font-family: monospace; }
        .l-widget-body { padding: 18px 18px 20px; }
        .l-widget-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; padding-bottom: 14px;
          border-bottom: 1px solid #222228;
        }
        .l-widget-name { font-size: 12px; font-weight: 600; color: #c0c0cc; }
        .l-widget-meta { font-size: 11px; color: #44444c; margin-top: 2px; }
        .l-score-ring {
          width: 46px; height: 46px; border-radius: 50%;
          border: 2px solid #5C9C81;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: rgba(92,156,129,0.07); flex-shrink: 0;
        }
        .l-score-num { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 800; color: #fff; line-height: 1; }
        .l-score-denom { font-size: 8px; color: #5C9C81; font-weight: 600; }
        .l-rows { display: flex; flex-direction: column; gap: 2px; }
        .l-row {
          padding: 11px 12px; border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.3s ease;
        }
        .l-row-active { background: rgba(92,156,129,0.1); border-color: rgba(92,156,129,0.22); }
        .l-row-inner { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .l-col-name { font-size: 12.5px; font-weight: 600; line-height: 1.3; transition: color 0.3s; }
        .l-col-name-active { color: #e8e8f0; }
        .l-col-name-idle { color: #48484e; }
        .l-col-dept { font-size: 11px; color: #38383e; margin-top: 2px; }
        .l-tag {
          font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 5px;
          flex-shrink: 0; transition: all 0.3s;
        }
        .l-tag-top { background: rgba(92,156,129,0.15); color: #5C9C81; }
        .l-tag-rec { background: rgba(255,255,255,0.04); color: #3a3a44; }
        .l-score-text { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; transition: color 0.3s; }
        .l-score-active { color: #fff; }
        .l-score-idle { color: #38383e; }
        .l-bar-wrap { margin-top: 10px; height: 2px; background: #222228; border-radius: 99px; overflow: hidden; }
        .l-bar-fill { height: 100%; background: #5C9C81; border-radius: 99px; transition: width 0.55s cubic-bezier(0.4,0,0.2,1); }
        .l-widget-footer {
          margin-top: 14px; padding-top: 12px;
          border-top: 1px solid #1e1e24;
          display: flex; align-items: center; gap: 6px;
        }
        .l-widget-footer-text { font-size: 11px; color: #38383e; }
        .l-widget-footer-time { margin-left: auto; font-size: 10px; color: #28282e; }

        /* ── Dark band ── */
        .l-band { background: #111; padding: 64px 28px; }
        .l-band-inner { max-width: 1080px; margin: 0 auto; }
        .l-band-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #5C9C81; margin: 0 0 36px; }
        .l-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .l-step { padding-right: 36px; }
        .l-step + .l-step { padding-left: 36px; border-left: 1px solid #222; }
        .l-step-n { font-size: 11px; font-weight: 700; color: #5C9C81; display: block; margin-bottom: 12px; letter-spacing: 0.05em; }
        .l-step-title { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 8px; line-height: 1.3; }
        .l-step-body { font-size: 13px; line-height: 1.65; color: #666; margin: 0; }

        /* ── Bottom CTA ── */
        .l-bottom { max-width: 1080px; margin: 0 auto; padding: 72px 28px 80px; }
        .l-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .l-bottom-h2 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800; color: #111;
          letter-spacing: -0.8px; line-height: 1.1; margin: 0 0 12px;
        }
        .l-bottom-p { font-size: 14px; color: #888; line-height: 1.6; margin: 0; max-width: 340px; }
        .l-bottom-actions { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
        .l-bottom-btn {
          font-size: 14px; font-weight: 650; color: #fff;
          background: #111; padding: 12px 24px; border-radius: 9px;
          text-decoration: none; display: inline-flex; align-items: center; gap: 7px;
        }
        .l-bottom-btn:hover { background: #333; }
        .l-bottom-login { font-size: 13px; color: #bbb; text-decoration: none; }
        .l-bottom-login:hover { color: #555; }

        /* ── Footer ── */
        .l-footer {
          border-top: 1px solid #e2e2de; padding: 18px 28px;
          max-width: 1080px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
        }
        .l-footer-logo { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 13px; color: #ccc; }
        .l-footer-text { font-size: 11.5px; color: #bbb; }

        /* ── MOBILE ── */
        @media (max-width: 700px) {
          .l-nav { padding: 18px 20px; }
          .l-logo { font-size: 15px; }

          .l-hero {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 36px 20px 48px;
          }
          .l-h1 {
            font-size: clamp(2rem, 9vw, 2.6rem);
            letter-spacing: -1.5px;
          }
          .l-sub { font-size: 14px; max-width: 100%; }
          .l-ctas { gap: 12px; }
          .l-cta-primary { font-size: 13.5px; padding: 10px 18px; }

          .l-stats { gap: 0; margin-top: 32px; }
          .l-stat + .l-stat { padding-left: 16px; margin-left: 16px; }
          .l-stat-val { font-size: 17px; }
          .l-stat-label { font-size: 11px; }

          /* Widget on mobile — keep it but compact */
          .l-widget-body { padding: 14px 14px 16px; }
          .l-url { display: none; }
          .l-col-name { font-size: 11.5px; }
          .l-col-dept { font-size: 10px; }

          .l-band { padding: 48px 20px; }
          .l-steps {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .l-step { padding: 20px 0; border-left: none !important; padding-left: 0 !important; }
          .l-step + .l-step { border-top: 1px solid #222; }
          .l-step-title { font-size: 15px; }

          .l-bottom { padding: 52px 20px 64px; }
          .l-bottom-grid { grid-template-columns: 1fr; gap: 32px; }
          .l-bottom-p { max-width: 100%; }
          .l-bottom-actions { flex-direction: column; align-items: flex-start; }

          .l-footer { padding: 16px 20px; flex-direction: column; gap: 6px; text-align: center; }
        }

        /* ── TABLET ── */
        @media (min-width: 701px) and (max-width: 900px) {
          .l-hero { grid-template-columns: 1fr; gap: 40px; padding: 40px 28px 52px; }
          .l-h1 { font-size: 2.8rem; }
          .l-sub { max-width: 520px; }
          .l-steps { grid-template-columns: 1fr; gap: 0; }
          .l-step { padding: 20px 0; border-left: none !important; padding-left: 0 !important; }
          .l-step + .l-step { border-top: 1px solid #222; }
          .l-bottom-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>

      <div className="landing">

        {/* Nav */}
        <nav className="l-nav">
          <Link to="/" className="l-logo">Collego</Link>
          <div className="l-nav-links">
            <Link to="/login" className="l-login">Log in</Link>
            <Link to="/register" className="l-signup">Sign up free</Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="l-hero">

          {/* Left */}
          <div>
            <h1 className="l-h1">
              Find the college<br />
              <span className="l-h1-green">you'll actually</span><br />
              get into.
            </h1>
            <p className="l-sub">
              Enter your 12th marks once. Collego runs the cutoff formula against
              every college and shows you exactly where you stand — no guesswork,
              no paid listings.
            </p>
            <div className="l-ctas">
              <Link to="/register" className="l-cta-primary">
                See my colleges <ArrowRight size={14} />
              </Link>
              <Link to="/login" className="l-cta-ghost">
                I have an account →
              </Link>
            </div>

            {/* Stats */}
            <div className="l-stats">
              <div className="l-stat">
                <p className="l-stat-val">279</p>
                <p className="l-stat-label">colleges indexed</p>
              </div>
              <div className="l-stat">
                <p className="l-stat-val">TNEA</p>
                <p className="l-stat-label">formula accurate</p>
              </div>
              <div className="l-stat">
                <p className="l-stat-val">free</p>
                <p className="l-stat-label">to start</p>
              </div>
            </div>
          </div>

          {/* Widget */}
          <div className="l-widget">
            <div className="l-widget-chrome">
              <span className="l-dot" /><span className="l-dot" /><span className="l-dot" />
              <span className="l-url">collego.app/recommendations</span>
            </div>
            <div className="l-widget-body">
              <div className="l-widget-header">
                <div>
                  <p className="l-widget-name">Your matches</p>
                  <p className="l-widget-meta">90.4% · PCM+CS stream</p>
                </div>
                <div className="l-score-ring">
                  <span className="l-score-num">{displayScore}</span>
                  <span className="l-score-denom">/100</span>
                </div>
              </div>

              <div className="l-rows">
                {MOCK.map((c, i) => {
                  const active = i === activeIdx;
                  return (
                    <div key={c.name} className={`l-row ${active ? "l-row-active" : ""}`}>
                      <div className="l-row-inner">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className={`l-col-name ${active ? "l-col-name-active" : "l-col-name-idle"}`}
                            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.name}
                          </p>
                          <p className="l-col-dept">{c.dept}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span className={`l-tag ${c.top ? "l-tag-top" : "l-tag-rec"}`} style={{ display: "block", marginBottom: 4 }}>
                            {c.top ? "★ Top match" : "Recommended"}
                          </span>
                          <span className={`l-score-text ${active ? "l-score-active" : "l-score-idle"}`}>
                            {c.score}%
                          </span>
                        </div>
                      </div>
                      {active && (
                        <div className="l-bar-wrap">
                          <div className="l-bar-fill" style={{ width: `${c.score}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="l-widget-footer">
                <CheckCircle2 size={12} color="#5C9C81" />
                <span className="l-widget-footer-text">Documents verified by counselor</span>
                <span className="l-widget-footer-time">just now</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dark steps band */}
        <div className="l-band">
          <div className="l-band-inner">
            <p className="l-band-label">How it works</p>
            <div className="l-steps">
              {[
                { n: "Step 1", title: "Enter your marks", body: "12th percentage, stream, Maths/Physics/Chemistry if you have them. Collego calculates your cutoff automatically." },
                { n: "Step 2", title: "Get a ranked list", body: "Every eligible college scored against your cutoff. Match %, fees, and ranking shown side by side." },
                { n: "Step 3", title: "Track with a counselor", body: "A real counselor reviews your documents and updates your status as applications move forward." },
              ].map(({ n, title, body }) => (
                <div key={n} className="l-step">
                  <span className="l-step-n">{n}</span>
                  <h3 className="l-step-title">{title}</h3>
                  <p className="l-step-body">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="l-bottom">
          <div className="l-bottom-grid">
            <div>
              <h2 className="l-bottom-h2">
                Your marks are in.<br />
                Your list isn't.
              </h2>
              <p className="l-bottom-p">
                Takes three minutes. No consultant fee, no waiting.
                Just your marks and a ranked list of colleges you can actually get into.
              </p>
            </div>
            <div className="l-bottom-actions">
              <Link to="/register" className="l-bottom-btn">
                Create free account <ArrowRight size={14} />
              </Link>
              <Link to="/login" className="l-bottom-login">
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="l-footer">
          <span className="l-footer-logo">Collego</span>
          <span className="l-footer-text">Built by Varshini · {new Date().getFullYear()}</span>
        </footer>

      </div>
    </>
  );
}