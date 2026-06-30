from flask import Blueprint, request, jsonify, Response
from utils.supabase_client import supabase
from utils.auth_middleware import require_auth
import pandas as pd
import io

admin_bp = Blueprint("admin", __name__)

# ─── Dashboard ────────────────────────────────────────────────────────────────
@admin_bp.route("/dashboard", methods=["GET"])
@require_auth(roles=["admin"])
def dashboard():
    students  = supabase.table("users").select("id", count="exact").eq("role", "student").execute()
    counselors = supabase.table("users").select("id", count="exact").eq("role", "counselor").execute()
    colleges  = supabase.table("colleges").select("id", count="exact").execute()
    apps      = supabase.table("applications").select("id, status").execute()

    total_apps = len(apps.data or [])
    confirmed  = len([a for a in (apps.data or []) if a["status"] == "Admission Confirmed"])
    success_rate = round((confirmed / total_apps * 100), 1) if total_apps > 0 else 0

    recs = supabase.table("recommendations").select("id", count="exact").execute()
    total_recommendations = recs.count or 0

    assignments = supabase.table("counselor_assignments").select("student_id").execute()
    assigned_student_ids = {a["student_id"] for a in (assignments.data or [])}
    active_counselings = len(assigned_student_ids)

    all_students = supabase.table("users").select("id").eq("role", "student").execute()
    all_student_ids = {s["id"] for s in (all_students.data or [])}
    unassigned_students = len(all_student_ids - assigned_student_ids)

    # ── College Distribution by category ──────────────────────────────────────
    all_colleges = supabase.table("colleges").select("category").eq("is_active", True).execute()
    cat_counts = {}
    for c in (all_colleges.data or []):
        cat = (c.get("category") or "Other").strip()
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    college_distribution = sorted(
        [{"label": k, "count": v} for k, v in cat_counts.items()],
        key=lambda x: x["count"], reverse=True
    )

    # ── Course Popularity by student preferred_course_category ────────────────
    profiles = supabase.table("student_profiles").select("preferred_course_category").execute()
    course_counts = {}
    for p in (profiles.data or []):
        course = (p.get("preferred_course_category") or "").strip()
        if course:
            course_counts[course] = course_counts.get(course, 0) + 1
    course_popularity = sorted(
        [{"label": k, "count": v} for k, v in course_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:8]  # top 8 only to keep the chart readable

    return jsonify({
        "total_students":        students.count or 0,
        "total_counselors":      counselors.count or 0,
        "total_colleges":        colleges.count or 0,
        "total_applications":    total_apps,
        "admission_success_rate": success_rate,
        "total_recommendations": total_recommendations,
        "active_counselings":    active_counselings,
        "unassigned_students":   unassigned_students,
        "college_distribution":  college_distribution,
        "course_popularity":     course_popularity,
    }), 200
# ─── Colleges ─────────────────────────────────────────────────────────────────

@admin_bp.route("/colleges", methods=["GET"])
@require_auth(roles=["admin"])
def list_colleges():
    result = supabase.table("colleges").select("*").order("name").execute()
    return jsonify(result.data), 200


@admin_bp.route("/colleges", methods=["POST"])
@require_auth(roles=["admin"])
def add_college():
    data = request.json
    required = ["name", "category", "location", "state"]
    if not all(data.get(f) for f in required):
        return jsonify({"error": "Name, category, location, state are required"}), 400

    result = supabase.table("colleges").insert({
        "name": data["name"],
        "category": data["category"],
        "college_type": data.get("college_type", ""),
        "location": data["location"],
        "state": data["state"],
        "courses_offered": data.get("courses_offered", ""),
        "min_cutoff_percentage": data.get("min_cutoff_percentage"),
        "fees_min": data.get("fees_min"),
        "fees_max": data.get("fees_max"),
        "ranking": data.get("ranking"),
        "description": data.get("description", ""),
        "website": data.get("website", ""),
        "is_active": True
    }).execute()
    return jsonify(result.data[0]), 201


@admin_bp.route("/colleges/bulk-upload", methods=["POST"])
@require_auth(roles=["admin"])
def bulk_upload_colleges():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send a CSV under the 'file' field."}), 400

    file = request.files["file"]
    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only .csv files are supported."}), 400

    try:
        df = pd.read_csv(io.BytesIO(file.read()))
    except Exception as e:
        return jsonify({"error": f"Could not parse CSV: {str(e)}"}), 400

    required_cols = ["name", "category", "location", "state"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        return jsonify({"error": f"CSV is missing required columns: {', '.join(missing_cols)}"}), 400

    numeric_cols = ["min_cutoff_percentage", "fees_min", "fees_max", "ranking"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    existing = supabase.table("colleges").select("name").execute()
    existing_names = {r["name"].strip().lower() for r in (existing.data or [])}

    to_insert = []
    skipped_missing = 0
    skipped_duplicate = 0

    for _, row in df.iterrows():
        name = str(row.get("name", "")).strip()
        category = str(row.get("category", "")).strip()
        location = str(row.get("location", "")).strip()
        state = str(row.get("state", "")).strip()

        if not all([name, category, location, state]) or name.lower() == "nan":
            skipped_missing += 1
            continue
        if name.lower() in existing_names:
            skipped_duplicate += 1
            continue

        record = {
            "name": name,
            "category": category,
            "college_type": str(row.get("college_type", "") or ""),
            "location": location,
            "state": state,
            "courses_offered": str(row.get("courses_offered", "") or ""),
            "min_cutoff_percentage": row.get("min_cutoff_percentage") if pd.notna(row.get("min_cutoff_percentage")) else None,
            "fees_min": row.get("fees_min") if pd.notna(row.get("fees_min")) else None,
            "fees_max": row.get("fees_max") if pd.notna(row.get("fees_max")) else None,
            "ranking": row.get("ranking") if pd.notna(row.get("ranking")) else None,
            "description": str(row.get("description", "") or ""),
            "website": str(row.get("website", "") or ""),
            "admission_basis": str(row.get("admission_basis", "") or "") or None,
            "typical_rank_cutoff": row.get("typical_rank_cutoff") if pd.notna(row.get("typical_rank_cutoff")) else None,
            "gender_eligibility": str(row.get("gender_eligibility", "") or "") or None,
            "is_active": True
        }
        to_insert.append(record)
        existing_names.add(name.lower())

    inserted = 0
    if to_insert:
        batch_size = 50
        for i in range(0, len(to_insert), batch_size):
            batch = to_insert[i:i + batch_size]
            result = supabase.table("colleges").insert(batch).execute()
            inserted += len(result.data or [])

    return jsonify({
        "message": f"Inserted {inserted} colleges",
        "inserted": inserted,
        "skipped_missing_fields": skipped_missing,
        "skipped_duplicates": skipped_duplicate,
        "total_rows_in_file": len(df)
    }), 200


@admin_bp.route("/colleges/<college_id>", methods=["PUT"])
@require_auth(roles=["admin"])
def update_college(college_id):
    data = request.json
    supabase.table("colleges").update(data).eq("id", college_id).execute()
    return jsonify({"message": "College updated"}), 200


@admin_bp.route("/colleges/<college_id>", methods=["DELETE"])
@require_auth(roles=["admin"])
def delete_college(college_id):
    supabase.table("colleges").update({"is_active": False}).eq("id", college_id).execute()
    return jsonify({"message": "College deactivated"}), 200


# ─── Users ────────────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@require_auth(roles=["admin"])
def list_users():
    role = request.args.get("role")
    query = supabase.table("users").select("id, name, email, role, is_active, created_at")
    if role:
        query = query.eq("role", role)
    result = query.order("created_at", desc=True).execute()
    return jsonify(result.data), 200


@admin_bp.route("/users/<user_id>/toggle", methods=["POST"])
@require_auth(roles=["admin"])
def toggle_user(user_id):
    user = supabase.table("users").select("is_active").eq("id", user_id).execute()
    if not user.data:
        return jsonify({"error": "User not found"}), 404
    new_status = not user.data[0]["is_active"]
    supabase.table("users").update({"is_active": new_status}).eq("id", user_id).execute()
    return jsonify({"is_active": new_status}), 200


# ─── Counselor Assignments ────────────────────────────────────────────────────

@admin_bp.route("/counselor-assignments", methods=["GET"])
@require_auth(roles=["admin"])
def list_counselor_assignments():
    result = supabase.table("counselor_assignments").select("student_id, counselor_id").execute()
    return jsonify(result.data or []), 200


@admin_bp.route("/assign-counselor", methods=["POST"])
@require_auth(roles=["admin"])
def assign_counselor():
    data = request.json
    student_id = data.get("student_id")
    counselor_id = data.get("counselor_id")
    if not all([student_id, counselor_id]):
        return jsonify({"error": "student_id and counselor_id required"}), 400

    existing = supabase.table("counselor_assignments") \
        .select("id").eq("student_id", student_id).execute()
    if existing.data:
        supabase.table("counselor_assignments") \
            .update({"counselor_id": counselor_id}) \
            .eq("student_id", student_id).execute()
    else:
        supabase.table("counselor_assignments").insert({
            "student_id": student_id, "counselor_id": counselor_id
        }).execute()

    return jsonify({"message": "Counselor assigned"}), 200


# ─── Analytics ────────────────────────────────────────────────────────────────

@admin_bp.route("/analytics", methods=["GET"])
@require_auth(roles=["admin"])
def analytics():
    apps = supabase.table("applications").select("id, status").execute()
    apps_data = apps.data or []
    total_apps = len(apps_data)
    confirmed = len([a for a in apps_data if a["status"] == "Admission Confirmed"])
    success_rate = round((confirmed / total_apps * 100), 1) if total_apps else 0
    under_review = len([a for a in apps_data if a["status"] == "Under Review"])
    rejected = len([a for a in apps_data if a["status"] == "Rejected"])

    status_breakdown = {}
    for a in apps_data:
        status_breakdown[a["status"]] = status_breakdown.get(a["status"], 0) + 1

    recs = supabase.table("recommendations").select("id, level").execute()
    recs_data = recs.data or []
    total_recommendations = len(recs_data)
    highly_recommended = len([r for r in recs_data if r["level"] == "Highly Recommended"])

    return jsonify({
        "total_applications": total_apps,
        "admission_success_rate": success_rate,
        "total_recommendations": total_recommendations,
        "highly_recommended": highly_recommended,
        "under_review": under_review,
        "rejected": rejected,
        "status_breakdown": status_breakdown,
        "course_popularity": [],
    }), 200


# ─── AI Settings ──────────────────────────────────────────────────────────────

AI_SETTINGS_KEY = "ai_settings"

@admin_bp.route("/ai-settings", methods=["GET"])
@require_auth(roles=["admin"])
def get_ai_settings():
    result = supabase.table("platform_settings") \
        .select("value").eq("key", AI_SETTINGS_KEY).execute()
    if result.data:
        return jsonify(result.data[0]["value"]), 200
    return jsonify({}), 200


@admin_bp.route("/ai-settings", methods=["POST"])
@require_auth(roles=["admin"])
def save_ai_settings():
    data = request.json or {}
    existing = supabase.table("platform_settings") \
        .select("id").eq("key", AI_SETTINGS_KEY).execute()
    if existing.data:
        supabase.table("platform_settings") \
            .update({"value": data}).eq("key", AI_SETTINGS_KEY).execute()
    else:
        supabase.table("platform_settings") \
            .insert({"key": AI_SETTINGS_KEY, "value": data}).execute()
    return jsonify({"message": "AI settings saved"}), 200


# ─── Platform Settings ────────────────────────────────────────────────────────

PLATFORM_SETTINGS_KEY = "platform_settings"

@admin_bp.route("/platform-settings", methods=["GET"])
@require_auth(roles=["admin"])
def get_platform_settings():
    result = supabase.table("platform_settings") \
        .select("value").eq("key", PLATFORM_SETTINGS_KEY).execute()
    if result.data:
        return jsonify(result.data[0]["value"]), 200
    return jsonify({}), 200


@admin_bp.route("/platform-settings", methods=["POST"])
@require_auth(roles=["admin"])
def save_platform_settings():
    data = request.json or {}
    existing = supabase.table("platform_settings") \
        .select("id").eq("key", PLATFORM_SETTINGS_KEY).execute()
    if existing.data:
        supabase.table("platform_settings") \
            .update({"value": data}).eq("key", PLATFORM_SETTINGS_KEY).execute()
    else:
        supabase.table("platform_settings") \
            .insert({"key": PLATFORM_SETTINGS_KEY, "value": data}).execute()
    return jsonify({"message": "Platform settings saved"}), 200


# ─── Report helpers ───────────────────────────────────────────────────────────

def _csv_response(df, filename):
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─── Reports ──────────────────────────────────────────────────────────────────

@admin_bp.route("/reports/student-recommendations", methods=["GET"])
@require_auth(roles=["admin"])
def report_student_recommendations():
    recs = supabase.table("recommendations") \
        .select("level, score, reasons, student_id, college_id, colleges(name, location, category, fees_min, fees_max)") \
        .order("score", desc=True) \
        .execute()

    if not recs.data:
        return _csv_response(pd.DataFrame(), "student-recommendations.csv")

    student_ids = list({r["student_id"] for r in recs.data})
    users_res = supabase.table("users").select("id, name, email").in_("id", student_ids).execute()
    users_map = {u["id"]: u for u in (users_res.data or [])}

    rows = []
    for r in recs.data:
        user = users_map.get(r["student_id"], {})
        college = r.get("colleges") or {}
        rows.append({
            "student_name": user.get("name", ""),
            "student_email": user.get("email", ""),
            "college_name": college.get("name", ""),
            "location": college.get("location", ""),
            "category": college.get("category", ""),
            "fees_min": college.get("fees_min", ""),
            "fees_max": college.get("fees_max", ""),
            "level": r.get("level", ""),
            "score": r.get("score", ""),
            "reasons": "; ".join(r.get("reasons") or []),
        })

    return _csv_response(pd.DataFrame(rows), "student-recommendations.csv")


@admin_bp.route("/reports/admission-eligibility", methods=["GET"])
@require_auth(roles=["admin"])
def report_admission_eligibility():
    profiles = supabase.table("student_profiles") \
        .select("user_id, twelfth_percentage, twelfth_stream, tnea_cutoff, entrance_exam, entrance_score, application_status, is_verified") \
        .execute()

    if not profiles.data:
        return _csv_response(pd.DataFrame(), "admission-eligibility.csv")

    user_ids = [p["user_id"] for p in profiles.data]
    users_res = supabase.table("users").select("id, name, email").in_("id", user_ids).execute()
    users_map = {u["id"]: u for u in (users_res.data or [])}

    rows = []
    for p in profiles.data:
        user = users_map.get(p["user_id"], {})
        rows.append({
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "twelfth_percentage": p.get("twelfth_percentage", ""),
            "twelfth_stream": p.get("twelfth_stream", ""),
            "tnea_cutoff": p.get("tnea_cutoff", ""),
            "entrance_exam": p.get("entrance_exam", ""),
            "entrance_score": p.get("entrance_score", ""),
            "application_status": p.get("application_status", ""),
            "is_verified": p.get("is_verified", False),
        })

    return _csv_response(pd.DataFrame(rows), "admission-eligibility.csv")


@admin_bp.route("/reports/college-analysis", methods=["GET"])
@require_auth(roles=["admin"])
def report_college_analysis():
    colleges = supabase.table("colleges").select("id, name, category, college_type, state, ranking, fees_min, fees_max").eq("is_active", True).execute()
    apps = supabase.table("applications").select("college_id, status").execute()

    college_apps = {}
    for a in (apps.data or []):
        cid = a["college_id"]
        college_apps.setdefault(cid, []).append(a["status"])

    rows = []
    for c in (colleges.data or []):
        statuses = college_apps.get(c["id"], [])
        total = len(statuses)
        confirmed = statuses.count("Admission Confirmed")
        under_review = statuses.count("Under Review")
        rejected = statuses.count("Rejected")
        rows.append({
            "name": c.get("name", ""),
            "category": c.get("category", ""),
            "college_type": c.get("college_type", ""),
            "state": c.get("state", ""),
            "ranking": c.get("ranking", ""),
            "fees_min": c.get("fees_min", ""),
            "fees_max": c.get("fees_max", ""),
            "total_applications": total,
            "confirmed": confirmed,
            "under_review": under_review,
            "rejected": rejected,
            "success_rate_pct": round((confirmed / total * 100), 1) if total else 0,
        })

    rows.sort(key=lambda r: r["total_applications"], reverse=True)
    return _csv_response(pd.DataFrame(rows), "college-analysis.csv")


@admin_bp.route("/reports/course-popularity", methods=["GET"])
@require_auth(roles=["admin"])
def report_course_popularity():
    colleges = supabase.table("colleges").select("courses_offered").eq("is_active", True).execute()
    profiles = supabase.table("student_profiles").select("preferred_course_category").execute()

    course_college_count = {}
    for c in (colleges.data or []):
        if not c.get("courses_offered"):
            continue
        for course in c["courses_offered"].split(","):
            course = course.strip()
            if course:
                course_college_count[course] = course_college_count.get(course, 0) + 1

    student_interest_count = {}
    for p in (profiles.data or []):
        pref = (p.get("preferred_course_category") or "").strip()
        if pref:
            student_interest_count[pref] = student_interest_count.get(pref, 0) + 1

    rows = []
    for course, count in course_college_count.items():
        interest = sum(
            pcount for pref, pcount in student_interest_count.items()
            if pref.lower() in course.lower() or course.lower() in pref.lower()
        )
        rows.append({
            "course_name": course,
            "colleges_offering": count,
            "student_interest_count": interest,
        })

    rows.sort(key=lambda r: r["colleges_offering"], reverse=True)
    return _csv_response(pd.DataFrame(rows), "course-popularity.csv")


@admin_bp.route("/reports/counselor-performance", methods=["GET"])
@require_auth(roles=["admin"])
def report_counselor_performance():
    counselors = supabase.table("users").select("id, name, email").eq("role", "counselor").execute()
    assignments = supabase.table("counselor_assignments").select("counselor_id, student_id").execute()
    notes = supabase.table("counseling_notes").select("counselor_id").execute()
    profiles = supabase.table("student_profiles").select("user_id, is_verified").execute()
    apps = supabase.table("applications").select("student_id, status").execute()

    assignment_map = {}
    for a in (assignments.data or []):
        assignment_map.setdefault(a["counselor_id"], []).append(a["student_id"])

    notes_count = {}
    for n in (notes.data or []):
        notes_count[n["counselor_id"]] = notes_count.get(n["counselor_id"], 0) + 1

    verified_set = {p["user_id"] for p in (profiles.data or []) if p.get("is_verified")}
    confirmed_set = {a["student_id"] for a in (apps.data or []) if a["status"] == "Admission Confirmed"}

    rows = []
    for c in (counselors.data or []):
        student_ids = assignment_map.get(c["id"], [])
        assigned = len(student_ids)
        verified = len([sid for sid in student_ids if sid in verified_set])
        confirmed = len([sid for sid in student_ids if sid in confirmed_set])
        rows.append({
            "counselor_name": c.get("name", ""),
            "counselor_email": c.get("email", ""),
            "students_assigned": assigned,
            "notes_written": notes_count.get(c["id"], 0),
            "verified_students": verified,
            "confirmed_admissions": confirmed,
            "success_rate_pct": round((confirmed / assigned * 100), 1) if assigned else 0,
        })

    rows.sort(key=lambda r: r["students_assigned"], reverse=True)
    return _csv_response(pd.DataFrame(rows), "counselor-performance.csv")


@admin_bp.route("/reports/scholarship-eligibility", methods=["GET"])
@require_auth(roles=["admin"])
def report_scholarship_eligibility():
    """
    Scholarship eligibility is assessed live by the AI (see /ai/scholarships)
    rather than stored — there's no scholarships table. This report instead
    surfaces the academic/financial signals that actually drive scholarship
    eligibility in India (marks, budget bracket, category, state), so an
    admin can see at a glance who's likely eligible for merit- or need-based
    aid without re-running the AI for every student.
    """
    profiles = supabase.table("student_profiles") \
        .select("user_id, twelfth_percentage, tenth_percentage, twelfth_stream, state, budget_range, preferred_course_category, gender") \
        .execute()

    if not profiles.data:
        return _csv_response(pd.DataFrame(), "scholarship-eligibility.csv")

    user_ids = [p["user_id"] for p in profiles.data]
    users_res = supabase.table("users").select("id, name, email").in_("id", user_ids).execute()
    users_map = {u["id"]: u for u in (users_res.data or [])}

    # Same thresholds the rest of the app already uses for "low budget" /
    # high merit, kept consistent with the recommendation engine's framing
    # rather than inventing new cutoffs here.
    LOW_BUDGET_BRACKETS = {"Under 1 Lakh", "1-3 Lakhs"}

    rows = []
    for p in profiles.data:
        user = users_map.get(p["user_id"], {})
        twelfth = p.get("twelfth_percentage")
        merit_eligible = bool(twelfth and float(twelfth) >= 85)
        need_based_likely = (p.get("budget_range") or "") in LOW_BUDGET_BRACKETS

        rows.append({
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "twelfth_percentage": twelfth or "",
            "tenth_percentage": p.get("tenth_percentage", ""),
            "stream": p.get("twelfth_stream", ""),
            "state": p.get("state", ""),
            "budget_range": p.get("budget_range", ""),
            "preferred_course_category": p.get("preferred_course_category", ""),
            "gender": p.get("gender", ""),
            "merit_scholarship_likely": merit_eligible,
            "need_based_scholarship_likely": need_based_likely,
        })

    rows.sort(key=lambda r: (not r["merit_scholarship_likely"], not r["need_based_scholarship_likely"]))
    return _csv_response(pd.DataFrame(rows), "scholarship-eligibility.csv")


@admin_bp.route("/reports/admission-success", methods=["GET"])
@require_auth(roles=["admin"])
def report_admission_success():
    """
    Funnel view of every application from start to confirmed admission —
    distinct from college-analysis (which is per-college) and counselor-
    performance (which is per-counselor). This one is per-student, showing
    where each application currently sits in the pipeline.
    """
    apps = supabase.table("applications") \
        .select("student_id, college_id, status, applied_on, updated_at, colleges(name, category)") \
        .order("applied_on", desc=True) \
        .execute()

    if not apps.data:
        return _csv_response(pd.DataFrame(), "admission-success.csv")

    student_ids = list({a["student_id"] for a in apps.data})
    users_res = supabase.table("users").select("id, name, email").in_("id", student_ids).execute()
    users_map = {u["id"]: u for u in (users_res.data or [])}

    FUNNEL_ORDER = [
        "Application Started", "Application Submitted", "Under Review",
        "Admission Offered", "Admission Confirmed", "Rejected"
    ]

    rows = []
    for a in apps.data:
        user = users_map.get(a["student_id"], {})
        college = a.get("colleges") or {}
        rows.append({
            "student_name": user.get("name", ""),
            "student_email": user.get("email", ""),
            "college_name": college.get("name", ""),
            "college_category": college.get("category", ""),
            "status": a.get("status", ""),
            "funnel_stage": FUNNEL_ORDER.index(a["status"]) + 1 if a.get("status") in FUNNEL_ORDER else 0,
            "applied_on": a.get("applied_on", ""),
            "last_updated": a.get("updated_at", ""),
        })

    # Summary row appended at the end so the CSV is self-contained — an
    # admin opening this in Excel sees both the raw funnel and the
    # aggregate success rate without needing a second report.
    total = len(rows)
    confirmed = len([r for r in rows if r["status"] == "Admission Confirmed"])
    rejected = len([r for r in rows if r["status"] == "Rejected"])
    in_progress = total - confirmed - rejected

    df = pd.DataFrame(rows)
    summary = pd.DataFrame([{
        "student_name": "— SUMMARY —", "student_email": "",
        "college_name": "", "college_category": "",
        "status": f"Total: {total}", "funnel_stage": "",
        "applied_on": f"Confirmed: {confirmed} ({round(confirmed/total*100,1) if total else 0}%)",
        "last_updated": f"Rejected: {rejected} | In progress: {in_progress}",
    }])
    df = pd.concat([df, summary], ignore_index=True)

    return _csv_response(df, "admission-success.csv")


@admin_bp.route("/reports/ai-recommendation-accuracy", methods=["GET"])
@require_auth(roles=["admin"])
def report_ai_recommendation_accuracy():
    """
    Accuracy here means: when the AI engine called a college "Highly
    Recommended" or "Recommended" for a student, did that student go on to
    actually apply and/or get admitted there? This is the closest honest
    proxy available — there's no separate ground-truth label, so accuracy
    is measured against real downstream behavior (applications, offers,
    confirmations), broken down by recommendation level.
    """
    recs = supabase.table("recommendations") \
        .select("student_id, college_id, level, score") \
        .execute()
    apps = supabase.table("applications") \
        .select("student_id, college_id, status") \
        .execute()

    if not recs.data:
        return _csv_response(pd.DataFrame(), "ai-recommendation-accuracy.csv")

    # Build a lookup of (student_id, college_id) -> application status,
    # so we can check, for each recommendation, whether the student acted
    # on it and what happened.
    app_lookup = {(a["student_id"], a["college_id"]): a["status"] for a in (apps.data or [])}

    POSITIVE_OUTCOMES = {"Admission Offered", "Admission Confirmed"}

    level_stats = {}
    for r in recs.data:
        level = r.get("level", "Unknown")
        key = (r["student_id"], r["college_id"])
        status = app_lookup.get(key)

        stats = level_stats.setdefault(level, {
            "total_recommendations": 0,
            "applied": 0,
            "positive_outcome": 0,
            "rejected": 0,
        })
        stats["total_recommendations"] += 1
        if status:
            stats["applied"] += 1
            if status in POSITIVE_OUTCOMES:
                stats["positive_outcome"] += 1
            elif status == "Rejected":
                stats["rejected"] += 1

    rows = []
    for level, stats in level_stats.items():
        total = stats["total_recommendations"]
        applied = stats["applied"]
        rows.append({
            "recommendation_level": level,
            "total_recommendations": total,
            "students_who_applied": applied,
            "application_rate_pct": round((applied / total * 100), 1) if total else 0,
            "positive_outcomes": stats["positive_outcome"],
            "rejections": stats["rejected"],
            "positive_outcome_rate_pct": round((stats["positive_outcome"] / applied * 100), 1) if applied else 0,
        })

    # Sort by the natural recommendation strength order, not alphabetically
    LEVEL_ORDER = ["Highly Recommended", "Recommended", "Suitable", "Alternative Option", "Over Budget"]
    rows.sort(key=lambda r: LEVEL_ORDER.index(r["recommendation_level"]) if r["recommendation_level"] in LEVEL_ORDER else 99)

    return _csv_response(pd.DataFrame(rows), "ai-recommendation-accuracy.csv")