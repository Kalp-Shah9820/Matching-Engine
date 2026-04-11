from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
import uuid, datetime

Base = declarative_base()

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    jd_id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title             = Column(String, nullable=False)        # "AI Engineer"
    company           = Column(String)
    overview          = Column(Text)                          # paragraph description
    core_requirements = Column(Text)                          # bullet list as text
    preferred_quals   = Column(Text)
    responsibilities  = Column(Text)
    required_skills   = Column(Text)                          # comma-separated skill tags
    employment_type   = Column(String)                        # full-time, contract
    location          = Column(String)
    created_at        = Column(DateTime, default=datetime.datetime.utcnow)


class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id          = Column(String, primary_key=True)  # use original 'id' from sheet
    submission_id         = Column(String)
    name                  = Column(String)
    location              = Column(String)
    current_title         = Column(String)
    years_of_experience   = Column(Float)
    education_status      = Column(String)
    looking_for           = Column(String)                    # FULL_TIME etc.
    current_position      = Column(String)
    current_company       = Column(String)
    degree                = Column(String)
    notice_period         = Column(String)
    open_to_working_at    = Column(String)
    gen_ai_experience     = Column(String)
    expected_salary       = Column(Float)
    engineer_type         = Column(String)                    # Backend, Frontend etc.
    programming_languages = Column(Text)                      # comma-separated
    backend_frameworks    = Column(Text)
    frontend_technologies = Column(Text)
    mobile_technologies   = Column(Text)
    parsed_summary        = Column(Text)                      # bullet achievements
    parsed_skills         = Column(Text)                      # full skills string
    parsed_work_experience= Column(Text)                      # JSON-like work history
    parsed_education      = Column(Text)
    is_actively_looking   = Column(Boolean, default=True)
    currently_employed    = Column(Boolean)
    recent_company_type   = Column(String)                    # PRODUCT / SERVICE
    recent_company_funded = Column(Boolean)
    recent_company_size   = Column(String)
    created_at            = Column(DateTime, default=datetime.datetime.utcnow)


class MatchResult(Base):
    __tablename__ = "match_results"

    match_id     = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jd_id        = Column(String, nullable=False)
    candidate_id = Column(String, nullable=False)
    score        = Column(Float)        # 0.0 to 1.0
    rank         = Column(Integer)      # 1 = best fit
    explanation  = Column(Text)         # human-readable reasoning
    matched_at   = Column(DateTime, default=datetime.datetime.utcnow)