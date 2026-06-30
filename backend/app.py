from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys
print("FLASK USING PYTHON:", sys.executable)
print("FLASK USING SUPABASE:", __import__("supabase").__version__)
load_dotenv()

app = Flask(__name__)
allowed_origins = os.environ.get("FRONTEND_URL", "http://localhost:5173").split(",")
CORS(app, origins=allowed_origins)

# Import and register routes
from routes.auth import auth_bp
from routes.student import student_bp
from routes.counselor import counselor_bp
from routes.admin import admin_bp
from routes.ai import ai_bp
from routes.messages import messages_bp
app.register_blueprint(messages_bp, url_prefix="/api/messages")
 
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(counselor_bp, url_prefix="/api/counselor")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(ai_bp, url_prefix="/api/ai")

@app.route("/api/health")
def health():
    return {"status": "ok", "message": "AI College Admission Guidance System API"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    app.run(debug=debug_mode, host="0.0.0.0", port=port)