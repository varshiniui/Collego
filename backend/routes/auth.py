from flask import Blueprint, request, jsonify
from utils.supabase_client import supabase
from utils.auth_middleware import generate_token
import bcrypt
import uuid

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "student")  # student | counselor | admin

    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required"}), 400

    if role not in ["student", "counselor", "admin"]:
        return jsonify({"error": "Invalid role"}), 400

    # Check if email already exists
    existing = supabase.table("users").select("id").eq("email", email).execute()
    if existing.data:
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())

    user = supabase.table("users").insert({
        "id": user_id,
        "name": name,
        "email": email,
        "password_hash": hashed,
        "role": role,
        "is_active": True
    }).execute()

    # Create role-specific profile
    if role == "student":
        supabase.table("student_profiles").insert({
            "user_id": user_id,
            "application_status": "Profile Created"
        }).execute()

    token = generate_token(user_id, role, email)
    return jsonify({
        "token": token,
        "user": {"id": user_id, "name": name, "email": email, "role": role}
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not all([email, password]):
        return jsonify({"error": "Email and password required"}), 400

    result = supabase.table("users").select("*").eq("email", email).execute()
    if not result.data:
        return jsonify({"error": "Invalid email or password"}), 401

    user = result.data[0]
    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.get("is_active"):
        return jsonify({"error": "Account is deactivated"}), 403

    token = generate_token(user["id"], user["role"], user["email"])
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    from utils.auth_middleware import decode_token
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Not authenticated"}), 401
    token = auth_header.split(" ")[1]
    try:
        payload = decode_token(token)
        result = supabase.table("users").select("id, name, email, role").eq("id", payload["user_id"]).execute()
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401
