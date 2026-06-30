# Add this file as routes/messages.py
# Then in app.py add:
#   from routes.messages import messages_bp
#   app.register_blueprint(messages_bp, url_prefix="/api/messages")

from flask import Blueprint, request, jsonify
from utils.supabase_client import supabase
from utils.auth_middleware import require_auth

messages_bp = Blueprint("messages", __name__)


def _get_thread_pair(user_id, role):
    """
    Returns (student_id, counselor_id) for the current user.
    Students look up their assigned counselor.
    Counselors pass student_id as a query param.
    """
    if role == "student":
        assignment = supabase.table("counselor_assignments") \
            .select("counselor_id") \
            .eq("student_id", user_id) \
            .execute()
        if not assignment.data:
            return None, None
        return user_id, assignment.data[0]["counselor_id"]
    else:
        student_id = request.args.get("student_id") or (request.json or {}).get("student_id")
        if not student_id:
            return None, None
        return student_id, user_id


@messages_bp.route("/thread", methods=["GET"])
@require_auth(roles=["student", "counselor"])
def get_thread():
    user_id = request.user["user_id"]
    role = request.user["role"]

    student_id, counselor_id = _get_thread_pair(user_id, role)
    if not student_id or not counselor_id:
        if role == "student":
            return jsonify({"error": "You don't have an assigned counselor yet"}), 404
        return jsonify({"error": "student_id query param required"}), 400

    # Verify counselor is actually assigned to this student
    if role == "counselor":
        assignment = supabase.table("counselor_assignments") \
            .select("id") \
            .eq("student_id", student_id) \
            .eq("counselor_id", counselor_id) \
            .execute()
        if not assignment.data:
            return jsonify({"error": "This student is not assigned to you"}), 403

    result = supabase.table("messages") \
        .select("id, sender_id, body, created_at, is_read") \
        .eq("student_id", student_id) \
        .eq("counselor_id", counselor_id) \
        .order("created_at", desc=False) \
        .execute()

    # Mark unread messages sent to this user as read
    supabase.table("messages") \
        .update({"is_read": True}) \
        .eq("student_id", student_id) \
        .eq("counselor_id", counselor_id) \
        .neq("sender_id", user_id) \
        .eq("is_read", False) \
        .execute()

    return jsonify(result.data or []), 200


@messages_bp.route("/send", methods=["POST"])
@require_auth(roles=["student", "counselor"])
def send_message():
    user_id = request.user["user_id"]
    role = request.user["role"]
    data = request.json or {}
    body = (data.get("body") or "").strip()

    if not body:
        return jsonify({"error": "Message cannot be empty"}), 400

    student_id, counselor_id = _get_thread_pair(user_id, role)
    if not student_id or not counselor_id:
        if role == "student":
            return jsonify({"error": "You don't have an assigned counselor yet"}), 404
        return jsonify({"error": "student_id is required"}), 400

    # Verify assignment
    assignment = supabase.table("counselor_assignments") \
        .select("id") \
        .eq("student_id", student_id) \
        .eq("counselor_id", counselor_id) \
        .execute()
    if not assignment.data:
        return jsonify({"error": "No assignment found between this student and counselor"}), 403

    result = supabase.table("messages").insert({
        "student_id": student_id,
        "counselor_id": counselor_id,
        "sender_id": user_id,
        "body": body,
    }).execute()

    return jsonify(result.data[0] if result.data else {}), 201


@messages_bp.route("/unread-count", methods=["GET"])
@require_auth(roles=["student", "counselor"])
def unread_count():
    """
    Returns count of unread messages sent TO the current user.
    Used for sidebar badge.
    """
    user_id = request.user["user_id"]
    role = request.user["role"]

    query = supabase.table("messages") \
        .select("id", count="exact") \
        .neq("sender_id", user_id) \
        .eq("is_read", False)

    if role == "student":
        query = query.eq("student_id", user_id)
    else:
        query = query.eq("counselor_id", user_id)

    result = query.execute()
    return jsonify({"unread": result.count or 0}), 200