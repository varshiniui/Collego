# Collego

Collego is an AI-powered college admissions guidance platform built for Indian students. It matches students to colleges and courses based on academic eligibility, budget, location preference, and interests, and gives counselors and administrators the tools to support students through the application process.

**Live application:** https://collego-vert.vercel.app
**Repository:** https://github.com/varshiniui/Collego

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Recommendation Engine](#recommendation-engine)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Choosing the right college is one of the most consequential decisions a student makes, and in India the process is complicated by a wide range of entrance exams, cutoff systems, admission bodies, and fee structures that vary significantly by state, category, and institution type. Collego addresses this by combining a structured college database with a rule-based and content-based recommendation engine, wrapped in three purpose-built interfaces: one for students, one for counselors, and one for administrators.

The platform currently maintains data on several hundred institutions across engineering, medical, management, law, arts and science, polytechnic, distance education, and select international universities, along with each institution's admission basis, cutoff data, fee range, and course offerings.

---

## Key Features

### For Students

- **Profile-driven matching**: Students enter academic details (10th and 12th marks, stream, entrance exam scores or ranks), preferences (course category, budget, preferred states, college type), and interests.
- **College recommendations**: A weighted scoring engine ranks colleges by academic fit, budget fit, category match, and location, and classifies each into a recommendation level (Highly Recommended, Recommended, Suitable, Alternative Option, or Over Budget).
- **Course recommendations**: In addition to college-level matches, the platform recommends individual courses based on stated interests and stream, showing which eligible colleges offer each course.
- **Eligibility calculator**: Automatic TNEA-style cutoff calculation from Maths, Physics, and Chemistry marks for students in the relevant stream, alongside support for rank-based (JEE, VITEEE, SRMJEEE) and score-based (BITSAT) admission systems.
- **Application tracking**: Students can start, submit, and track applications to colleges through defined status stages.
- **Document management**: Secure upload and storage of marksheets, certificates, and scorecards.
- **Saved colleges and courses**: Bookmark colleges and courses for later reference.
- **Scholarships**: Browse scholarship opportunities relevant to the student's profile.
- **PDF reports**: Download a personalized recommendation report summarizing matched colleges, courses, and reasoning.

### For Counselors

- Dashboard view of assigned students and their application progress.
- Ability to review student profiles, documents, and recommendations.
- Authority to update application statuses beyond what students can self-report (e.g., moving an application to Under Review, Admission Offered, or Admission Confirmed).

### For Administrators

- Full college database management (add, edit, delete, bulk import via CSV).
- Course catalog oversight.
- Student and counselor account management.
- Platform-wide reporting and analytics.
- AI engine configuration and platform settings.

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Tailwind CSS
- Lucide icons
- Deployed on Vercel

**Backend**
- Python, Flask
- RESTful JSON API organized by Blueprint (student, counselor, admin, auth)
- scikit-learn (TF-IDF vectorization and cosine similarity for interest-based matching)
- Deployed on Render

**Database and Storage**
- Supabase (PostgreSQL)
- Supabase Storage for student document uploads
- Supabase Auth for authentication and role-based access control

---

## Architecture

Collego follows a standard client-server architecture with a decoupled frontend and backend:

```
React (Vite) frontend  --->  Flask REST API  --->  Supabase (PostgreSQL + Storage + Auth)
     (Vercel)                    (Render)
```

- The frontend communicates with the backend exclusively over authenticated HTTP requests.
- The backend enforces role-based access control (student, counselor, admin) on every route via a shared authentication middleware.
- All persistent data — colleges, courses, student profiles, applications, saved items, documents, and recommendations — is stored in Supabase/PostgreSQL.
- The recommendation engine runs server-side in Flask and reads directly from the colleges table; results are persisted to a `recommendations` table so they can be displayed, sorted, and reported on without recomputation on every page load.

---

## Recommendation Engine

The core of Collego is a hybrid recommendation system that combines rule-based scoring with content-based similarity matching.

**Scoring model** (per college, weighted):

| Factor | Weight | Description |
|---|---|---|
| Academic eligibility | 40% | Compares the student's percentage, rank, or entrance score against the college's cutoff, using the admission system appropriate to that college (percentage-based, rank-based, or score-based) |
| Course/category match | 25% | Matches the student's preferred course category and interests against the college's subject area and course offerings |
| College type and location | 15% | Blends state preference (hard filter when set) with college ownership type preference (soft scoring factor) |
| Budget fit | 20% | Compares the college's fee range against the student's stated budget bracket |

A TF-IDF vectorization and cosine similarity pass over college names, categories, course listings, and descriptions provides an additional content-based boost (weighted at 20% of the final score, blended with the 80% rule-based score), so that a student's free-text interests can surface colleges that a strict category match alone would miss.

**Hard filters** (applied before scoring, not scored):
- Gender eligibility (colleges restricted to men-only or women-only institutions are excluded for students outside that eligibility)
- Preferred state (when set, out-of-state colleges are excluded entirely)
- Academic eligibility beyond a defined gap threshold (students far enough below a college's cutoff are excluded rather than shown a misleadingly low score)

**Recommendation levels:**
- Highly Recommended
- Recommended
- Suitable
- Alternative Option
- Over Budget (a separate designation used when a college is otherwise a reasonable academic and category fit but its fees substantially exceed the student's stated budget)

---

## Project Structure

```
Collego/
├── backend/
│   ├── app.py                  Flask application entry point
│   ├── routes/                 API route blueprints (student, counselor, admin, auth)
│   ├── ml/
│   │   ├── recommendation_engine.py    College and course scoring logic
│   │   └── report_generator.py         PDF report generation
│   ├── utils/
│   │   ├── supabase_client.py  Supabase client initialization
│   │   └── auth_middleware.py  Role-based route protection
│   ├── seed_colleges.py        CSV-based college database seeding script
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── student/         Dashboard, profile, recommendations, applications, etc.
    │   │   ├── counselor/       Counselor dashboard and student review views
    │   │   └── admin/           College, course, student, and platform management
    │   ├── components/          Shared and role-specific UI components
    │   └── lib/api.js           Centralized API client
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Supabase project (with the database schema set up per [Database Setup](#database-setup))

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see [Environment Variables](#environment-variables)), then run:

```bash
python app.py
```

To load the initial college dataset:

```bash
python seed_colleges.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend API URL to be configured via an environment variable (see below).

---

## Environment Variables

**Backend (`backend/.env`)**

```
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-service-role-or-anon-key
```

**Frontend (`frontend/.env`)**

```
VITE_API_URL=http://localhost:5000
```

In production, `VITE_API_URL` points to the deployed Render backend URL.

---

## Database Setup

Collego expects the following core tables in Supabase/PostgreSQL:

- `colleges` — institution records, including `name`, `category`, `ownership_type`, `location`, `state`, `courses_offered`, `min_cutoff_percentage`, `fees_min`, `fees_max`, `ranking`, `admission_basis`, `typical_rank_cutoff`, `gender_eligibility`, and `is_active`
- `student_profiles` — academic details, preferences, and calculated cutoffs per student
- `recommendations` — generated college recommendations per student, with score, level, and reasons
- `applications` — application records and status tracking
- `saved_colleges` / `saved_courses` — bookmarked items per student
- `student_documents` — metadata for uploaded documents, backed by Supabase Storage
- `users` — account records with role assignment (student, counselor, admin)

A unique constraint on `colleges.name` is required for the CSV seeding script to perform upserts correctly:

```sql
ALTER TABLE colleges ADD CONSTRAINT colleges_name_key UNIQUE (name);
```

`min_cutoff_percentage`, `fees_min`, and `fees_max` should be typed as `numeric` rather than `integer`, since cutoff percentages and fee values are not guaranteed to be whole numbers.

---

## Deployment

- **Frontend**: Deployed on Vercel, connected to the `frontend/` directory of this repository. Every push to `main` triggers an automatic build and deploy.
- **Backend**: Deployed on Render as a web service, connected to the `backend/` directory. Environment variables are configured in the Render dashboard.
- **Database**: Hosted on Supabase, accessed by the backend via the Supabase Python client using the service credentials configured above.

---

## Roadmap

- Expand the college dataset with additional states and institution categories
- Add support for additional rank-based and score-based admission systems
- Introduce counselor-to-student messaging
- Add scholarship eligibility matching tied directly to student profile data
- Improve TF-IDF matching with a richer synonym and keyword expansion set

---

## License

This project is currently unlicensed. All rights reserved by the repository owner unless a license is added.