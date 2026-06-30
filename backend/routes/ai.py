from flask import Blueprint, request, jsonify
from utils.auth_middleware import require_auth
from utils.supabase_client import supabase
from groq import Groq
import os

ai_bp = Blueprint("ai", __name__)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an expert AI Admission Counselor for Indian colleges and universities.
You help students with:
- College selection based on their marks, stream, and interests
- Course recommendations (Engineering, Medical, Arts, Law, Management, etc.)
- Entrance exam guidance (JEE, NEET, CLAT, CAT, etc.)
- Admission process, deadlines, and eligibility criteria
- Scholarship information
- Career path guidance

Be specific, accurate, and encouraging. Keep answers concise and actionable.
Always mention relevant entrance exams when discussing college options.
Focus on Indian education system.

CRITICAL RULE ABOUT CUTOFFS:
Never name specific colleges or claim a student is "likely eligible" for any college
unless you know their 12th percentage (or relevant entrance exam score) AND stream.
If the student's profile below shows these as "Not provided", or the student asks
something like "which colleges suit me" without giving a percentage in the chat,
do NOT guess or list colleges. Instead, ask them directly for their 12th percentage,
stream, and entrance exam score (if applicable) first. Once they provide it in the
chat (even if their profile is incomplete), use the number they gave you for that reply.
Be brief about asking — one short question, not a long form."""


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _log_activity(user_id: str, role: str, action: str, details: str = ""):
    """Insert a row into the activity_log table. Never raises — logging
    failures must never break the actual endpoint."""
    try:
        supabase.table("activity_log").insert({
            "user_id": user_id,
            "role": role,
            "action": action,
            "details": details,
        }).execute()
    except Exception:
        pass


# ─── Chat ─────────────────────────────────────────────────────────────────────

@ai_bp.route("/chat", methods=["POST"])
@require_auth(roles=["student", "counselor", "admin"])
def chat():
    data = request.json
    messages = data.get("messages", [])
    user_id = request.user["user_id"]

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    profile_context = ""
    if request.user["role"] == "student":
        profile_result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
        if profile_result.data:
            p = profile_result.data[0]
            profile_context = f"""
Student Profile Context:
- 12th Percentage: {p.get('twelfth_percentage', 'Not provided')}%
- Stream: {p.get('twelfth_stream', 'Not provided')}
- Entrance Exam: {p.get('entrance_exam', 'Not provided')} Score: {p.get('entrance_score', 'N/A')}
- Preferred Course: {p.get('preferred_course_category', 'Not specified')}
- Budget: {p.get('budget_range', 'Not specified')}
- Location Preference: {p.get('preferred_states', 'Any')}
"""

    system = SYSTEM_PROMPT
    if profile_context:
        system += f"\n\n{profile_context}"

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": system}] + messages,
            max_tokens=1024,
            temperature=0.7
        )
        reply = response.choices[0].message.content

        supabase.table("chat_history").insert({
            "user_id": user_id,
            "user_message": messages[-1]["content"],
            "ai_response": reply
        }).execute()

        _log_activity(user_id, request.user["role"], "ai_chat", "Used AI chatbot")
        return jsonify({"reply": reply}), 200

    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 500


# ─── Career Guidance ──────────────────────────────────────────────────────────

@ai_bp.route("/career-guidance", methods=["POST"])
@require_auth(roles=["student"])
def career_guidance():
    user_id = request.user["user_id"]
    data = request.json
    interests = data.get("interests", "")
    course = data.get("course", "")
    goal = data.get("goal", "")

    prompt = f"""
A student wants career guidance:
- Interests: {interests}
- Preferred Course: {course}
- Career Goal: {goal}

Provide:
1. Top 3 career paths that match their profile
2. Best courses to pursue in India for each path
3. Key entrance exams required
4. Average salary expectations
5. One specific advice for their situation

Be practical and specific to Indian job market.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )
        _log_activity(user_id, "student", "career_guidance", f"Goal: {goal}")
        return jsonify({"guidance": response.choices[0].message.content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Eligibility Check ────────────────────────────────────────────────────────

@ai_bp.route("/eligibility-check", methods=["POST"])
@require_auth(roles=["student"])
def eligibility_check():
    user_id = request.user["user_id"]
    profile_result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()

    if not profile_result.data:
        return jsonify({"error": "Profile not found"}), 404

    p = profile_result.data[0]

    if not p.get("twelfth_percentage"):
        return jsonify({
            "error": "Add your 12th percentage to your profile first — eligibility can't be assessed without it.",
            "missing_fields": ["twelfth_percentage"]
        }), 400

    prompt = f"""
Analyze this student's eligibility for various college types in India:

Student Details:
- 10th: {p.get('tenth_percentage')}%
- 12th: {p.get('twelfth_percentage')}% in {p.get('twelfth_stream')}
- Entrance Exam: {p.get('entrance_exam')} Score: {p.get('entrance_score')}
- Interests: {p.get('interests')}
- Budget: {p.get('budget_range')}

Provide eligibility analysis for:
1. Government Engineering Colleges (NIT/IIT level)
2. Private Engineering Colleges
3. Government Medical Colleges
4. Private Medical Colleges
5. Central Universities
6. State Universities

For each, state: Eligible / Borderline / Not Eligible and why.
Also mention what they should do to improve their chances.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.5
        )
        _log_activity(user_id, "student", "eligibility_check", "Ran eligibility analysis")
        return jsonify({"analysis": response.choices[0].message.content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Scholarship Recommendations ──────────────────────────────────────────────

@ai_bp.route("/scholarships", methods=["POST"])
@require_auth(roles=["student"])
def scholarship_recommendations():
    user_id = request.user["user_id"]

    profile_result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
    if not profile_result.data:
        return jsonify({"error": "Complete your profile first"}), 400

    p = profile_result.data[0]
    user_result = supabase.table("users").select("name").eq("id", user_id).execute()
    student_name = user_result.data[0]["name"] if user_result.data else "Student"

    if not p.get("twelfth_percentage"):
        return jsonify({
            "error": "Add your 12th percentage to get scholarship recommendations.",
            "missing_fields": ["twelfth_percentage"]
        }), 400

    prompt = f"""
A student needs scholarship recommendations for Indian higher education.

Student Profile:
- Name: {student_name}
- 12th Percentage: {p.get('twelfth_percentage')}% in {p.get('twelfth_stream')}
- 10th Percentage: {p.get('tenth_percentage', 'Not provided')}%
- Entrance Exam: {p.get('entrance_exam', 'None')} Score: {p.get('entrance_score', 'N/A')}
- Preferred Course: {p.get('preferred_course_category', 'Not specified')}
- Preferred College Type: {p.get('preferred_college_type', 'Any')}
- Budget Range: {p.get('budget_range', 'Not specified')}
- Gender: {p.get('gender', 'Not specified')}
- State: {p.get('state', 'Not specified')}

List 6-8 scholarships this student is likely eligible for. For each scholarship include:
1. Scholarship name
2. Awarding body (government/private/NGO)
3. Eligibility criteria (be specific about marks/income cutoffs)
4. Approximate amount per year
5. How to apply (website or process)
6. Application deadline (if fixed or typical month)

Prioritize:
- Central government scholarships (NSP, Central Sector, etc.)
- State government scholarships relevant to their state
- Merit-based scholarships matching their percentage
- Course-specific scholarships for their preferred field
- Private/corporate scholarships with broad eligibility

Be specific and accurate. Only list real scholarships that exist in India.
Format each scholarship clearly with a heading.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.4
        )
        _log_activity(user_id, "student", "scholarship_check", "Fetched scholarship recommendations")
        return jsonify({"scholarships": response.choices[0].message.content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Learning Path Suggestions ────────────────────────────────────────────────

@ai_bp.route("/learning-path", methods=["POST"])
@require_auth(roles=["student"])
def learning_path():
    user_id = request.user["user_id"]

    profile_result = supabase.table("student_profiles").select("*").eq("user_id", user_id).execute()
    if not profile_result.data:
        return jsonify({"error": "Complete your profile first"}), 400

    p = profile_result.data[0]
    data = request.json or {}
    career_goal = data.get("career_goal", "").strip()

    prompt = f"""
Create a personalized learning path for a student targeting Indian higher education and career.

Student Profile:
- 12th Stream: {p.get('twelfth_stream', 'Not specified')}
- 12th Percentage: {p.get('twelfth_percentage', 'Not provided')}%
- Preferred Course: {p.get('preferred_course_category', 'Not specified')}
- Interests: {p.get('interests', 'Not specified')}
- Entrance Exam: {p.get('entrance_exam', 'None')} Score: {p.get('entrance_score', 'N/A')}
- Career Goal: {career_goal or 'Not specified'}

Provide a structured learning path with these sections:

1. IMMEDIATE (Next 3 months)
   - Entrance exam preparation steps
   - Key subjects to focus on
   - Free/paid resources (name specific platforms: NPTEL, Coursera, Khan Academy, etc.)

2. SHORT TERM (First year of college)
   - Core skills to build in their chosen field
   - Certifications worth pursuing
   - Internship/project ideas for freshers

3. MEDIUM TERM (2nd and 3rd year)
   - Advanced skills and specializations
   - Competitions and hackathons relevant to their field
   - Industry certifications (AWS, Google, GATE, etc.)

4. LONG TERM (Final year and placement)
   - Placement preparation strategy
   - Higher education options (M.Tech, MBA, MS abroad, etc.)
   - Career entry points and expected salaries

Be specific to Indian education system and job market. Name actual platforms,
certifications, and resources. Keep each section concise and actionable.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.6
        )
        _log_activity(user_id, "student", "learning_path", f"Career goal: {career_goal}")
        return jsonify({"learning_path": response.choices[0].message.content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Activity Log (admin) ─────────────────────────────────────────────────────

@ai_bp.route("/activity-log", methods=["GET"])
@require_auth(roles=["admin"])
def get_activity_log():
    limit = int(request.args.get("limit", 100))
    role_filter = request.args.get("role", "")
    action_filter = request.args.get("action", "")

    query = supabase.table("activity_log") \
        .select("id, user_id, role, action, details, created_at, users(name, email)") \
        .order("created_at", desc=True) \
        .limit(limit)

    if role_filter:
        query = query.eq("role", role_filter)
    if action_filter:
        query = query.eq("action", action_filter)

    result = query.execute()
    return jsonify(result.data or []), 200