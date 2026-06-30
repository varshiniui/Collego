from flask import Blueprint, request, jsonify
from utils.supabase_client import supabase
from utils.auth_middleware import require_auth

counselor_bp = Blueprint("counselor", __name__)

@counselor_bp.route("/dashboard", methods=["GET"])
@require_auth(roles=["counselor"])
def dashboard():
    counselor_id = request.user["user_id"]

    assigned = supabase.table("counselor_assignments").select("student_id").eq("counselor_id", counselor_id).execute()
    student_ids = [a["student_id"] for a in (assigned.data or [])]

    pending_verifications = 0
    if student_ids:
        pending = supabase.table("student_profiles") \
            .select("id") \
            .in_("user_id", student_ids) \
            .eq("application_status", "Profile Created") \
            .execute()
        pending_verifications = len(pending.data or [])

    notes = supabase.table("counseling_notes").select("id").eq("counselor_id", counselor_id).execute()

    return jsonify({
        "total_students": len(student_ids),
        "pending_verifications": pending_verifications,
        "counseling_sessions": len(notes.data or []),
        "admission_success_rate": 0
    }), 200


@counselor_bp.route("/students", methods=["GET"])
@require_auth(roles=["counselor"])
def get_students():
    counselor_id = request.user["user_id"]

    assigned = supabase.table("counselor_assignments") \
        .select("student_id, users!counselor_assignments_student_id_fkey(id, name, email)") \
        .eq("counselor_id", counselor_id).execute()
    rows = assigned.data or []

    student_ids = [r["student_id"] for r in rows]
    profiles_by_user_id = {}
    if student_ids:
        profiles = supabase.table("student_profiles") \
            .select("user_id, application_status, twelfth_percentage, twelfth_stream, preferred_course_category, preferred_states, preferred_college_type, budget_range") \
            .in_("user_id", student_ids).execute()
        profiles_by_user_id = {p["user_id"]: p for p in (profiles.data or [])}

    for r in rows:
        r["student_profiles"] = profiles_by_user_id.get(r["student_id"])

    return jsonify(rows), 200


@counselor_bp.route("/students/<student_id>/notes", methods=["GET"])
@require_auth(roles=["counselor"])
def get_notes(student_id):
    counselor_id = request.user["user_id"]

    assignment = supabase.table("counselor_assignments") \
        .select("id").eq("counselor_id", counselor_id).eq("student_id", student_id).execute()
    if not assignment.data:
        return jsonify({"error": "This student is not assigned to you"}), 403

    notes = supabase.table("counseling_notes") \
        .select("id, note, created_at") \
        .eq("student_id", student_id) \
        .order("created_at", desc=True).execute()
    return jsonify(notes.data or []), 200


@counselor_bp.route("/students/<student_id>/notes", methods=["POST"])
@require_auth(roles=["counselor"])
def add_note(student_id):
    counselor_id = request.user["user_id"]
    data = request.json
    note = data.get("note", "").strip()
    if not note:
        return jsonify({"error": "Note cannot be empty"}), 400

    supabase.table("counseling_notes").insert({
        "counselor_id": counselor_id,
        "student_id": student_id,
        "note": note
    }).execute()
    return jsonify({"message": "Note added"}), 201


@counselor_bp.route("/students/<student_id>/verify", methods=["POST"])
@require_auth(roles=["counselor"])
def verify_student(student_id):
    supabase.table("student_profiles") \
        .update({"application_status": "Eligibility Verified", "is_verified": True}) \
        .eq("user_id", student_id).execute()
    return jsonify({"message": "Student verified"}), 200


@counselor_bp.route("/students/<student_id>/documents", methods=["GET"])
@require_auth(roles=["counselor"])
def get_student_documents(student_id):
    counselor_id = request.user["user_id"]

    assignment = supabase.table("counselor_assignments") \
        .select("id").eq("counselor_id", counselor_id).eq("student_id", student_id).execute()
    if not assignment.data:
        return jsonify({"error": "This student is not assigned to you"}), 403

    docs = supabase.table("student_documents") \
        .select("*").eq("student_id", student_id) \
        .order("uploaded_at", desc=True).execute()
    return jsonify(docs.data or []), 200


@counselor_bp.route("/students/<student_id>/recommendations", methods=["GET"])
@require_auth(roles=["counselor"])
def get_student_recommendations_for_counselor(student_id):
    counselor_id = request.user["user_id"]

    assignment = supabase.table("counselor_assignments") \
        .select("id").eq("counselor_id", counselor_id).eq("student_id", student_id).execute()
    if not assignment.data:
        return jsonify({"error": "This student is not assigned to you"}), 403

    result = supabase.table("recommendations") \
        .select("*, colleges(name, location, category, fees_min, fees_max, ranking)") \
        .eq("student_id", student_id) \
        .order("score", desc=True) \
        .execute()
    return jsonify(result.data or []), 200


@counselor_bp.route("/students/<student_id>/suggest", methods=["POST"])
@require_auth(roles=["counselor"])
def suggest_alternative(student_id):
    counselor_id = request.user["user_id"]
    data = request.json or {}
    college_id = data.get("college_id")

    if not college_id:
        return jsonify({"error": "college_id is required"}), 400

    # Only allow suggesting for assigned students
    assignment = supabase.table("counselor_assignments") \
        .select("id").eq("counselor_id", counselor_id).eq("student_id", student_id).execute()
    if not assignment.data:
        return jsonify({"error": "This student is not assigned to you"}), 403

    # Verify college exists
    college = supabase.table("colleges").select("id").eq("id", college_id).execute()
    if not college.data:
        return jsonify({"error": "College not found"}), 404

    # Don't duplicate if already in recommendations
    existing = supabase.table("recommendations") \
        .select("id").eq("student_id", student_id).eq("college_id", college_id).execute()
    if existing.data:
        return jsonify({"message": "Already in recommendations"}), 200

    supabase.table("recommendations").insert({
        "student_id": student_id,
        "college_id": college_id,
        "level": "Alternative Option",
        "score": 0,
        "reasons": ["Suggested by your counselor as an alternative option"]
    }).execute()

    return jsonify({"message": "College suggested successfully"}), 201


@counselor_bp.route("/students/<student_id>/applications", methods=["GET"])
@require_auth(roles=["counselor"])
def get_student_applications_for_counselor(student_id):
    counselor_id = request.user["user_id"]

    assignment = supabase.table("counselor_assignments") \
        .select("id").eq("counselor_id", counselor_id).eq("student_id", student_id).execute()
    if not assignment.data:
        return jsonify({"error": "This student is not assigned to you"}), 403

    result = supabase.table("applications") \
        .select("*, colleges(name, location, category)") \
        .eq("student_id", student_id) \
        .order("applied_on", desc=True) \
        .execute()
    return jsonify(result.data or []), 200


@counselor_bp.route("/applications/<application_id>/status", methods=["PUT"])
@require_auth(roles=["counselor"])
def counselor_update_application_status(application_id):
    counselor_id = request.user["user_id"]
    data = request.json or {}
    new_status = data.get("status")

    valid_statuses = [
        "Application Started", "Application Submitted", "Under Review",
        "Admission Offered", "Admission Confirmed", "Rejected"
    ]
    if new_status not in valid_statuses:
        return jsonify({"error": f"status must be one of: {', '.join(valid_statuses)}"}), 400

    app_result = supabase.table("applications").select("student_id").eq("id", application_id).execute()
    if not app_result.data:
        return jsonify({"error": "Application not found"}), 404

    student_id = app_result.data[0]["student_id"]
    assignment = supabase.table("counselor_assignments") \
        .select("id").eq("counselor_id", counselor_id).eq("student_id", student_id).execute()
    if not assignment.data:
        return jsonify({"error": "This student is not assigned to you"}), 403

    supabase.table("applications").update({"status": new_status}).eq("id", application_id).execute()
    return jsonify({"message": "Application status updated"}), 200