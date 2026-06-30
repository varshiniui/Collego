import jwt
import os
from functools import wraps
from flask import request, jsonify

SECRET = os.environ.get("JWT_SECRET", "admission_ai_secret_2024")

def generate_token(user_id: str, role: str, email: str) -> str:
    payload = {"user_id": user_id, "role": role, "email": email}
    return jwt.encode(payload, SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=["HS256"])

def require_auth(roles=None):
    """Decorator to protect routes. Pass roles=["student"] to restrict."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or invalid token"}), 401
            token = auth_header.split(" ")[1]
            try:
                payload = decode_token(token)
                if roles and payload.get("role") not in roles:
                    return jsonify({"error": "Access denied"}), 403
                request.user = payload
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401
            return f(*args, **kwargs)
        return decorated
    return decorator
