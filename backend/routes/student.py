from flask import Blueprint, request, jsonify
from utils.supabase_client import supabase
from utils.auth_middleware import require_auth
from ml.recommendation_engine import get_recommendations, get_course_recommendations
from ml.report_generator import generate_recommendation_report_pdf
from flask import send_file
import uuid
import os

student_bp = Blueprint("student", __name__)

# ─── Profile ──────────────────────────────────────────────────────────────────

PCM_STREAM = "Group I - Computer Science (PCM + CS)"


def calculate_tnea_cutoff(maths, physics, chemistry):
    """
    Standard TNEA engineering cutoff formula:
    Cutoff (out of 200) = Maths + (Physics / 2) + (Chemistry / 2)
    All three subject marks are expected out of 100.
    Returns None if any mark is missing so we never silently fabricate
    a cutoff from incomplete data.
    """
    if maths is None or physics is None or chemistry is None:
        return None
    try:
        m, p, c = float(maths), float(physics), float(chemistry)
    except (TypeError, ValueError):
        return None
    cutoff = m + (p / 2) + (c / 2)
    return round(cutoff, 2)


@student_bp.route("/profile", methods=["GET"])
@require_auth(roles=["student"])
def get_profile():
    user_id = request.user["user_id"]
    result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
    return jsonify(result.data[0] if result.data else {}), 200


@student_bp.route("/profile", methods=["PUT"])
@require_auth(roles=["student"])
def update_profile():
    user_id = request.user["user_id"]
    data = request.json or {}
    allowed = [
        "phone", "date_of_birth", "gender", "city", "state",
        "tenth_percentage", "twelfth_percentage", "twelfth_stream",
        "maths_marks", "physics_marks", "chemistry_marks",
        "entrance_exam", "entrance_score", "interests",
        "preferred_course_category", "preferred_college_type",
        "budget_range", "preferred_states"
    ]
    update_data = {k: v for k, v in data.items() if k in allowed}

    # Numeric columns reject an empty string outright at the DB level
    # ("invalid input syntax for type numeric"). Convert "" to None for
    # those specific fields only — this is a type-correctness fix, not a
    # blanket anti-wipe filter. Text fields (interests, twelfth_stream,
    # etc.) are left exactly as sent, so a deliberate clear actually clears.
    NUMERIC_FIELDS = {
        "tenth_percentage", "twelfth_percentage", "maths_marks",
        "physics_marks", "chemistry_marks", "entrance_score"
    }
    for field in NUMERIC_FIELDS:
        if field in update_data and update_data[field] == "":
            update_data[field] = None

    if not update_data:
        return jsonify({"message": "Nothing to update", "updated": False}), 200

    existing = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
    current = existing.data[0] if existing.data else {}

    # Recalculate TNEA cutoff whenever any PCM mark changes (or stream
    # changes), using the freshest available values: whatever's in this
    # request, falling back to whatever's already saved.
    maths = update_data.get("maths_marks", current.get("maths_marks"))
    physics = update_data.get("physics_marks", current.get("physics_marks"))
    chemistry = update_data.get("chemistry_marks", current.get("chemistry_marks"))
    stream = update_data.get("twelfth_stream", current.get("twelfth_stream"))

    if stream == PCM_STREAM:
        cutoff = calculate_tnea_cutoff(maths, physics, chemistry)
        if cutoff is not None:
            update_data["tnea_cutoff"] = cutoff

    if existing.data:
        supabase.table("student_profiles").update(update_data).eq("user_id", user_id).execute()
    else:
        update_data["user_id"] = user_id
        supabase.table("student_profiles").insert(update_data).execute()

    return jsonify({"message": "Profile updated successfully", "updated": True}), 200




# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@student_bp.route("/dashboard", methods=["GET"])
@require_auth(roles=["student"])
def dashboard():
    user_id = request.user["user_id"]

    recs = supabase.table("recommendations") \
        .select("id, level, score, colleges(name)") \
        .eq("student_id", user_id) \
        .order("score", desc=True) \
        .execute()
    saved = supabase.table("saved_colleges").select("id").eq("student_id", user_id).execute()
    apps = supabase.table("applications").select("id, status").eq("student_id", user_id).execute()

    total_recs = len(recs.data) if recs.data else 0
    eligible = len([r for r in (recs.data or []) if r["level"] in ["Highly Recommended", "Recommended"]])
    submitted = len([a for a in (apps.data or []) if a["status"] in ["Application Submitted", "Under Review", "Admission Offered", "Admission Confirmed"]])
    offers = len([a for a in (apps.data or []) if a["status"] == "Admission Offered"])
    saved_count = len(saved.data) if saved.data else 0

    recent = []
    for r in (recs.data or [])[:5]:
        college = r.get("colleges") or {}
        recent.append({
            "id": r["id"],
            "level": r["level"],
            "score": r["score"],
            "college_name": college.get("name", "Unknown college")
        })

    return jsonify({
        "total_recommended": total_recs,
        "eligible_colleges": eligible,
        "submitted_applications": submitted,
        "admission_offers": offers,
        "saved_colleges": saved_count,
        "recent_recommendations": recent
    }), 200


# ─── AI Recommendations ───────────────────────────────────────────────────────

@student_bp.route("/recommendations", methods=["GET"])
@require_auth(roles=["student"])
def get_student_recommendations():
    user_id = request.user["user_id"]
    result = supabase.table("recommendations") \
        .select("*, colleges(name, location, category, fees_min, fees_max, ranking)") \
        .eq("student_id", user_id) \
        .order("score", desc=True) \
        .execute()
    return jsonify(result.data), 200


@student_bp.route("/courses/recommended", methods=["GET"])
@require_auth(roles=["student"])
def get_recommended_courses():
    user_id = request.user["user_id"]

    profile_result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
    if not profile_result.data:
        return jsonify({"error": "Please complete your profile first"}), 400
    profile = profile_result.data[0]

    if not profile.get("twelfth_percentage") or not profile.get("preferred_course_category"):
        return jsonify({
            "error": "Add your 12th percentage and preferred course category to get course recommendations",
            "missing_fields": ["12th percentage", "preferred course category"]
        }), 400

    colleges_result = supabase.table("colleges").select("*").eq("is_active", True).execute()
    colleges = colleges_result.data or []
    if not colleges:
        return jsonify({"error": "No colleges found in database"}), 400

    courses = get_course_recommendations(profile, colleges)
    return jsonify(courses[:20]), 200  # top 20 courses


@student_bp.route("/recommendations/generate", methods=["POST"])
@require_auth(roles=["student"])
def generate_recommendations():
    user_id = request.user["user_id"]

    # Get student profile
    profile_result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
    if not profile_result.data:
        return jsonify({"error": "Please complete your profile first"}), 400

    profile = profile_result.data[0]

    # Require the fields the recommendation engine actually needs to assess
    # eligibility. Without these, every college looks equally "fine" and
    # students get recommendations that don't reflect their real chances.
    missing = []
    if not profile.get("twelfth_percentage"):
        missing.append("12th percentage")
    if not profile.get("twelfth_stream"):
        missing.append("12th stream")
    if not profile.get("preferred_course_category"):
        missing.append("preferred course category")

    # Engineering aspirants from the PCM+CS stream need their subject marks
    # to calculate a real TNEA cutoff — without it we'd only have the raw
    # 12th percentage, which understates/overstates engineering eligibility.
    is_pcm_engineering = (
        profile.get("twelfth_stream") == PCM_STREAM
        and (profile.get("preferred_course_category") or "").lower() == "engineering"
    )
    if is_pcm_engineering and not profile.get("tnea_cutoff"):
        missing.append("Maths/Physics/Chemistry marks (for cutoff calculation)")

    if missing:
        return jsonify({
            "error": f"Please add the following to your profile before generating recommendations: {', '.join(missing)}",
            "missing_fields": missing
        }), 400

    # Get all colleges
    colleges_result = supabase.table("colleges").select("*").eq("is_active", True).execute()
    colleges = colleges_result.data or []

    if not colleges:
        return jsonify({"error": "No colleges found in database"}), 400

    # Run ML recommendation engine
    recommendations = get_recommendations(profile, colleges)

    # Clear old recommendations
    supabase.table("recommendations").delete().eq("student_id", user_id).execute()

    # Save new recommendations. Cap at 50 (not all 65+) purely to keep the
    # page reasonably scannable — but report the count actually saved, not
    # the full engine output, so the toast message matches what's shown.
    SAVE_LIMIT = 50
    saved_count = 0
    if recommendations:
        to_insert = [{
            "student_id": user_id,
            "college_id": r["college_id"],
            "level": r["level"],
            "score": r["score"],
            "reasons": r["reasons"]
        } for r in recommendations[:SAVE_LIMIT]]
        supabase.table("recommendations").insert(to_insert).execute()
        saved_count = len(to_insert)

    # Update application status
    supabase.table("student_profiles").update({"application_status": "Recommended"}).eq("user_id", user_id).execute()

    return jsonify({"message": "Recommendations generated", "count": saved_count}), 200


# ─── Saved Colleges ───────────────────────────────────────────────────────────

@student_bp.route("/saved", methods=["GET"])
@require_auth(roles=["student"])
def get_saved():
    user_id = request.user["user_id"]
    result = supabase.table("saved_colleges") \
        .select("*, colleges(*)") \
        .eq("student_id", user_id).execute()
    return jsonify(result.data), 200


@student_bp.route("/saved/<college_id>", methods=["POST"])
@require_auth(roles=["student"])
def save_college(college_id):
    user_id = request.user["user_id"]
    existing = supabase.table("saved_colleges").select("id") \
        .eq("student_id", user_id).eq("college_id", college_id).execute()
    if existing.data:
        return jsonify({"message": "Already saved"}), 200
    supabase.table("saved_colleges").insert({
        "student_id": user_id, "college_id": college_id
    }).execute()
    return jsonify({"message": "College saved"}), 201


@student_bp.route("/saved/<college_id>", methods=["DELETE"])
@require_auth(roles=["student"])
def unsave_college(college_id):
    user_id = request.user["user_id"]
    supabase.table("saved_colleges").delete() \
        .eq("student_id", user_id).eq("college_id", college_id).execute()
    return jsonify({"message": "Removed from saved"}), 200


# ─── Saved Courses ────────────────────────────────────────────────────────────
# Courses aren't standalone DB rows (they're parsed from each college's
# courses_offered text), so saved courses are stored by name rather than
# a foreign key to a courses table.

@student_bp.route("/saved-courses", methods=["GET"])
@require_auth(roles=["student"])
def get_saved_courses():
    user_id = request.user["user_id"]
    result = supabase.table("saved_courses") \
        .select("*") \
        .eq("student_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return jsonify(result.data or []), 200


@student_bp.route("/saved-courses", methods=["POST"])
@require_auth(roles=["student"])
def save_course():
    user_id = request.user["user_id"]
    data = request.json or {}
    course_name = (data.get("course_name") or "").strip()
    if not course_name:
        return jsonify({"error": "course_name is required"}), 400

    existing = supabase.table("saved_courses").select("id") \
        .eq("student_id", user_id).eq("course_name", course_name).execute()
    if existing.data:
        return jsonify({"message": "Already saved"}), 200

    result = supabase.table("saved_courses").insert({
        "student_id": user_id, "course_name": course_name
    }).execute()
    return jsonify(result.data[0] if result.data else {"course_name": course_name}), 201


@student_bp.route("/saved-courses", methods=["DELETE"])
@require_auth(roles=["student"])
def unsave_course():
    user_id = request.user["user_id"]
    course_name = (request.args.get("course_name") or "").strip()
    if not course_name:
        return jsonify({"error": "course_name query param is required"}), 400
    supabase.table("saved_courses").delete() \
        .eq("student_id", user_id).eq("course_name", course_name).execute()
    return jsonify({"message": "Removed from saved"}), 200


# ─── College Search ───────────────────────────────────────────────────────────

@student_bp.route("/colleges/search", methods=["GET"])
@require_auth(roles=["student", "counselor", "admin"])
def search_colleges():
    q = request.args
    query = supabase.table("colleges").select("*").eq("is_active", True)

    if q.get("name"):
        query = query.ilike("name", f"%{q['name']}%")
    if q.get("category"):
        query = query.eq("category", q["category"])
    if q.get("ownership_type"):
        query = query.eq("college_type", q["ownership_type"])
    if q.get("state"):
        query = query.ilike("location", f"%{q['state']}%")
    if q.get("course_category"):
        query = query.ilike("courses_offered", f"%{q['course_category']}%")

    result = query.order("ranking", desc=False).limit(50).execute()
    return jsonify(result.data), 200


# ─── Documents (mark sheets / certificates) ───────────────────────────────────

STORAGE_BUCKET = "student-documents"
ALLOWED_DOC_TYPES = [
    "10th Marksheet", "12th Marksheet", "Transfer Certificate",
    "Entrance Scorecard", "Community Certificate", "Other"
]
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _allowed_file(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS


@student_bp.route("/documents", methods=["GET"])
@require_auth(roles=["student"])
def list_documents():
    user_id = request.user["user_id"]
    result = supabase.table("student_documents") \
        .select("*") \
        .eq("student_id", user_id) \
        .order("uploaded_at", desc=True) \
        .execute()
    return jsonify(result.data or []), 200


@student_bp.route("/documents", methods=["POST"])
@require_auth(roles=["student"])
def upload_document():
    user_id = request.user["user_id"]

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send a file under the 'file' field."}), 400

    file = request.files["file"]
    document_type = request.form.get("document_type", "Other")

    if document_type not in ALLOWED_DOC_TYPES:
        return jsonify({"error": f"document_type must be one of: {', '.join(ALLOWED_DOC_TYPES)}"}), 400

    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": "Only PDF, JPG, and PNG files are allowed"}), 400

    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return jsonify({"error": "File too large. Maximum size is 10MB."}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    storage_path = f"{user_id}/{uuid.uuid4()}.{ext}"

    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            storage_path,
            file_bytes,
            file_options={"content-type": file.mimetype or "application/octet-stream"}
        )
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    record = {
        "student_id": user_id,
        "document_type": document_type,
        "file_name": file.filename,
        "storage_path": storage_path,
        "file_size_kb": round(len(file_bytes) / 1024, 2)
    }
    result = supabase.table("student_documents").insert(record).execute()

    return jsonify(result.data[0] if result.data else record), 201


@student_bp.route("/documents/<document_id>/download", methods=["GET"])
@require_auth(roles=["student", "counselor", "admin"])
def get_document_download_url(document_id):
    user_id = request.user["user_id"]
    role = request.user["role"]

    doc_result = supabase.table("student_documents").select("*").eq("id", document_id).execute()
    if not doc_result.data:
        return jsonify({"error": "Document not found"}), 404

    doc = doc_result.data[0]

    # Students can only access their own documents. Counselors/admins can
    # access any student's documents (e.g. for verification review).
    if role == "student" and doc["student_id"] != user_id:
        return jsonify({"error": "Access denied"}), 403

    try:
        # Signed URL valid for 5 minutes — short-lived since these are
        # personal documents (marksheets, certificates).
        signed = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(
            doc["storage_path"], 300
        )
        url = signed.get("signedURL") or signed.get("signed_url")
    except Exception as e:
        return jsonify({"error": f"Could not generate download link: {str(e)}"}), 500

    return jsonify({"url": url, "file_name": doc["file_name"]}), 200


@student_bp.route("/documents/<document_id>", methods=["DELETE"])
@require_auth(roles=["student"])
def delete_document(document_id):
    user_id = request.user["user_id"]

    doc_result = supabase.table("student_documents").select("*").eq("id", document_id).execute()
    if not doc_result.data:
        return jsonify({"error": "Document not found"}), 404

    doc = doc_result.data[0]
    if doc["student_id"] != user_id:
        return jsonify({"error": "Access denied"}), 403

    try:
        supabase.storage.from_(STORAGE_BUCKET).remove([doc["storage_path"]])
    except Exception:
        pass  # If the file's already gone from storage, still clean up the DB row

    supabase.table("student_documents").delete().eq("id", document_id).execute()
    return jsonify({"message": "Document deleted"}), 200


# ─── Application Tracking ──────────────────────────────────────────────────────

APPLICATION_STATUSES = [
    "Application Started", "Application Submitted", "Under Review",
    "Admission Offered", "Admission Confirmed", "Rejected"
]


@student_bp.route("/applications", methods=["GET"])
@require_auth(roles=["student"])
def get_applications():
    user_id = request.user["user_id"]
    result = supabase.table("applications") \
        .select("*, colleges(name, location, category, fees_min, fees_max)") \
        .eq("student_id", user_id) \
        .order("applied_on", desc=True) \
        .execute()
    return jsonify(result.data or []), 200


@student_bp.route("/applications/<college_id>", methods=["POST"])
@require_auth(roles=["student"])
def create_application(college_id):
    user_id = request.user["user_id"]

    college = supabase.table("colleges").select("id").eq("id", college_id).execute()
    if not college.data:
        return jsonify({"error": "College not found"}), 404

    existing = supabase.table("applications").select("id") \
        .eq("student_id", user_id).eq("college_id", college_id).execute()
    if existing.data:
        return jsonify({"error": "You've already started an application to this college"}), 400

    result = supabase.table("applications").insert({
        "student_id": user_id,
        "college_id": college_id,
        "status": "Application Started"
    }).execute()
    return jsonify(result.data[0] if result.data else {}), 201


@student_bp.route("/applications/<application_id>/status", methods=["PUT"])
@require_auth(roles=["student"])
def update_application_status(application_id):
    user_id = request.user["user_id"]
    data = request.json or {}
    new_status = data.get("status")

    if new_status not in APPLICATION_STATUSES:
        return jsonify({"error": f"status must be one of: {', '.join(APPLICATION_STATUSES)}"}), 400

    app_result = supabase.table("applications").select("*").eq("id", application_id).execute()
    if not app_result.data:
        return jsonify({"error": "Application not found"}), 404
    if app_result.data[0]["student_id"] != user_id:
        return jsonify({"error": "Access denied"}), 403

    # Students can self-report up through "Application Submitted" — moving
    # further (Under Review, Admission Offered/Confirmed, Rejected) reflects
    # a real-world decision made by the college/counselor, not something a
    # student should be able to set for themselves.
    self_settable = ["Application Started", "Application Submitted"]
    if new_status not in self_settable:
        return jsonify({"error": "This status can only be updated by your counselor once a decision is made"}), 403

    supabase.table("applications").update({"status": new_status}).eq("id", application_id).execute()
    return jsonify({"message": "Application status updated"}), 200


@student_bp.route("/applications/<application_id>", methods=["DELETE"])
@require_auth(roles=["student"])
def withdraw_application(application_id):
    user_id = request.user["user_id"]
    app_result = supabase.table("applications").select("student_id").eq("id", application_id).execute()
    if not app_result.data:
        return jsonify({"error": "Application not found"}), 404
    if app_result.data[0]["student_id"] != user_id:
        return jsonify({"error": "Access denied"}), 403

    supabase.table("applications").delete().eq("id", application_id).execute()
    return jsonify({"message": "Application withdrawn"}), 200


# ─── Recommendation Report (PDF) ───────────────────────────────────────────────

@student_bp.route("/reports/recommendations.pdf", methods=["GET"])
@require_auth(roles=["student"])
def download_recommendation_report():
    user_id = request.user["user_id"]

    user_result = supabase.table("users").select("name").eq("id", user_id).execute()
    student_name = user_result.data[0]["name"] if user_result.data else "Student"

    profile_result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
    if not profile_result.data:
        return jsonify({"error": "Complete your profile before downloading a report"}), 400
    profile = profile_result.data[0]

    recs_result = supabase.table("recommendations") \
        .select("level, score, reasons, colleges(name, location, fees_min, fees_max)") \
        .eq("student_id", user_id) \
        .order("score", desc=True) \
        .execute()

    college_recs = []
    for r in (recs_result.data or []):
        college = r.get("colleges") or {}
        college_recs.append({
            "college_name": college.get("name", "Unknown college"),
            "location": college.get("location", ""),
            "fees_min": college.get("fees_min"),
            "fees_max": college.get("fees_max"),
            "level": r.get("level"),
            "reasons": r.get("reasons") or []
        })

    if not college_recs:
        return jsonify({"error": "Generate recommendations first before downloading a report"}), 400

    colleges_result = supabase.table("colleges").select("*").eq("is_active", True).execute()
    colleges = colleges_result.data or []
    course_recs = get_course_recommendations(profile, colleges) if colleges else []

    pdf_buf = generate_recommendation_report_pdf(student_name, profile, college_recs, course_recs)

    return send_file(
        pdf_buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"Collego_Recommendations_{student_name.replace(' ', '_')}.pdf"
    )