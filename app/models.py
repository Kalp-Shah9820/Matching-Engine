from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

# ─── INPUT MODELS (what the API accepts) ───────────────────────────────────────

class JobDescriptionIn(BaseModel):
    title: str
    company: Optional[str] = None
    overview: Optional[str] = None
    core_requirements: Optional[str] = None        # free text or bullet list
    preferred_quals: Optional[str] = None
    responsibilities: Optional[str] = None
    required_skills: Optional[str] = None          # comma-separated: "Python, FastAPI, RAG"
    employment_type: Optional[str] = None          # "Full-time", "Contract"
    location: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "AI Engineer",
                "company": "Acme Corp",
                "overview": "We are seeking an AI Engineer...",
                "required_skills": "Python, LLMs, RAG, FastAPI, Vector Databases",
                "employment_type": "Full-time",
                "location": "Remote"
            }
        }


class CandidateIn(BaseModel):
    candidate_id: Optional[str] = None            # if None, one will be generated
    submission_id: Optional[str] = None
    name: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    years_of_experience: Optional[float] = None
    education_status: Optional[str] = None
    looking_for: Optional[str] = None             # "FULL_TIME", "PART_TIME" etc.
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    degree: Optional[str] = None
    notice_period: Optional[str] = None
    open_to_working_at: Optional[str] = None
    gen_ai_experience: Optional[str] = None       # "1 to 1.5 Years", "None" etc.
    expected_salary: Optional[float] = None
    engineer_type: Optional[str] = None           # "Backend Engineer", "AI Engineer"
    programming_languages: Optional[str] = None   # "Python, Java, C++"
    backend_frameworks: Optional[str] = None      # "FastAPI, Django, Flask"
    frontend_technologies: Optional[str] = None
    mobile_technologies: Optional[str] = None
    parsed_summary: Optional[str] = None          # bullet point achievements
    parsed_skills: Optional[str] = None           # full cleaned skills string
    parsed_work_experience: Optional[str] = None  # raw JSON-like work history blob
    parsed_education: Optional[str] = None
    is_actively_looking: Optional[bool] = True
    currently_employed: Optional[bool] = None
    recent_company_type: Optional[str] = None     # "PRODUCT", "SERVICE"
    recent_company_funded: Optional[bool] = None
    recent_company_size: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Isha Thakur",
                "location": "Delhi - NCR",
                "current_title": "Software Development Engineer",
                "years_of_experience": 1.0,
                "engineer_type": "Backend Engineer",
                "programming_languages": "Python, PHP",
                "backend_frameworks": "Django, FastAPI",
                "parsed_skills": "Python, SQL, OpenAI, LangChain, FastAPI, Docker, Pinecone",
                "gen_ai_experience": "2+ Years",
                "looking_for": "Full-time role"
            }
        }


# ─── BULK UPLOAD MODEL ─────────────────────────────────────────────────────────

class BulkCandidateIn(BaseModel):
    candidates: List[CandidateIn]


class BulkJDIn(BaseModel):
    job_descriptions: List[JobDescriptionIn]


# ─── RESPONSE MODELS (what the API returns) ────────────────────────────────────

class JobDescriptionOut(BaseModel):
    jd_id: str
    title: str
    company: Optional[str]
    required_skills: Optional[str]
    location: Optional[str]
    employment_type: Optional[str]
    created_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True


class CandidateOut(BaseModel):
    candidate_id: str
    name: Optional[str]
    current_title: Optional[str]
    years_of_experience: Optional[float]
    location: Optional[str]
    engineer_type: Optional[str]
    programming_languages: Optional[str]
    parsed_skills: Optional[str]

    class Config:
        from_attributes = True


# ─── MATCH RESPONSE MODELS ─────────────────────────────────────────────────────

class MatchSummary(BaseModel):
    """
    Returned by GET /match/{jd_id}
    One entry per candidate in the ranked list.
    """
    rank: int
    candidate_id: str
    name: Optional[str]
    current_title: Optional[str]
    location: Optional[str]
    score: float                        # 0.0 to 1.0
    score_percent: str                  # "87%" — for display
    explanation: str                    # 1-2 sentence summary of why they ranked here

    class Config:
        from_attributes = True


class MatchDetail(BaseModel):
    """
    Returned by GET /match/{jd_id}/{candidate_id}
    Full breakdown for one candidate against one JD.
    """
    rank: int
    candidate_id: str
    jd_id: str
    name: Optional[str]
    current_title: Optional[str]
    years_of_experience: Optional[float]
    location: Optional[str]
    score: float
    score_percent: str

    # Detailed reasoning sections
    skills_matched: List[str]           # ["Python", "FastAPI", "RAG"]
    skills_missing: List[str]           # ["Kubernetes", "MLflow"]
    experience_note: str                # "Has 1 year exp; JD requires 2+"
    education_note: str                 # "B.Tech in IT from Techno Main"
    company_context: str                # "Works at a funded product company"
    explanation: str                    # full human-readable paragraph

    class Config:
        from_attributes = True


# ─── UTILITY RESPONSE ──────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    message: str
    count: int                          # how many records were saved
    ids: Optional[List[str]] = None     # list of jd_ids or candidate_ids created