"""
AI Recommendation Engine
Uses rule-based scoring + TF-IDF cosine similarity for college recommendations.
This is the core AIML component of the project.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict

# ─── Recommendation Level Thresholds ─────────────────────────────────────────
LEVELS = [
    (0.75, "Highly Recommended"),
    (0.55, "Recommended"),
    (0.35, "Suitable"),
    (0.0,  "Alternative Option"),
]

# How far below a college's cutoff a student can be before we treat them
# as ineligible. Two thresholds:
#   HARD_CUTOFF_GAP   -> beyond this, the college is dropped entirely
#   SOFT_CUTOFF_GAP   -> beyond this (but within hard gap), capped at
#                        "Alternative Option" no matter how well other
#                        factors (budget/interest/type) score
HARD_CUTOFF_GAP = 15.0   # e.g. student is 15+ % below cutoff -> excluded
SOFT_CUTOFF_GAP = 5.0    # e.g. student is 5-15% below cutoff -> capped


PCM_STREAM = "Group I - Computer Science (PCM + CS)"


def get_effective_academic_score(profile: dict) -> tuple[float, str]:
    """
    Returns (value, label) — the number to compare against a college's
    min_cutoff_percentage, and a human label for messaging.

    For PCM+CS (Group I) students with a calculated TNEA cutoff (out of
    200), we normalize it to a 0-100 scale so it's directly comparable to
    min_cutoff_percentage, which is stored as a percentage in our college
    data. For everyone else, raw 12th percentage is used as-is.
    """
    tnea_cutoff = profile.get("tnea_cutoff")
    if profile.get("twelfth_stream") == PCM_STREAM and tnea_cutoff:
        try:
            normalized = (float(tnea_cutoff) / 200.0) * 100.0
            return round(normalized, 2), f"TNEA cutoff {tnea_cutoff}/200"
        except (TypeError, ValueError):
            pass
    twelfth = profile.get("twelfth_percentage")
    return float(twelfth) if twelfth else 0.0, "12th percentage"


def get_level(score: float) -> str:
    for threshold, label in LEVELS:
        if score >= threshold:
            return label
    return "Alternative Option"


def _percentage_based_score(academic_value, academic_label, min_cutoff):
    """Existing TNEA-style percentage comparison. Returns (score, is_eligible, reason)."""
    gap = min_cutoff - academic_value
    if academic_value >= min_cutoff + 15:
        return 1.0, True, f"Your {academic_label} ({academic_value}) is well above the {min_cutoff}% cutoff"
    elif academic_value >= min_cutoff + 5:
        return 0.8, True, f"Your {academic_label} ({academic_value}) comfortably meets the {min_cutoff}% requirement"
    elif academic_value >= min_cutoff:
        return 0.6, True, f"Your {academic_label} ({academic_value}) meets the minimum {min_cutoff}% cutoff"
    elif gap <= SOFT_CUTOFF_GAP:
        return 0.3, True, f"Slightly below the {min_cutoff}% cutoff — your {academic_label} is {academic_value} — worth applying as a stretch option"
    elif gap <= HARD_CUTOFF_GAP:
        return 0.05, True, f"Below the {min_cutoff}% cutoff — your {academic_label} is {academic_value} — admission unlikely without management/quota seats"
    else:
        return 0.0, False, f"Your {academic_label} ({academic_value}) is well below the {min_cutoff}% cutoff for this college"


def _rank_based_score(student_rank, typical_rank, exam_name):
    """
    Rank-based admission (JEE/VITEEE/SRMJEEE/MET): LOWER rank is better.
    A student with rank well under the typical cutoff rank is a strong fit;
    a rank far above it (a much "worse"/higher number) means not eligible.
    Uses the same relative-gap thresholds as percentage, just inverted.
    """
    gap = student_rank - typical_rank  # positive => student's rank is worse (higher number) than typical cutoff
    gap_pct = (gap / typical_rank) * 100 if typical_rank else 0

    if student_rank <= typical_rank * 0.5:
        return 1.0, True, f"Your {exam_name} rank ({int(student_rank)}) is well within the typical closing rank (~{int(typical_rank)})"
    elif student_rank <= typical_rank * 0.85:
        return 0.8, True, f"Your {exam_name} rank ({int(student_rank)}) comfortably meets the typical closing rank (~{int(typical_rank)})"
    elif student_rank <= typical_rank:
        return 0.6, True, f"Your {exam_name} rank ({int(student_rank)}) is near the typical closing rank (~{int(typical_rank)})"
    elif gap_pct <= 15:
        return 0.3, True, f"Your {exam_name} rank ({int(student_rank)}) is slightly above the typical closing rank (~{int(typical_rank)}) — worth applying as a stretch option"
    elif gap_pct <= 40:
        return 0.05, True, f"Your {exam_name} rank ({int(student_rank)}) is well above the typical closing rank (~{int(typical_rank)}) — admission unlikely"
    else:
        return 0.0, False, f"Your {exam_name} rank ({int(student_rank)}) is far above the typical closing rank (~{int(typical_rank)}) for this college"


def _score_based_score(student_score, typical_score, exam_name):
    """Score-based admission (BITSAT): HIGHER score is better — same shape as percentage logic."""
    return _percentage_based_score(student_score, f"{exam_name} score", typical_score)


# Categories that are NOT remotely related to each other — an interest
# keyword match shouldn't count for much if the college's category has
# nothing to do with what the student is asking for, and a category
# mismatch across these groups caps the recommendation level even when
# academics/budget look great.
UNRELATED_CATEGORY_GROUPS = [
    {"engineering", "polytechnic"},
    {"medical"},
    {"law"},
    {"management"},
    {"arts and science"},
    {"distance education"},
    {"international universities"},
]


def _categories_related(cat_a, cat_b):
    if not cat_a or not cat_b:
        return True  # unknown — don't penalize
    for group in UNRELATED_CATEGORY_GROUPS:
        if cat_a in group and cat_b not in group:
            return False
        if cat_b in group and cat_a not in group:
            return False
    return True


# ─── Score Calculator ─────────────────────────────────────────────────────────

def calculate_college_score(profile: dict, college: dict) -> tuple[float, list, bool]:
    """
    Returns (score 0-1, list of reasons, is_eligible).
    Score is a weighted combination of:
      - Academic eligibility (40%)
      - Category match (25%)
      - Budget fit (20%)
      - Entrance exam match (15%)

    is_eligible is False when the student's marks fall far enough below
    the college's cutoff that recommending it would be misleading. Callers
    should drop ineligible colleges from results entirely.
    """
    score = 0.0
    reasons = []
    is_eligible = True

    # ── 1. Academic Eligibility (40%) ─────────────────────────────────────────
    admission_basis = (college.get("admission_basis") or "TNEA").strip()
    RANK_BASED_EXAMS = {"JEE Main", "JEE Advanced", "VITEEE", "SRMJEEE", "MET"}

    if admission_basis in RANK_BASED_EXAMS:
        student_exam = (profile.get("entrance_exam") or "").strip()
        student_score = profile.get("entrance_score")
        typical_rank = college.get("typical_rank_cutoff")

        if student_exam == admission_basis and student_score and typical_rank:
            # entrance_score holds the student's RANK for rank-based exams
            # (the field is generic; for JEE/VITEEE/etc a "score" the
            # student reports is conventionally their rank, since that's
            # what counseling actually uses).
            academic_score, is_eligible, reason = _rank_based_score(float(student_score), float(typical_rank), admission_basis)
            reasons.append(reason)
        else:
            # We don't have the right exam's rank for this college — can't
            # assess eligibility here, so don't penalize, but be explicit
            # about why instead of silently scoring as if it were a TNEA match.
            academic_score = 0.4
            is_eligible = True
            reasons.append(f"This college admits via {admission_basis} rank — add your {admission_basis} rank to your profile for an accurate match")

    elif admission_basis == "BITSAT":
        student_exam = (profile.get("entrance_exam") or "").strip()
        student_score = profile.get("entrance_score")
        typical_score = college.get("typical_score_cutoff")

        if student_exam == "BITSAT" and student_score and typical_score:
            academic_score, is_eligible, reason = _score_based_score(float(student_score), float(typical_score), "BITSAT")
            reasons.append(reason)
        else:
            academic_score = 0.4
            is_eligible = True
            reasons.append("This college admits via BITSAT score — add your BITSAT score to your profile for an accurate match")

    else:
        # Default: TNEA-style percentage cutoff (existing behavior, unchanged).
        academic_value, academic_label = get_effective_academic_score(profile)
        min_cutoff = float(college.get("min_cutoff_percentage") or 0)

        if academic_value > 0 and min_cutoff > 0:
            academic_score, is_eligible, reason = _percentage_based_score(academic_value, academic_label, min_cutoff)
            reasons.append(reason)
        else:
            # No cutoff data on file for the college, or student hasn't entered
            # their percentage/marks yet. We can't assess eligibility either
            # way — treat as unknown rather than pretending it's a good fit.
            academic_score = 0.4
            if academic_value == 0:
                reasons.append("Add your 12th percentage (and PCM marks, if applicable) to get an accurate eligibility match")
    score += academic_score * 0.40

    # ── 2. Course/Category Match (25%) ────────────────────────────────────────
    preferred_cat = (profile.get("preferred_course_category") or "").lower()
    college_courses = (college.get("courses_offered") or "").lower()
    college_category = (college.get("category") or "").lower()
    interests = (profile.get("interests") or "").lower()

    # Some colleges store subject area in `category` (e.g. "Engineering"),
    # others in `courses_offered` only (e.g. "Mechanical Engineering, Computer
    # Science"). Check both fields, and treat a category match as a strong
    # signal on its own — a college's category is a more reliable signal of
    # subject area than parsing free-text course names.
    # `category` is the authoritative subject-area field (Engineering /
    # Medical / Polytechnic / Arts and Science / etc). Course names can
    # contain misleading substrings — e.g. a Polytechnic diploma named
    # "Diploma in Mechanical Engineering" contains the word "engineering"
    # but the college is NOT an engineering degree college. So a real match
    # requires the category field itself to match; courses_offered is only
    # used as a secondary signal once category already agrees, or for the
    # interest-based fallback below.
    # The real category values that exist in our college data (must match
    # the dropdown options in the profile form exactly). Used to detect
    # when a student's saved preferred_course_category doesn't correspond
    # to anything real — e.g. leftover/stale data from before the dropdown
    # was corrected.
    KNOWN_CATEGORIES = {
        "engineering", "medical", "law", "management", "arts and science",
        "polytechnic", "distance education", "international universities"
    }

    if preferred_cat and preferred_cat == college_category:
        cat_score = 1.0
        reasons.append(f"Offers your preferred {profile.get('preferred_course_category')} courses")
    elif (
        interests
        and _categories_related(preferred_cat, college_category)
        and any(i.strip() in college_courses for i in interests.split(",") if i.strip())
    ):
        # Interest match alone (without a category match) is a weaker
        # signal — it just means a course NAME contains the interest
        # keyword. Still gated by category relevance so an Engineering
        # aspirant's "Computer Science" interest doesn't light up Law or
        # Medical colleges just because the words happen to appear there.
        cat_score = 0.5
        reasons.append("Matches your interests")
    elif not preferred_cat or preferred_cat not in KNOWN_CATEGORIES:
        # The student's preferred category doesn't correspond to any real
        # category in our data (e.g. a stale/invalid value from before the
        # dropdown was corrected). We can't match on category here, so fall
        # back entirely to interest relevance — still gated so an unrelated
        # category doesn't get credited just because a keyword appears in
        # its course list.
        if interests and any(i.strip() in college_courses for i in interests.split(",") if i.strip()):
            cat_score = 0.45
            reasons.append("Matches your interests (your preferred category couldn't be matched — please update your profile)")
        else:
            cat_score = 0.25
            reasons.append("Your preferred category couldn't be matched to a known subject area — please update your profile")
    else:
        cat_score = 0.3
    score += cat_score * 0.25

    # ── 3. College Type & Preferred State Match (15%) ─────────────────────────
    # college_type is a real column (Government/Private/Deemed) — separate
    # from `category`, which is always a subject area (Engineering/Law/
    # Medical/etc) and never held type info. Previously this checked type
    # against `category`, which could never match, so this preference was
    # silently a no-op for every college.
    preferred_type = (profile.get("preferred_college_type") or "").lower()
    actual_type = (college.get("ownership_type") or "").lower()

    if not preferred_type or preferred_type == "no preference":
        type_score = 0.7  # student has no preference, so this shouldn't drag the score down
    elif not actual_type:
        type_score = 0.6  # unknown type — stay neutral rather than penalizing
    elif preferred_type == actual_type:
        type_score = 1.0
        reasons.append(f"Matches your preferred college type ({college.get('ownership_type')})")
    else:
        type_score = 0.35

    # ── STATE: hard filter — exclude out-of-state colleges entirely when
    # the student has set a state preference. Previously this was a soft
    # score penalty (0.25) which still let out-of-state colleges appear.
    preferred_states_raw = (profile.get("preferred_states") or "").strip().lower()
    college_state = (college.get("state") or "").lower()

    if preferred_states_raw and college_state:
        preferred_state_list = [s.strip() for s in preferred_states_raw.split(",") if s.strip()]
        state_match = any(
            college_state == s or college_state in s or s in college_state
            for s in preferred_state_list
        )
        if state_match:
            state_score = 1.0
            reasons.append(f"Located in your preferred state ({college.get('state')})")
        else:
            # Hard exclude — don't show out-of-state colleges at all
            return 0.0, [f"Outside your preferred state(s) — this college is in {college.get('state')}"], False
    else:
        state_score = 0.7  # neutral default when no preference is set

    # Blend type and state into the same 15% weight (60% state / 40% type —
    # state tends to matter more practically for an Indian student than the
    # government/private/deemed distinction).
    combined_score = state_score * 0.6 + type_score * 0.4
    score += combined_score * 0.15

    # ── 4. Budget Fit (20%) ───────────────────────────────────────────────────
    budget = profile.get("budget_range") or ""
    fees_min = float(college.get("fees_min") or 0)
    fees_max = float(college.get("fees_max") or 0)

    budget_map = {
        "Under 1 Lakh": 100000,
        "1-3 Lakhs": 300000,
        "3-5 Lakhs": 500000,
        "5-10 Lakhs": 1000000,
        "Above 10 Lakhs": float("inf")
    }
    budget_limit = budget_map.get(budget, float("inf"))

    if fees_min > 0 and fees_max > 0:
        avg_fee = (fees_min + fees_max) / 2
        if avg_fee <= budget_limit:
            budget_score = 1.0
            reasons.append("Fits within your budget")
        elif avg_fee <= budget_limit * 1.3:
            budget_score = 0.5
            reasons.append("Slightly above budget but manageable")
        else:
            budget_score = 0.1
    else:
        budget_score = 0.5
    score += budget_score * 0.20

    return round(score, 4), reasons, is_eligible


def _is_below_cutoff(profile, college):
    """
    Returns True if the student's relevant metric (percentage, rank, or
    BITSAT score) is below this college's cutoff — used for the
    "Recommended" -> "Suitable" soft cap. Mirrors the dispatch logic in
    calculate_college_score so the cap stays consistent with the score itself.
    """
    admission_basis = (college.get("admission_basis") or "TNEA").strip()
    RANK_BASED_EXAMS = {"JEE Main", "JEE Advanced", "VITEEE", "SRMJEEE", "MET"}

    if admission_basis in RANK_BASED_EXAMS:
        student_exam = (profile.get("entrance_exam") or "").strip()
        student_score = profile.get("entrance_score")
        typical_rank = college.get("typical_rank_cutoff")
        if student_exam == admission_basis and student_score and typical_rank:
            return float(student_score) > float(typical_rank)  # higher rank number = worse
        return False  # unknown — don't cap on missing data
    elif admission_basis == "BITSAT":
        student_exam = (profile.get("entrance_exam") or "").strip()
        student_score = profile.get("entrance_score")
        typical_score = college.get("typical_score_cutoff")
        if student_exam == "BITSAT" and student_score and typical_score:
            return float(student_score) < float(typical_score)
        return False
    else:
        academic_value, _ = get_effective_academic_score(profile)
        min_cutoff = float(college.get("min_cutoff_percentage") or 0)
        return academic_value > 0 and min_cutoff > 0 and academic_value < min_cutoff


def get_recommendations(profile: dict, colleges: List[dict]) -> List[dict]:
    """
    Main recommendation function.
    Combines rule-based scoring with TF-IDF interest matching.
    Returns list of recommendation dicts sorted by score desc.
    """
    if not colleges:
        return []

    # Hard filter: exclude colleges that don't admit the student's gender.
    # This is a binary eligibility fact, not a score factor — a student
    # simply cannot apply, so it should never appear in results at all.
    student_gender = (profile.get("gender") or "").strip().lower()
    if student_gender:
        def _gender_allowed(college):
            restriction = (college.get("gender_eligibility") or "Co-ed").strip().lower()
            if restriction in ("co-ed", ""):
                return True
            if restriction == "men only":
                return student_gender == "male"
            if restriction == "women only":
                return student_gender == "female"
            return True  # unrecognized value — don't exclude on unclear data

        colleges = [c for c in colleges if _gender_allowed(c)]

    if not colleges:
        return []

    # ── TF-IDF Similarity for interest matching ───────────────────────────────
    student_interests = " ".join([
        profile.get("interests") or "",
        profile.get("preferred_course_category") or "",
        profile.get("twelfth_stream") or "",
    ]).strip()

    college_texts = [
        f"{c.get('name','')} {c.get('category','')} {c.get('courses_offered','')} {c.get('description','')}"
        for c in colleges
    ]

    tfidf_boost = [0.0] * len(colleges)
    if student_interests and any(t.strip() for t in college_texts):
        try:
            vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
            all_texts = [student_interests] + college_texts
            tfidf_matrix = vectorizer.fit_transform(all_texts)
            similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            tfidf_boost = similarities.tolist()
        except Exception:
            tfidf_boost = [0.0] * len(colleges)

    # ── Combine scores ─────────────────────────────────────────────────────────
    results = []
    for i, college in enumerate(colleges):
        rule_score, reasons, is_eligible = calculate_college_score(profile, college)

        # Hard exclude: student's marks are far enough below this college's
        # cutoff that showing it as a recommendation would be misleading.
        if not is_eligible:
            continue

        # Hard exclude: when the student has a valid, known preferred
        # category and this college's category is a completely unrelated
        # subject area (e.g. Law/Arts/Polytechnic when they asked for
        # Medical), don't show it at all — a softer cap on the level still
        # left clearly-irrelevant colleges cluttering the list. A student
        # who picked "Medical" should not see Law or Engineering colleges
        # just because academics/budget happen to line up.
        pref_cat_lower = (profile.get("preferred_course_category") or "").lower()
        college_cat_lower = (college.get("category") or "").lower()
        KNOWN_CATS = {
            "engineering", "medical", "law", "management", "arts and science",
            "polytechnic", "distance education", "international universities"
        }
        if (
            pref_cat_lower in KNOWN_CATS
            and college_cat_lower
            and pref_cat_lower != college_cat_lower
            and not _categories_related(pref_cat_lower, college_cat_lower)
        ):
            continue

        # Blend: 80% rule-based + 20% TF-IDF boost
        final_score = round(rule_score * 0.8 + tfidf_boost[i] * 0.2, 4)
        level = get_level(final_score)

        # Soft cap: even if budget/interest/type scores are great, a college
        # the student is below-cutoff for should never read as "Recommended"
        # or "Highly Recommended" — cap it at "Suitable" at best.
        if _is_below_cutoff(profile, college) and level in ("Highly Recommended", "Recommended"):
            level = "Suitable"

        # Budget is a hard constraint, not an academic-fit signal — tag
        # colleges well outside the student's budget separately rather than
        # folding them into "Suitable" (which implies academic/category fit,
        # not cost fit). Keeps the level vocabulary honest about what's wrong.
        budget = profile.get("budget_range") or ""
        budget_map = {
            "Under 1 Lakh": 100000, "1-3 Lakhs": 300000, "3-5 Lakhs": 500000,
            "5-10 Lakhs": 1000000, "Above 10 Lakhs": float("inf")
        }
        budget_limit = budget_map.get(budget, float("inf"))
        fees_min = float(college.get("fees_min") or 0)
        fees_max = float(college.get("fees_max") or 0)
        over_budget = False
        if budget and fees_min > 0 and fees_max > 0:
            avg_fee = (fees_min + fees_max) / 2
            if avg_fee > budget_limit * 1.3:
                over_budget = True
                level = "Over Budget"

        results.append({
            "college_id": college["id"],
            "college_name": college.get("name"),
            "score": final_score,
            "level": level,
            "reasons": reasons
        })

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def get_course_recommendations(profile: dict, colleges: List[dict]) -> List[dict]:
    """
    Recommends individual COURSES (not colleges) based on the student's
    profile. Courses are extracted from each college's free-text
    `courses_offered` field, deduplicated by course name, and scored by:
      - Stream/category alignment (does the course match preferred_course_category?)
      - Interest match (TF-IDF-style keyword overlap with student interests)
      - Availability — how many eligible colleges (cutoff-wise) offer it

    Returns a list of {course_name, score, level, reasons, available_at}
    sorted by score descending. `available_at` lists up to 5 colleges,
    cutoff-eligible first, so a student can see where the course is realistic.
    """
    if not colleges:
        return []

    preferred_cat = (profile.get("preferred_course_category") or "").lower()
    interests = [i.strip().lower() for i in (profile.get("interests") or "").split(",") if i.strip()]
    academic_value, _ = get_effective_academic_score(profile)

    # Common interest keywords expand to related terms that actually appear
    # in course names. A literal substring check alone misses this — e.g.
    # "ai" doesn't appear as a substring of "artificial intelligence and
    # machine learning" or "data science", so without this map a student
    # who types "AI" only ever matches a course literally named "AI".
    INTEREST_SYNONYMS = {
        "ai": ["artificial intelligence", "machine learning", "data science", "deep learning", "robotics", "neural"],
        "artificial intelligence": ["ai", "machine learning", "data science", "deep learning"],
        "machine learning": ["ai", "artificial intelligence", "data science", "deep learning"],
        "ml": ["machine learning", "ai", "artificial intelligence", "data science"],
        "data science": ["ai", "artificial intelligence", "machine learning", "analytics", "statistics"],
        "computer science": ["computer", "software", "information technology", "it", "programming"],
        "cs": ["computer science", "computer", "software", "information technology"],
        "software": ["computer science", "software engineering", "information technology"],
        "biotechnology": ["biotech", "biomedical", "biology", "biological"],
        "biology": ["biotechnology", "biomedical", "biological", "life sciences"],
        "medicine": ["medical", "mbbs", "clinical", "health sciences"],
        "mechanical": ["automobile", "production", "industrial", "manufacturing"],
        "civil": ["construction", "structural", "infrastructure"],
        "electronics": ["electrical", "electronics and communication", "ece", "vlsi", "embedded"],
        "electrical": ["electronics", "power", "energy"],
        "finance": ["accounting", "commerce", "economics", "banking"],
        "business": ["management", "commerce", "mba", "administration"],
        "law": ["legal", "llb", "judiciary"],
        "design": ["architecture", "fashion", "creative", "fine arts"],
    }

    def _expand_interest(term):
        expanded = {term}
        expanded.update(INTEREST_SYNONYMS.get(term, []))
        return expanded

    expanded_interests = set()
    for term in interests:
        expanded_interests.update(_expand_interest(term))

    # Gender filter — same hard rule as college recommendations.
    student_gender = (profile.get("gender") or "").strip().lower()

    def _gender_allowed(college):
        restriction = (college.get("gender_eligibility") or "Co-ed").strip().lower()
        if restriction in ("co-ed", ""):
            return True
        if restriction == "men only":
            return student_gender == "male"
        if restriction == "women only":
            return student_gender == "female"
        return True

    eligible_colleges = [c for c in colleges if not student_gender or _gender_allowed(c)]

    # course_name (lowercased, for dedup) -> aggregated data
    course_map = {}

    for college in eligible_colleges:
        raw_courses = (college.get("courses_offered") or "")
        college_category = (college.get("category") or "").lower()
        min_cutoff = float(college.get("min_cutoff_percentage") or 0)
        is_cutoff_eligible = (
            academic_value == 0 or min_cutoff == 0 or
            academic_value >= min_cutoff - HARD_CUTOFF_GAP
        )

        for course_name in raw_courses.split(","):
            course_name = course_name.strip()
            if not course_name:
                continue
            key = course_name.lower()

            if key not in course_map:
                course_map[key] = {
                    "course_name": course_name,
                    "colleges": [],
                    "category_match": False,
                    "interest_match": False,
                }

            entry = course_map[key]
            entry["colleges"].append({
                "college_id": college.get("id"),
                "college_name": college.get("name"),
                "min_cutoff_percentage": min_cutoff,
                "is_cutoff_eligible": is_cutoff_eligible,
            })
            if preferred_cat and preferred_cat == college_category:
                entry["category_match"] = True
            if interests and any(term in key for term in expanded_interests):
                entry["interest_match"] = True

    results = []
    for entry in course_map.values():
        reasons = []

        # When the student has stated specific interests, those should drive
        # ranking — a broad category match alone (e.g. "Engineering") is not
        # enough to call something "Recommended" if it doesn't match what
        # they actually said they're interested in. Category match without
        # interest match becomes a weak signal in that case.
        has_stated_interests = bool(interests)

        if has_stated_interests:
            if entry["interest_match"] and entry["category_match"]:
                score = 0.95
                reasons.append("Matches your stated interests")
                reasons.append(f"Also aligns with your preferred {profile.get('preferred_course_category')} category")
            elif entry["interest_match"]:
                score = 0.8
                reasons.append("Matches your stated interests")
            elif entry["category_match"]:
                score = 0.4  # category alone, no interest match — weak signal now
                reasons.append(f"In your preferred {profile.get('preferred_course_category')} category, but doesn't match your stated interests")
            else:
                score = 0.2
        else:
            # No stated interests — fall back to category-only scoring.
            score = 0.3
            if entry["category_match"]:
                score += 0.4
                reasons.append(f"Aligns with your preferred {profile.get('preferred_course_category')} category")

        eligible_count = sum(1 for c in entry["colleges"] if c["is_cutoff_eligible"])
        if eligible_count == 0:
            # No college offering this course is within reach academically —
            # don't recommend it, regardless of how well it matches interests.
            continue
        elif eligible_count >= 3:
            reasons.append(f"Offered at {eligible_count} colleges you're eligible for")

        score = min(score, 1.0)
        level = get_level(score)

        # Sort colleges for this course: eligible ones first, then by cutoff asc
        sorted_colleges = sorted(
            entry["colleges"],
            key=lambda c: (not c["is_cutoff_eligible"], c["min_cutoff_percentage"])
        )

        results.append({
            "course_name": entry["course_name"],
            "score": round(score, 4),
            "level": level,
            "reasons": reasons,
            "available_at": [
                {"college_id": c["college_id"], "college_name": c["college_name"], "is_cutoff_eligible": c["is_cutoff_eligible"]}
                for c in sorted_colleges[:5]
            ],
            "total_colleges_offering": len(entry["colleges"])
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results