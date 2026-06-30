"""
Generates a PDF recommendation report for a student: their profile summary,
top college recommendations, and top course recommendations, with reasons.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

PRIMARY_COLOR = colors.HexColor("#4f46e5")
TEXT_GRAY = colors.HexColor("#4b5563")
LIGHT_GRAY = colors.HexColor("#f3f4f6")

LEVEL_COLORS = {
    "Highly Recommended": colors.HexColor("#ecfdf5"),
    "Recommended": colors.HexColor("#eef2ff"),
    "Suitable": colors.HexColor("#fffbeb"),
    "Alternative Option": colors.HexColor("#f3f4f6"),
    "Over Budget": colors.HexColor("#fef2f2"),
}
LEVEL_TEXT_COLORS = {
    "Highly Recommended": colors.HexColor("#047857"),
    "Recommended": colors.HexColor("#4338ca"),
    "Suitable": colors.HexColor("#b45309"),
    "Alternative Option": colors.HexColor("#4b5563"),
    "Over Budget": colors.HexColor("#b91c1c"),
}


def _styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("ReportTitle", fontSize=20, leading=24, textColor=PRIMARY_COLOR, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("ReportSubtitle", fontSize=10, leading=14, textColor=TEXT_GRAY))
    styles.add(ParagraphStyle("SectionHeading", fontSize=13, leading=18, textColor=colors.HexColor("#111827"), fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6))
    styles.add(ParagraphStyle("CollegeName", fontSize=11.5, leading=15, fontName="Helvetica-Bold", textColor=colors.HexColor("#111827")))
    styles.add(ParagraphStyle("MetaLine", fontSize=8.5, leading=12, textColor=TEXT_GRAY))
    styles.add(ParagraphStyle("ReasonLine", fontSize=8.5, leading=12.5, textColor=TEXT_GRAY, leftIndent=8))
    styles.add(ParagraphStyle("ProfileLabel", fontSize=8.5, textColor=TEXT_GRAY))
    styles.add(ParagraphStyle("ProfileValue", fontSize=10, textColor=colors.HexColor("#111827"), fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("FooterNote", fontSize=7.5, textColor=colors.HexColor("#9ca3af")))
    return styles


def _level_badge(level, styles):
    bg = LEVEL_COLORS.get(level, LIGHT_GRAY)
    fg = LEVEL_TEXT_COLORS.get(level, TEXT_GRAY)
    t = Table([[level]], colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("TEXTCOLOR", (0, 0), (-1, -1), fg),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def _format_fee(min_fee, max_fee):
    if not min_fee or not max_fee:
        return "Fee not listed"
    return f"Rs. {min_fee/100000:.1f}L \u2013 Rs. {max_fee/100000:.1f}L / yr"


def generate_recommendation_report_pdf(student_name, profile, college_recs, course_recs):
    """
    student_name: str
    profile: dict (student_profiles row)
    college_recs: list of dicts with college_name, location, fees_min, fees_max, level, score, reasons
    course_recs: list of dicts with course_name, level, score, reasons, available_at
    Returns: BytesIO containing the PDF.
    """
    styles = _styles()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=18 * mm, bottomMargin=16 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm
    )
    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    story.append(Paragraph("Collego", styles["ReportTitle"]))
    story.append(Paragraph("AI-Generated College &amp; Course Recommendation Report", styles["ReportSubtitle"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Prepared for {student_name} \u00b7 {datetime.now().strftime('%d %B %Y')}", styles["MetaLine"]))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GRAY))
    story.append(Spacer(1, 12))

    # ── Profile summary ─────────────────────────────────────────────────────
    story.append(Paragraph("Profile Summary", styles["SectionHeading"]))

    academic_value = profile.get("tnea_cutoff")
    cutoff_display = f"{academic_value}/200 (TNEA)" if academic_value else f"{profile.get('twelfth_percentage', '\u2014')}%"

    profile_rows = [
        [Paragraph("12th Percentage", styles["ProfileLabel"]), Paragraph(f"{profile.get('twelfth_percentage', '\u2014')}%", styles["ProfileValue"])],
        [Paragraph("Cutoff / Rank Basis", styles["ProfileLabel"]), Paragraph(cutoff_display, styles["ProfileValue"])],
        [Paragraph("Preferred Category", styles["ProfileLabel"]), Paragraph(profile.get("preferred_course_category") or "\u2014", styles["ProfileValue"])],
        [Paragraph("Budget Range", styles["ProfileLabel"]), Paragraph(profile.get("budget_range") or "\u2014", styles["ProfileValue"])],
    ]
    profile_table = Table(profile_rows, colWidths=[130, 250])
    profile_table.setStyle(TableStyle([
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(profile_table)
    story.append(Spacer(1, 8))

    # ── College recommendations ─────────────────────────────────────────────
    story.append(Paragraph("Recommended Colleges", styles["SectionHeading"]))
    if not college_recs:
        story.append(Paragraph("No college recommendations available yet.", styles["MetaLine"]))
    for rec in college_recs:
        row = Table(
            [[
                Paragraph(rec.get("college_name", "Unknown college"), styles["CollegeName"]),
                _level_badge(rec.get("level", ""), styles)
            ]],
            colWidths=[330, 100]
        )
        row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        story.append(row)

        meta = f"{rec.get('location', '')}  \u00b7  {_format_fee(rec.get('fees_min'), rec.get('fees_max'))}"
        story.append(Paragraph(meta, styles["MetaLine"]))

        for reason in (rec.get("reasons") or [])[:3]:
            story.append(Paragraph(f"\u2022 {reason}", styles["ReasonLine"]))
        story.append(Spacer(1, 8))

    # ── Course recommendations ──────────────────────────────────────────────
    story.append(Spacer(1, 4))
    story.append(Paragraph("Recommended Courses", styles["SectionHeading"]))
    if not course_recs:
        story.append(Paragraph("No course recommendations available yet.", styles["MetaLine"]))
    for rec in course_recs[:10]:
        row = Table(
            [[
                Paragraph(rec.get("course_name", ""), styles["CollegeName"]),
                _level_badge(rec.get("level", ""), styles)
            ]],
            colWidths=[330, 100]
        )
        row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        story.append(row)

        available_at = rec.get("available_at") or []
        if available_at:
            names = ", ".join(a.get("college_name", "") for a in available_at[:3])
            story.append(Paragraph(f"Available at: {names}", styles["MetaLine"]))

        for reason in (rec.get("reasons") or [])[:2]:
            story.append(Paragraph(f"\u2022 {reason}", styles["ReasonLine"]))
        story.append(Spacer(1, 8))

    # ── Footer note ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "This report is generated by Collego's AI matching engine based on the profile information you provided. "
        "Cutoff and fee data are approximate reference points \u2014 always confirm current figures with the official "
        "college admissions office before applying.",
        styles["FooterNote"]
    ))

    doc.build(story)
    buf.seek(0)
    return buf