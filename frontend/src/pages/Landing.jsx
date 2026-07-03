import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="font-display text-lg font-extrabold tracking-tight" style={{ color: "#15151A" }}>
          Collego
        </span>
        <div className="flex items-center gap-5">
          <Link
            to="/login"
            className="text-sm font-medium transition"
            style={{ color: "#7a7a80" }}
            onMouseEnter={e => e.currentTarget.style.color = "#15151A"}
            onMouseLeave={e => e.currentTarget.style.color = "#7a7a80"}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition"
            style={{ background: "#15151A", color: "#fff" }}
            onMouseEnter={e => e.currentTarget.style.background = "#2a2a30"}
            onMouseLeave={e => e.currentTarget.style.background = "#15151A"}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-8"
            style={{ background: "#EEF7F3", color: "#3B6553" }}
          >
            <Sparkles size={12} />
            AI-powered · Tamil Nadu focused
          </div>

          {/* Headline — tight, typographic */}
          <h1
            className="font-display font-extrabold tracking-tight leading-[1.05] mb-6"
            style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", color: "#15151A" }}
          >
            Find the college<br />
            that actually fits{" "}
            <em
              className="not-italic"
              style={{
                color: "#5C9C81",
                borderBottom: "3px solid #5C9C81",
                paddingBottom: "2px"
              }}
            >
              you.
            </em>
          </h1>

          <p className="text-base leading-relaxed mb-10 max-w-lg" style={{ color: "#7a7a80" }}>
            Enter your marks once. Collego runs them against real TNEA cutoffs, fees, and rankings
            to give you colleges you're genuinely eligible for — not a generic list.
          </p>

          <div className="flex items-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-lg transition"
              style={{ background: "#5C9C81", color: "#fff" }}
              onMouseEnter={e => e.currentTarget.style.background = "#4A8068"}
              onMouseLeave={e => e.currentTarget.style.background = "#5C9C81"}
            >
              Start for free <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium transition"
              style={{ color: "#7a7a80" }}
              onMouseEnter={e => e.currentTarget.style.color = "#15151A"}
              onMouseLeave={e => e.currentTarget.style.color = "#7a7a80"}
            >
              Already have an account →
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-20 mb-8" style={{ borderTop: "1px solid #e8e8e6" }} />

        {/* Three feature blocks — text-heavy, no icon boxes */}
        <div className="grid md:grid-cols-3 gap-10">
          <FeatureBlock
            number="01"
            title="Real eligibility, not guesswork"
            body="Your marks go through the same TNEA cutoff formula colleges use. You only see colleges where your score genuinely clears the bar."
          />
          <FeatureBlock
            number="02"
            title="Counselor in the loop"
            body="Every student gets a human counselor who can verify documents, leave notes, and update application status — AI handles the matching, humans handle the nuance."
          />
          <FeatureBlock
            number="03"
            title="One place, every step"
            body="From uploading your 12th marksheet to tracking whether you got an offer — the entire admission journey lives in a single dashboard."
          />
        </div>
      </section>

      <footer
        className="px-6 py-6 text-center text-xs"
        style={{ borderTop: "1px solid #e8e8e6", color: "#9b9b9f" }}
      >
        Built by Varshini · Collego · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function FeatureBlock({ number, title, body }) {
  return (
    <div>
      <span
        className="font-display text-xs font-bold tracking-widest block mb-3"
        style={{ color: "#5C9C81" }}
      >
        {number}
      </span>
      <h3
        className="font-display text-base font-bold mb-2 leading-snug"
        style={{ color: "#15151A" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#7a7a80" }}>{body}</p>
    </div>
  );
}
